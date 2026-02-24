import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { AnthropicClient } from '@/lib/anthropicClient'
import { extractTextFromPDF, isPDFParseError } from '@/lib/pdfParser'

/**
 * POST /api/admin/vendors/parse
 * Parse vendor updates from text or PDF using AI, for couples managing their wedding vendor team.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Auth check
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token || token !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const contentType = request.headers.get('content-type') || ''
    let textToParse = ''
    let isPDF = false

    // Handle PDF upload
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file') as File | null

      if (!file) {
        return NextResponse.json(
          { success: false, error: 'No file uploaded' },
          { status: 400 }
        )
      }

      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const pdfResult = await extractTextFromPDF(buffer)

      if (isPDFParseError(pdfResult)) {
        return NextResponse.json(
          {
            success: false,
            error: pdfResult.message,
            error_code: pdfResult.code
          },
          { status: 400 }
        )
      }

      textToParse = pdfResult.text
      isPDF = true
    } else {
      // Handle JSON text input
      const body = await request.json()
      textToParse = body.text

      if (!textToParse || typeof textToParse !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Text is required' },
          { status: 400 }
        )
      }
    }

    if (textToParse.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Text cannot be empty' },
        { status: 400 }
      )
    }

    // Fetch existing vendors and wedding settings in parallel
    const [
      { data: existingVendors, error: fetchError },
      { data: weddingSettings }
    ] = await Promise.all([
      supabase.from('vendors').select('id, vendor_name, vendor_type, email, phone, contract_signed, vendor_currency'),
      supabase.from('wedding_settings').select('wedding_date').single()
    ])

    if (fetchError) {
      console.error('Error fetching existing vendors:', fetchError)
    }

    const vendorList = existingVendors?.map(v =>
      `- ${v.vendor_name} (${v.vendor_type}, ID: ${v.id}, contract signed: ${v.contract_signed})`
    ).join('\n') || 'None yet'

    // Build dynamic wedding date context
    const weddingDateStr = weddingSettings?.wedding_date as string | null | undefined

    const subtractMonths = (dateStr: string, months: number): string => {
      const d = new Date(dateStr + 'T00:00:00')
      d.setMonth(d.getMonth() - months)
      return d.toISOString().split('T')[0]
    }
    const subtractDays = (dateStr: string, days: number): string => {
      const d = new Date(dateStr + 'T00:00:00')
      d.setDate(d.getDate() - days)
      return d.toISOString().split('T')[0]
    }

    const weddingDateContext = weddingDateStr
      ? `WEDDING CONTEXT:
- Wedding date (from settings): ${weddingDateStr}
- Use this to calculate due_date values when relative dates are mentioned:
  - "on wedding day" / "day of" / "wedding date" = ${weddingDateStr}
  - "day before" / "eve of wedding" = ${subtractDays(weddingDateStr, 1)}
  - "week before" = ${subtractDays(weddingDateStr, 7)}
  - "1 month before" = ${subtractMonths(weddingDateStr, 1)}
  - "2 months before" = ${subtractMonths(weddingDateStr, 2)}
  - "3 months before" = ${subtractMonths(weddingDateStr, 3)}
  - "4 months before" = ${subtractMonths(weddingDateStr, 4)}
  - "6 months before" = ${subtractMonths(weddingDateStr, 6)}
  - For any other relative reference, calculate from ${weddingDateStr}
- Always output due_date in YYYY-MM-DD format
- Only flag a date mismatch if the invoice explicitly states the wedding date itself (e.g. "wedding date: Sep 14" or "due on wedding day, 14 September") and that date differs from ${weddingDateStr}. Do NOT flag a mismatch just because service/event dates in the invoice (e.g. "catering on 15 Sept") differ from the settings date - those are simply the dates services are performed, not wedding date declarations`
      : `WEDDING CONTEXT:
- Wedding date: not set in settings
- If the invoice or document mentions a wedding date, use it to calculate relative due dates
- Always output due_date in YYYY-MM-DD format`

    const systemPrompt = `You are a wedding vendor update assistant for a couple managing their wedding vendor team.
Extract vendor updates from the provided text and return structured JSON with operations to apply.

THE COUPLE'S CURRENT VENDORS:
${vendorList}

${weddingDateContext}

YOUR JOB:
Parse natural language descriptions of vendor updates and produce operations to apply.
Focus on: recording payments, updating contract status, updating contact info, noting bookings.

OPERATION TYPES:
- action "create": new vendor not in the existing list
- action "update": update to an existing vendor (use the vendor_id from the list above)

VENDOR TYPES (use exactly one of these values):
DJ, Entertainer, Makeup Artist, Photographer, Videographer, Florist, Caterer, Venue, Baker, Officiant, Transportation, Other

PAYMENT STRUCTURE (for new payments to add):
Each payment object:
- id: temporary ID like "new-1", "new-2", etc.
- description: "1st deposit", "2nd payment", "Final payment", "Full payment", etc.
- amount: numeric amount (no currency symbol)
- amount_currency: currency code (EUR, USD, GBP, CAD, etc.)
- paid: true if already paid, false if upcoming/due
- paid_date: "YYYY-MM-DD" if paid (only when paid is true)
- due_date: "YYYY-MM-DD" if a due date is mentioned (optional)
- payment_type: "cash" or "bank_transfer" if mentioned (optional)

FIELDS TO EXTRACT:
- vendor_name: business or person name (REQUIRED)
- vendor_type: one of the VENDOR TYPES above
- vendor_currency: currency code for this vendor (EUR, USD, GBP, CAD, etc.) - infer from payment amounts or explicitly stated currency
- contact_name: contact person name
- email: email address
- phone: phone number (preserve format)
- website: website URL
- contract_signed: true/false (only if explicitly mentioned)
- payments: array of NEW payment objects to add
- notes: any additional context, address, bank details, or other info worth keeping

MATCHING RULES:
1. A vendor matches an existing vendor ONLY if the distinctive part of the vendor_name (the proper noun / business identifier) is the same or clearly abbreviated. Generic category words like "Catering", "Photography", "Studio", "Events" are NOT distinctive. Examples of CORRECT matches: "SANA CATERING SL" matches "Sana Catering" (same distinctive word "Sana"). Examples of INCORRECT matches: "SANA CATERING SL" does NOT match "Carlos Catering" (completely different distinctive words: "Sana" vs "Carlos").
2. Vendor type alone is NEVER sufficient for a match. If the only similarity is vendor_type (e.g., both are "Caterer") or a shared generic category word (e.g., both contain "Catering"), always set action "create".
3. If a name match is found, set action "update" and include the vendor_id and matched_vendor_name.
4. If no name match exists, set action "create" - even if the vendor_type matches an existing vendor.
5. If a vendor reference is ambiguous (name could match multiple vendors), add to clarifications_needed.

IMPORTANT RULES:
- Only include fields explicitly mentioned in the text - do not guess or invent missing fields
- NEVER paraphrase, rename, or embellish payment descriptions - copy them verbatim from the document
- For update operations, only include the fields being changed or added
- For payments: include ONLY new payments being recorded (do not re-list existing ones)
- If the input mentions "paid deposit of 500 euros", create one payment with paid: true
- If the input mentions "deposit of 500 euros due March 1", create one payment with paid: false with a due_date
- If currency is unclear, ask via clarifications_needed
- Set confidence (0-1) based on how clearly the vendor was identified and data extracted
- Preserve phone number formatting as provided

RESPONSE FORMAT:
{
  "operations": [
    {
      "action": "create" | "update",
      "vendor_id": "uuid-if-update",
      "matched_vendor_name": "Name of matched existing vendor",
      "vendor_data": {
        "vendor_name": "Venue Name",
        "vendor_type": "Venue",
        "vendor_currency": "EUR",
        "payments": [
          {
            "id": "new-1",
            "description": "1st deposit",
            "amount": 2000,
            "amount_currency": "EUR",
            "paid": true,
            "paid_date": "2025-03-15"
          }
        ]
      },
      "confidence": 0.95,
      "ambiguous_fields": [],
      "warnings": []
    }
  ],
  "clarifications_needed": [
    {
      "question": "Which vendor did you pay the deposit for?",
      "field": "vendor_name",
      "field_type": "text",
      "operation_index": 0,
      "required": true
    }
  ]
}

Return valid JSON only, no markdown formatting.`

    const anthropic = new AnthropicClient()
    const aiResponse = await anthropic.parseVendorData(
      textToParse,
      existingVendors || [],
      systemPrompt
    )

    if (!aiResponse.operations || !Array.isArray(aiResponse.operations)) {
      throw new Error('Invalid AI response format')
    }

    return NextResponse.json({
      success: true,
      data: {
        operations: aiResponse.operations,
        clarifications_needed: aiResponse.clarifications_needed || [],
        processing_time_ms: Date.now() - startTime
      },
      source: isPDF ? 'pdf' : 'text'
    })
  } catch (error: any) {
    console.error('Vendor parse error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to parse vendor updates',
        processing_time_ms: Date.now() - startTime
      },
      { status: 500 }
    )
  }
}
