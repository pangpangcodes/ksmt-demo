import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabase-client'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch couple by share link
    const { data: couple, error: coupleError } = await supabase
      .from('planner_couples')
      .select('*')
      .eq('share_link_id', id)
      .eq('is_active', true)
      .single()

    if (coupleError || !couple) {
      return NextResponse.json({ success: false, error: 'Invalid link' }, { status: 404 })
    }

    // Fetch vendors
    const { data: vendors } = await supabase
      .from('shared_vendors')
      .select('vendor_name, vendor_type, couple_status')
      .eq('planner_couple_id', couple.id)

    const vendorList = vendors || []
    const vendorSummary = vendorList.map(v => ({
      name: v.vendor_name,
      type: v.vendor_type,
      status: v.couple_status || 'no status',
    }))

    const bookedCount = vendorList.filter(v => v.couple_status === 'booked').length
    const approvedCount = vendorList.filter(v => v.couple_status === 'interested').length
    const pendingCount = vendorList.filter(v => !v.couple_status).length

    const prompt = `You are Bridezilla, a cheerful and supportive AI wedding planning assistant. You are speaking directly to the COUPLE (the bride/groom), not a planner. Keep it warm, excited, and brief.

Write 1-2 short sentences about where they are in their vendor planning and what to focus on next. Be encouraging!

Rules:
- Address the couple as "you" (e.g. "You're making great progress!")
- NEVER use long dashes or em dashes
- Keep sentences short and easy to scan
- Be cheerful, warm, and celebratory
- Focus on encouragement + one clear next step
- Wrap vendor types (e.g. **Photographer**) and vendor names (e.g. **Studio Bloom**) in double asterisks for bold
- Do NOT mention the wedding date or any specific dates. Keep the urgency about acting now, not about a deadline.
- No quotes, no prefix

COUPLE: ${couple.couple_names}
VENDORS (${vendorList.length} total): ${JSON.stringify(vendorSummary)}
STATS: ${bookedCount} booked, ${approvedCount} approved, ${pendingCount} still to review`

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
    console.error('Error generating couple insight:', error)
    return NextResponse.json({ success: false, error: 'Failed to generate insight' }, { status: 500 })
  }
}
