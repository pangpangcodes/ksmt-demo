import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token || token !== process.env.PLANNER_PASSWORD) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { couple, vendors, stats } = await request.json()
    const { id } = await params

    if (!couple || !vendors || !stats) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const vendorSummary = vendors.map((v: any) => ({
      name: v.vendor_name,
      type: v.vendor_type,
      status: v.couple_status || 'no status',
    }))

    const prompt = `You are Bridezilla, a cheerful and helpful AI wedding planning assistant. You are speaking to the PLANNER (not the couple). Keep it conversational, warm, and brief.

Write 1-2 short sentences about the most actionable next step for this couple's planning. Keep it punchy and friendly!

Rules:
- Address the planner as "you" (e.g. "Time to nudge them on...")
- NEVER use long dashes or em dashes
- Keep sentences short and easy to scan
- Be cheerful, not serious or alarming
- Focus on one or two things, not a full list
- No quotes, no prefix
- Wrap vendor types (e.g. **Photographer**) and vendor names (e.g. **Studio Bloom**) in double asterisks for bold. Nothing else should be bold.
- Do NOT mention the wedding date or any specific dates. Decisions are urgent now, not "before the wedding."

COUPLE: ${couple.partner1_name} & ${couple.partner2_name}
VENDORS (${vendors.length} total): ${JSON.stringify(vendorSummary)}
STATS: ${stats.booked} booked, ${stats.approved} approved, ${stats.inReview} categories in review, ${stats.vendorTypes} vendor types`

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
    const aiResponse = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = aiResponse.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected AI response type')
    }

    return NextResponse.json({ success: true, insight: content.text.trim() })
  } catch (error) {
    console.error('Error generating insight:', error)
    return NextResponse.json({ success: false, error: 'Failed to generate insight' }, { status: 500 })
  }
}
