import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'get_couples_list',
    description: 'Get the list of all couples managed by this planner, including their wedding dates and venue info.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_couple_vendor_summary',
    description: 'Get the vendor summary for a specific couple, grouped by couple_status, to understand what is still pending vs confirmed.',
    input_schema: {
      type: 'object' as const,
      properties: {
        couple_id: {
          type: 'string',
          description: 'The couple_id field from get_couples_list (NOT share_link_id)',
        },
      },
      required: ['couple_id'],
    },
  },
  {
    name: 'parse_couple',
    description: 'Parse a natural language description of a new couple and extract their details.',
    input_schema: {
      type: 'object' as const,
      properties: {
        description: {
          type: 'string',
          description: 'Natural language description of the couple and their wedding details',
        },
      },
      required: ['description'],
    },
  },
  {
    name: 'open_couple_modal',
    description: 'Instruct the frontend to open the Add Couple modal pre-filled with the given couple data for review before saving.',
    input_schema: {
      type: 'object' as const,
      properties: {
        coupleData: {
          type: 'object',
          description: 'The ParsedCoupleOperation object to pre-fill the modal with',
          properties: {
            action: { type: 'string', enum: ['create', 'update'] },
            couple_data: {
              type: 'object',
              properties: {
                couple_names: { type: 'string' },
                couple_email: { type: 'string' },
                wedding_date: { type: 'string' },
                wedding_location: { type: 'string' },
                venue_name: { type: 'string' },
                notes: { type: 'string' },
              },
            },
            confidence: { type: 'number' },
            warnings: { type: 'array', items: { type: 'string' } },
          },
          required: ['action', 'couple_data'],
        },
      },
      required: ['coupleData'],
    },
  },
  {
    name: 'navigate_to',
    description: 'Instruct the frontend to navigate to a specific page. Use share_link_id from get_couples_list to build couple detail URLs.',
    input_schema: {
      type: 'object' as const,
      properties: {
        url: {
          type: 'string',
          description: 'URL to navigate to. Options: /planners, /planners?view=couples, /planners?view=vendors, /planners?view=settings, or /planners/couples/{share_link_id} to go to a specific couple\'s page.',
        },
      },
      required: ['url'],
    },
  },
]

function isAllowedUrl(url: string): boolean {
  if (['/planners', '/planners?view=couples', '/planners?view=vendors', '/planners?view=settings'].includes(url)) {
    return true
  }
  // Allow /planners/couples/{id} where id is a UUID or a slug
  if (/^\/planners\/couples\/[a-zA-Z0-9_-]+$/.test(url)) {
    return true
  }
  return false
}

