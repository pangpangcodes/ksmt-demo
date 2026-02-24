import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token || token !== process.env.PLANNER_PASSWORD) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { tag, vendor_type, existing_tags } = await request.json()

    if (!tag || !vendor_type || !existing_tags || !Array.isArray(existing_tags)) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: tag, vendor_type, existing_tags' },
        { status: 400 }
      )
    }

    // If no existing tags, cannot suggest
    if (existing_tags.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          original_tag: tag,
          suggested_tag: null,
          confidence: 0
        }
      })
    }

    const prompt = `Given the tag "${tag}" for a ${vendor_type} vendor, check if it's a spelling error or variation of existing tags.

EXISTING TAGS FOR ${vendor_type}:
${existing_tags.join(', ')}

If the tag matches or is very similar to an existing tag, suggest that tag.
If it's clearly a new valid tag, return null.

Examples:
- "cinema" → suggest "cinematic"
- "dron" → suggest "drone"
- "documentry" → suggest "documentary"
- "ultra-modern" → null (new valid tag)

Return JSON only: { "suggested_tag": "cinematic" | null, "confidence": 0.95 }`

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!
    })
    const aiResponse = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }]
    })

    const content = aiResponse.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected AI response type')
    }

    // Parse AI response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response')
    }

    const parsed = JSON.parse(jsonMatch[0])

    return NextResponse.json({
      success: true,
      data: {
        original_tag: tag,
        suggested_tag: parsed.suggested_tag || null,
        confidence: parsed.confidence || 0
      }
    })

  } catch (error) {
    console.error('Error suggesting tag:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to suggest tag' },
      { status: 500 }
    )
  }
}
