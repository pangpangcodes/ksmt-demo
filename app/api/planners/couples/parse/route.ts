import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'
import { AnthropicClient } from '@/lib/anthropicClient'
import { CoupleParseResult } from '@/types/planner'

/**
 * POST /api/planner/couples/parse
 * Parse couple information from natural language text using AI
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Auth check
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token || token !== process.env.PLANNER_PASSWORD) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const textToParse = body.text

    if (!textToParse || typeof textToParse !== 'string' || textToParse.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Text is required' },
        { status: 400 }
      )
    }

    // Fetch existing couples for duplicate detection
    // supabase is already imported
    const { data: existingCouples } = await supabase
      .from('planner_couples')
      .select('id, couple_names, couple_email, wedding_date, venue_name')
      .eq('is_active', true)

    // Build AI system prompt
    const systemPrompt = `You are a wedding couple data extraction assistant for professional wedding planners.
Extract couple information from the provided text and return a structured JSON response.

EXISTING COUPLES:
${existingCouples?.map(c => `- ${c.couple_names} ${c.couple_email ? `(${c.couple_email})` : '(no email)'} - ${c.wedding_date || 'date TBD'}, ${c.venue_name || 'venue TBD'}`).join('\n') || 'None'}

EXTRACT THESE FIELDS:
- couple_names: Couple's names formatted as "Name1 & Name2" (REQUIRED)
- couple_email: Email address for invitations
- wedding_date: Wedding date in YYYY-MM-DD format (REQUIRED for calendar view)
- wedding_location: City or general location
- venue_name: Specific venue name
- notes: Any additional context or planner notes

FORMATTING RULES:
1. couple_names: Format as "Sarah & Mike" or "Sarah and Mike" → "Sarah & Mike"
2. wedding_date: MUST be in YYYY-MM-DD format (e.g., "2026-09-14")
   - If only month/year given, use first day of month (e.g., "September 2026" → "2026-09-01")
   - If only year given, ask for clarification
3. venue_name: Extract specific venue name if mentioned
4. wedding_location: Extract city/region

DUPLICATE DETECTION:
- CRITICAL: To suggest an UPDATE, BOTH couple names AND email must match an existing couple
- If ONLY names match but email is different or missing, treat as CREATE (new couple)
- If names are similar but not exact match, flag as ambiguous and ask for clarification
- If completely new (names don't match any existing couple), set action: 'create'

EXAMPLES:
- Input: "Monica & Kevin, monica@email.com" + Existing: "Monica & Kevin (monica@email.com)" → UPDATE ✓
- Input: "Monica & Kevin" (no email) + Existing: "Monica & Kevin (monica@email.com)" → CREATE (email missing) ✓
- Input: "Monica & Kevin, different@email.com" + Existing: "Monica & Kevin (monica@email.com)" → CREATE (email mismatch) ✓

REQUIRED FIELD VALIDATION:
- wedding_date is REQUIRED - if not provided or ambiguous, add to clarifications_needed
- couple_names is REQUIRED - if not clear, add to clarifications_needed

RESPONSE FORMAT:
{
  "operations": [
    {
      "action": "create" | "update",
      "couple_id": "uuid-if-update",
      "couple_data": {
        "couple_names": "Sarah & Mike",
        "couple_email": "sarah.mike@gmail.com",
        "wedding_date": "2026-09-14",
        "wedding_location": "Marbella, Spain",
        "venue_name": "La Vie Estate",
        "notes": "Boho rustic style, 100 guests"
      },
      "confidence": 0.95,
      "ambiguous_fields": [],
      "warnings": []
    }
  ],
  "clarifications_needed": [
    {
      "question": "What is the exact wedding date?",
      "field": "wedding_date",
      "field_type": "date",
      "operation_index": 0,
      "required": true,
      "context": "Date is required for calendar view"
    }
  ]
}

EXAMPLE INPUTS:
1. "Sarah and Mike getting married September 14, 2026 at La Vie Estate in Marbella"
   → couple_names: "Sarah & Mike", wedding_date: "2026-09-14", venue_name: "La Vie Estate", wedding_location: "Marbella"

2. "Emma & James, june 2027, barcelona beach wedding"
   → couple_names: "Emma & James", wedding_date: "2027-06-01", wedding_location: "Barcelona", notes: "Beach wedding"

3. "Wedding for Lisa and Tom next summer at Hacienda de los Naranjos"
   → NEED CLARIFICATION on wedding_date (which month in summer? which year?)

IMPORTANT RULES:
1. Extract ALL couples found in the text (can be multiple)
2. wedding_date is MANDATORY - request clarification if missing or ambiguous
3. Normalize couple_names to use & instead of "and"
4. Set confidence score (0-1) based on data completeness
5. Flag ambiguous_fields that need clarification
6. If date format is ambiguous (e.g., "3/4/2026" could be March 4 or April 3), ask for clarification

Return valid JSON only, no markdown formatting.`

    // Call Anthropic API
    const anthropic = new AnthropicClient()
    const aiResponse = await anthropic.parseVendorData(
      textToParse,
      existingCouples || [],
      systemPrompt
    )

    // Validate response structure
    if (!aiResponse.operations || !Array.isArray(aiResponse.operations)) {
      throw new Error('Invalid AI response format')
    }

    const result: CoupleParseResult = {
      operations: aiResponse.operations,
      clarifications_needed: aiResponse.clarifications_needed || [],
      processing_time_ms: Date.now() - startTime
    }

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    console.error('Couple parse error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to parse couple information',
        processing_time_ms: Date.now() - startTime
      },
      { status: 500 }
    )
  }
}