const SYSTEM_PROMPT = `You are a helpful AI assistant for ksmt, a wedding planning platform. The user is a professional wedding planner.

Your job is to help planners query their couple and vendor data, and take actions like adding new couples.

UNDERSTANDING KSMT STATUSES AND WORKFLOW (critical - read this first):

Vendor statuses follow a two-step workflow between the couple and the planner:

COUPLE'S FEEDBACK (set by the couple in their shared workspace):
- "Not Reviewed" (null) = couple hasn't looked at this vendor yet; does NOT mean the planner needs to follow up
- "Approved" = couple has given the green light - they like this vendor and the planner can go ahead and confirm the booking
- "Declined" = couple has passed on this vendor ("Not for us" in the UI)

PLANNER ACTION (set by the planner in the Vendor Team view):
- "Booked & Confirmed" = the planner has actively confirmed the booking with this vendor; this is a deliberate planner action, not something the couple sets
- The "Mark as Booked & Confirmed" button only appears on vendors the couple has already approved - approval is the prerequisite for booking

IMPORTANT:
- "Approved" and "Booked" are different stages: Approved = couple said yes; Booked = planner confirmed it
- Couples can only set: Not Reviewed, Approved, Declined
- Planners can set: Not Reviewed, Approved, Booked & Confirmed, Declined
- NEVER interpret "Not Reviewed" as a planner task or suggest follow-up unless explicitly asked
- When a planner confirms a booking, it shows as "Booked & Confirmed" in both the planner's Vendor Team view and the couple's shared workspace

FORMATTING RULES (strictly follow these):
- Format couple names as markdown links using their share_link_id: [Couple Names](/planners/couples/{share_link_id})
- Use **bold** for vendor names and key status info
- Use numbered lists when presenting multiple couples; for each couple show date and location as brief sub-lines
- For status/vendor queries: use exactly this format for the intro line: "[Couple Name link] - [Month D, YYYY], [City, Country]." then add one warm, conversational sentence summarising where things stand (e.g. what's confirmed, what's still in progress); never include venue descriptions, guest counts, budgets, or vibe notes in the intro
- When listing vendors, ALWAYS name each vendor explicitly - never say "these vendors" or "a photographer" without naming them
- Vendor list: list ALL vendors regardless of status; format each as "**Vendor Name** (Type) - Status"; only append a note if planner_note or couple_note is present
- After the vendor list, add one short, friendly closing sentence with the most useful next step or observation (e.g. "Worth nudging them to review the florist before the tasting.")
- Tone: warm and collegial - you are a knowledgeable colleague, not a database printout
BEHAVIOUR GUIDELINES:
- For queries about upcoming weddings or planning status, call get_couples_list first, then call get_couple_vendor_summary for each relevant couple
- You can make multiple tool calls in sequence to gather all needed information
- When the planner wants to add a couple, call parse_couple first, then open_couple_modal with the result
- For navigation requests ("go to vendors", "show settings", "vendors tab", "vendors table"), call navigate_to with the appropriate URL
- When asked to go to a specific couple ("go to Alice and Jasper", "open Bella and Edward"), first call get_couples_list to find their share_link_id, then call navigate_to with /planners/couples/{share_link_id}
- Always call open_couple_modal after parse_couple when adding a couple - don't just describe what you found

QUICK REPLY FORMAT:
When asking a clarification question with discrete options, append a QUICK_REPLIES block at the end of your response. Format:

[QUICK_REPLIES]
Short label|Full message to send when clicked
Another option|Full message for this choice
[/QUICK_REPLIES]

Rules:
- Labels: 2-5 words, shown on buttons
- Prompts: complete sentence the planner would say, that you can act on immediately
- 2-4 options max
- Only use for discrete choices, not open-ended questions
- The block is hidden from the user - they only see buttons`

async function callInternalAPI(url: string, options: RequestInit, baseUrl: string): Promise<any> {
  const fullUrl = `${baseUrl}${url}`
  const res = await fetch(fullUrl, options)
  const data = await res.json()
  return data
}

