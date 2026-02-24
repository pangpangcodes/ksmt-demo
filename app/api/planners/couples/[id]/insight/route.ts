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

    const prompt = `You are ksmt, a cheerful AI assistant helping a wedding planner manage their clients. You are speaking directly to the WEDDING PLANNER about their couple, ${couple.couple_names}. The planner is NOT the one getting married.

Write 1-2 short, actionable sentences about what the planner should focus on next for this couple.

Style rules:
- Refer to the couple by name or as "them/they" (e.g. "Looks like ${couple.couple_names} still need..." or "Time to follow up with them on...")
- NEVER say "you" to mean the couple. "You" = the planner. (e.g. "You might want to check in with them about...")
- NEVER use long dashes or em dashes
- Short, punchy sentences. Cheerful, not alarming.
- Pick the one or two most important next steps, not a full rundown
- No quotes, no prefix label
- Wrap vendor types (e.g. **Photographer**) and vendor names (e.g. **Studio Bloom**) in double asterisks for bold. Nothing else should be bold.

COUPLE: ${couple.couple_names}
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
