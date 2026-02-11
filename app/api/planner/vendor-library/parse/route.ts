import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'
import { AnthropicClient } from '@/lib/anthropicClient'
import { extractTextFromPDF, isPDFParseError } from '@/lib/pdfParser'
import { VendorParseResult } from '@/types/planner'
import { VENDOR_TYPES, isValidVendorType } from '@/lib/vendorTypes'
import { normalizeTags } from '@/lib/tagUtils'

/**
 * POST /api/planner/vendor-library/parse
 * Parse vendors from text or PDF using AI
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Auth check
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    console.log('Auth check:', {
      receivedToken: token,
      expectedToken: process.env.PLANNER_PASSWORD,
      match: token === process.env.PLANNER_PASSWORD
    })

    if (!token || token !== process.env.PLANNER_PASSWORD) {
      console.error('Auth failed - token mismatch')
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

      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Extract text from PDF
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

    // Fetch existing vendors for duplicate detection
    const { data: existingVendors, error: fetchError } = await supabase
      .from('planner_vendor_library')
      .select('id, vendor_name, vendor_type, email, phone')
      .eq('is_active', true)

    if (fetchError) {
      console.error('Error fetching existing vendors:', fetchError)
    }

    // Build AI system prompt
    // Fetch existing tags for AI to prefer
    const { data: tagsData } = await supabase
      .from('planner_vendor_library')
      .select('tags')
      .eq('is_active', true)
      .not('tags', 'is', null)

    const allTags = new Set<string>()
    tagsData?.forEach(vendor => {
      if (vendor.tags && Array.isArray(vendor.tags)) {
        vendor.tags.forEach(tag => allTags.add(tag))
      }
    })
    const existingTags = Array.from(allTags).slice(0, 50)

    const systemPrompt = `You are a wedding vendor data extraction assistant for professional wedding planners.
Extract vendor information from the provided text and return a structured JSON response.

CRITICAL: The text may contain information about MULTIPLE DISTINCT VENDORS. Look for:
- Different business names or personal names (e.g., "Ivan Budarin" vs "Reece Iveson")
- Multiple pricing sections or packages
- Different contact information (websites, social media, emails)
- Section breaks or headers indicating a new vendor

DO NOT create duplicate entries for the same vendor. Each vendor should appear exactly ONCE.

VENDOR TYPES (use exactly these values):
${VENDOR_TYPES.join(', ')}

EXISTING VENDORS IN LIBRARY:
${existingVendors?.map(v => `- ${v.vendor_name} (${v.vendor_type})`).join('\n') || 'None'}

EXISTING TAG VOCABULARY (prefer these when applicable):
${existingTags.length > 0 ? existingTags.join(', ') : 'None yet - feel free to create appropriate tags'}

EXTRACT THESE FIELDS:
- vendor_type: One of the VENDOR TYPES listed above (REQUIRED)
- vendor_name: Business name (REQUIRED)
- contact_name: Contact person's name
- email: Email address
- phone: Phone number (preserve format)
- website: Website URL
- instagram: Instagram handle (include @ symbol)
- location: City or region where vendor operates
- tags: Array of 3-5 descriptive tags that differentiate this vendor (e.g., ["cinematic", "emotional", "documentary"] for videographers, ["boho", "wildflowers", "sustainable"] for florists). Focus on style, specialty, or unique selling points - not generic terms.
- description: What the vendor offers, their style, and specialties
- pricing: Free-form pricing text, well-formatted to preserve structure (use \\n for line breaks in JSON strings, keep package names, prices, and details clearly formatted)

DUPLICATE DETECTION:
- If vendor name matches an existing vendor, set action: 'update' with vendor_id
- If similar but not exact match, flag as ambiguous and ask for clarification
- If completely new, set action: 'create'

PRICING TEXT FORMAT EXAMPLES:

Example 1 (Hair & Makeup with per-person pricing):
"BRIDE - €297\\nBRIDAL PARTY - €147 per person\\nBRIDE TRIAL - €175\\nBRIDAL PARTY TRIAL - €125 per person"

Example 2 (Officiant with conditions):
"WEDDING CEREMONY IN ENGLISH - €750\\nWEDDING CEREMONY BILINGUAL (ENGLISH & SPANISH) - €900\\nINTERNATIONAL CEREMONY - €1500 plus flights/accommodation\\nTravel charges apply for locations more than 40 minutes outside Marbella"

Example 3 (Videographer with packages and extras):
"PACKAGE ONE - €3950\\n1 videographer - full day coverage (8 hours)\\nFeature film - 40-90 minutes\\nCinematic highlight video - 5-7 minutes\\nAerial drone footage\\nOnline file delivery\\n\\nPACKAGE TWO - €4950\\n2 videographers - full day coverage (8 hours)\\nFeature film - 40-90 minutes\\nInstagram trailer - 1 minute\\nCinematic highlight video - 5-7 minutes\\nAerial drone footage\\nOnline file delivery\\n\\nEXTRAS:\\nDocumentary film (15-20 minutes) - €495\\n1 minute instagram trailer - €295\\nExtra hours - €295 per hour\\nRaw footage - €595"

KEY FORMATTING RULES FOR PRICING:
- CRITICAL: Use \\n (escaped newline) in JSON strings for line breaks
- Keep package/tier names on their own line with pricing
- List details under each package
- Preserve "per person", "per hour", and other unit indicators
- Keep conditional notes (travel charges, seasonal pricing, etc.)
- Use uppercase for package names if that's how they appear in source
- Remember: This is a JSON string, so escape special characters properly

RESPONSE FORMAT:
{
  "operations": [
    {
      "action": "create" | "update",
      "vendor_id": "uuid-if-update",
      "vendor_data": {
        "vendor_type": "Videographer",
        "vendor_name": "Reece Iveson Videography",
        "contact_name": "Reece Iveson",
        "email": "info@example.com",
        "phone": "+34 123 456 789",
        "website": "https://reeceivesonvideography.com",
        "instagram": "@reeceivesonvideography",
        "location": "Seville",
        "tags": ["cinematic", "documentary", "drone"],
        "description": "Professional videographer specializing in cinematic wedding films with documentary-style storytelling and aerial drone footage",
        "pricing": "PACKAGE ONE - €3950\\n1 videographer - full day coverage (8 hours)\\nFeature film - 40-90 minutes\\nCinematic highlight video - 5-7 minutes\\nAerial drone footage\\nOnline file delivery\\n\\nPACKAGE TWO - €4950\\n2 videographers - full day coverage (8 hours)\\nFeature film - 40-90 minutes\\nInstagram trailer - 1 minute\\nCinematic highlight video - 5-7 minutes\\nAerial drone footage\\nOnline file delivery\\n\\nEXTRAS:\\nDocumentary film (15-20 minutes) - €495\\n1 minute instagram trailer - €295\\nExtra hours - €295 per hour\\nRaw footage - €595"
      },
      "confidence": 0.90,
      "ambiguous_fields": [],
      "warnings": []
    }
  ],
  "clarifications_needed": []
}

IMPORTANT RULES:
1. IGNORE document metadata:
   - Headers/footers mentioning document owner (e.g., "Sana Catering's Vendor List")
   - Page numbers, document titles, or compilation notes
   - Only extract vendors with actual vendor information (contact details, pricing, descriptions)
2. Extract ALL DISTINCT vendors found in the text (can be multiple)
3. Identify separate vendors by looking for:
   - Different business/personal names (main identifier)
   - Different contact details (websites, social media, emails, phones)
   - Different pricing structures or packages
   - Clear section breaks or new headers
4. Each unique vendor should create exactly ONE operation - NO DUPLICATES
5. vendor_type must match exactly from the VENDOR_TYPES list
6. If vendor_type is unclear, ask for clarification
7. Preserve phone number formatting as provided
8. Normalize Instagram handles to include @ symbol
9. Tags should be:
   - PREFER tags from the existing vocabulary above when they accurately describe the vendor
   - Create NEW tags only when existing vocabulary doesn't capture unique attributes
   - Lowercase, single words or hyphenated phrases (e.g., "natural-light")
   - 3-5 tags maximum per vendor
   - Differentiators that distinguish this vendor (e.g., "cinematic", "drone" for videographers)
   - NOT generic terms like "professional", "experienced", "quality"
10. For pricing field:
   - Extract pricing as well-formatted text using \\n (escaped newline) for line breaks in JSON
   - Preserve ALL pricing tiers, packages, and extras
   - Keep formatting clear (package names, prices, details)
   - Preserve unit indicators (per person, per hour, etc.)
   - Include conditional notes (travel charges, seasonal pricing, etc.)
   - CRITICAL: Use \\n not actual newlines - this is a JSON string field
11. Set confidence score (0-1) based on data completeness
12. Flag ambiguous_fields that need clarification
13. If required field is missing (vendor_type or vendor_name), add to clarifications_needed

EXAMPLE - If text contains info about "Ivan Budarin" with website A and "Reece Iveson" with website B, create TWO separate operations, one for each vendor.

Return valid JSON only, no markdown formatting.`

    // Call Anthropic API
    const anthropic = new AnthropicClient()
    const aiResponse = await anthropic.parseVendorData(
      textToParse,
      existingVendors || [],
      systemPrompt
    )

    // Validate response structure
    if (!aiResponse.operations || !Array.isArray(aiResponse.operations)) {
      throw new Error('Invalid AI response format')
    }

    // Validate vendor types and normalize tags in all operations
    const clarifications = [...(aiResponse.clarifications_needed || [])]
    const operations = aiResponse.operations.map((op: any, index: number) => {
      const vendorType = op.vendor_data.vendor_type
      const warnings = [...(op.warnings || [])]

      // Check if vendor type is valid
      if (vendorType && !isValidVendorType(vendorType)) {
        warnings.push(`"${vendorType}" is not a recognized vendor category. Set to "Other" - please update if needed.`)

        // Add clarification to alert user
        clarifications.push({
          question: `"${vendorType}" is not a valid vendor category. The vendor "${op.vendor_data.vendor_name || 'Unknown'}" has been set to "Other". Please select the correct category from the dropdown.`,
          field: 'vendor_type',
          field_type: 'choice',
          context: `Parsed category: "${vendorType}"`,
          operation_index: index,
          required: true,
          choices: Array.from(VENDOR_TYPES)
        })

        // Set to "Other" by default
        op.vendor_data.vendor_type = 'Other'
      }

      return {
        ...op,
        vendor_data: {
          ...op.vendor_data,
          tags: op.vendor_data.tags ? normalizeTags(op.vendor_data.tags) : undefined
        },
        warnings
      }
    })

    const result: VendorParseResult = {
      operations,
      clarifications_needed: clarifications,
      processing_time_ms: Date.now() - startTime
    }

    return NextResponse.json({
      success: true,
      data: result,
      source: isPDF ? 'pdf' : 'text'
    })
  } catch (error: any) {
    console.error('Vendor parse error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to parse vendors',
        processing_time_ms: Date.now() - startTime
      },
      { status: 500 }
    )
  }
}