async function executeTool(
  toolUse: Anthropic.ToolUseBlock,
  internalHeaders: Record<string, string>,
  baseUrl: string,
): Promise<{ toolResult: Anthropic.ToolResultBlockParam; action?: { type: string; payload: any } }> {
  let result: any = null
  let action: { type: string; payload: any } | undefined

  try {
    if (toolUse.name === 'get_couples_list') {
      const data = await callInternalAPI('/api/planners/couples', { headers: internalHeaders }, baseUrl)
      result = data.success
        ? data.data.map((c: any) => ({
            couple_id: c.id,
            share_link_id: c.share_link_id,
            couple_names: c.couple_names,
            couple_email: c.couple_email,
            wedding_date: c.wedding_date,
            wedding_location: c.wedding_location,
            venue_name: c.venue_name,
            notes: c.notes,
          }))
        : { error: data.error }

    } else if (toolUse.name === 'get_couple_vendor_summary') {
      const { couple_id: coupleId } = toolUse.input as { couple_id: string }
      const data = await callInternalAPI(
        `/api/planners/couples/${coupleId}/vendors`,
        { headers: internalHeaders },
        baseUrl
      )
      if (data.success) {
        const vendors = data.data as Array<{ vendor_name: string; vendor_type: string; couple_status: string | null; planner_note?: string; couple_note?: string }>
        const list = vendors.map(v => ({
          name: v.vendor_name,
          type: v.vendor_type,
          status: v.couple_status === 'approved' ? 'Approved'
                : v.couple_status === 'booked'   ? 'Booked'
                : v.couple_status === 'declined' ? 'Declined'
                : 'Not Reviewed',
          ...(v.planner_note && { planner_note: v.planner_note }),
          ...(v.couple_note  && { couple_note:  v.couple_note  }),
        }))
        result = { total: list.length, vendors: list }
      } else {
        result = { error: data.error }
      }

    } else if (toolUse.name === 'parse_couple') {
      const { description } = toolUse.input as { description: string }
      const data = await callInternalAPI(
        '/api/planners/couples/parse',
        {
          method: 'POST',
          headers: internalHeaders,
          body: JSON.stringify({ text: description }),
        },
        baseUrl
      )
      if (data.success && data.data?.operations?.length > 0) {
        result = data.data.operations[0]
      } else {
        result = { error: data.error || 'Could not parse couple details' }
      }

    } else if (toolUse.name === 'open_couple_modal') {
      const { coupleData } = toolUse.input as { coupleData: any }
      action = { type: 'open_couple_modal', payload: coupleData }
      result = { success: true, message: 'Modal will be opened on the frontend' }

    } else if (toolUse.name === 'navigate_to') {
      const { url } = toolUse.input as { url: string }
      if (isAllowedUrl(url)) {
        action = { type: 'navigate', payload: { url } }
        result = { success: true, message: `Will navigate to ${url}` }
      } else {
        result = { error: `Navigation to ${url} is not allowed` }
      }

    } else {
      result = { error: `Unknown tool: ${toolUse.name}` }
    }
  } catch (err: any) {
    result = { error: err.message || 'Tool execution failed' }
  }

  return {
    toolResult: {
      type: 'tool_result' as const,
      tool_use_id: toolUse.id,
      content: JSON.stringify(result),
    },
    action,
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token || token !== process.env.PLANNER_PASSWORD) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { messages, context } = body as {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>
      context?: { view?: string }
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ success: false, error: 'Messages are required' }, { status: 400 })
    }

    const baseUrl = request.nextUrl.origin
    const internalHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }

    const systemPrompt = context?.view
      ? `${SYSTEM_PROMPT}\n\nCurrent view: ${context.view}`
      : SYSTEM_PROMPT

    let currentMessages: Anthropic.MessageParam[] = messages.map(m => ({
      role: m.role,
      content: m.content,
    }))

    const encoder = new TextEncoder()

    const readable = new ReadableStream({
      async start(controller) {
        const send = (data: object) => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
          } catch {
            // Client disconnected - ignore
          }
        }

        try {
          let finalAction: { type: string; payload: any } | null = null
          let iterations = 0
          const MAX_ITERATIONS = 10

          // Phase 1: Non-streaming tool loop
          // Use .create() so no text leaks to the client during tool turns.
          // Loop exits when Claude returns end_turn or has no tool_use blocks.
          let didProcessTools = false

          while (iterations < MAX_ITERATIONS) {
            iterations++

            const response = await anthropic.messages.create({
              model: 'claude-haiku-4-5-20251001',
              max_tokens: 2048,
              system: systemPrompt,
              tools: TOOLS,
              messages: currentMessages,
            })

            const toolUseBlocks = response.content.filter(
              (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
            )

            // No tool calls - we're done gathering data
            if (toolUseBlocks.length === 0 || response.stop_reason === 'end_turn') {
              if (!didProcessTools) {
                // No tools were ever called - send this response's text directly
                const textBlocks = response.content.filter(
                  (b): b is Anthropic.TextBlock => b.type === 'text'
                )
                const text = textBlocks.map(b => b.text).join('\n')
                if (text) send({ type: 'delta', text })
              }
              break
            }

            didProcessTools = true

            // Add Claude's response to message history
            currentMessages.push({ role: 'assistant', content: response.content })

            // Execute all tool calls in parallel
            const results = await Promise.all(
              toolUseBlocks.map(toolUse => executeTool(toolUse, internalHeaders, baseUrl))
            )

            // Collect any actions from tool results
            for (const { action } of results) {
              if (action) finalAction = action
            }

            // Add tool results to message history
            currentMessages.push({
              role: 'user',
              content: results.map(r => r.toolResult),
            })
          }

          // Phase 2: Stream the final response (only if tools were used)
          // After tool processing, currentMessages ends with tool_results.
          // This call generates the text summary - stream it token-by-token.
          if (didProcessTools) {
            const finalStream = anthropic.messages.stream({
              model: 'claude-haiku-4-5-20251001',
              max_tokens: 2048,
              system: systemPrompt,
              tools: TOOLS,
              messages: currentMessages,
            })

            finalStream.on('text', (textDelta) => {
              send({ type: 'delta', text: textDelta })
            })

            await finalStream.finalMessage()
          }

          // Send final action and done event
          if (finalAction) send({ type: 'action', action: finalAction })
          send({ type: 'done' })
        } catch (error: any) {
          send({ type: 'error', message: error.message || 'Something went wrong' })
        }

        try { controller.close() } catch {}
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process chat message' },
      { status: 500 }
    )
  }
}
