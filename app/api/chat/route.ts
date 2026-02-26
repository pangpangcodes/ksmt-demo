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
  {
    name: 'mark_vendor_booked',
    description: 'Mark an approved vendor as Booked & Confirmed. Only use when the planner explicitly says they have confirmed the booking. Also navigates to the couple\'s page.',
    input_schema: {
      type: 'object' as const,
      properties: {
        couple_id: {
          type: 'string',
          description: 'The couple_id (UUID) from get_couple_vendor_summary',
        },
        vendor_id: {
          type: 'string',
          description: 'The vendor_id (UUID) from get_couple_vendor_summary',
        },
        share_link_id: {
          type: 'string',
          description: 'The couple\'s share_link_id for navigation',
        },
      },
      required: ['couple_id', 'vendor_id', 'share_link_id'],
    },
  },
]

function isAllowedUrl(url: string): boolean {
  if (['/planners', '/planners?view=couples', '/planners?view=vendors', '/planners?view=settings'].includes(url)) {
    return true
  }
  // Allow /planners/couples/{id} with optional ?tab= query param
  if (/^\/planners\/couples\/[a-zA-Z0-9_-]+(\?tab=(overview|vendors))?$/.test(url)) {
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

CATEGORY-LEVEL RULES (determine the state of each vendor category, then follow the matching rule):

1. ALL vendors "Not Reviewed" → list every vendor in the category with "Not Reviewed" status. Do NOT prompt the planner to follow up unless they ask.
2. One vendor "Approved" → list ONLY the approved vendor. Skip every other vendor in the category. Planner's next step: reach out and lock in the booking, then mark "Booked & Confirmed".
3. One vendor "Booked" or "Booked & Confirmed" → list the booked vendor with "Booked & Confirmed" status. Category is done; no action needed.

IMPORTANT: always list ALL categories that have vendors, including booked ones. The planner needs to see the full picture - what's confirmed, what's approved, and what's still pending.

SKIP RULE: when a category has an Approved or Booked vendor, the other vendors in that category do not exist for the purpose of this response. Do not list, count, reference, or allude to them - not in the vendor list, not in the summary sentence, not anywhere. Never say "other options", "alternatives pending", "still reviewing", or any language that implies other vendors exist.

FORMATTING RULES (strictly follow these):
- Format couple names as markdown links using their share_link_id: [Couple Names](/planners/couples/{share_link_id})
- Use **bold** for vendor names and key status info
- Use numbered lists when presenting multiple couples; for each couple show date and location as brief sub-lines
- For status/vendor queries: use exactly this format for the intro line: "[Couple Name link] - [Month D, YYYY], [City, Country]." then add one warm, conversational sentence summarising where things stand based ONLY on the vendors you are listing (respect the SKIP RULE - do not count or reference vendors you skipped); never include venue descriptions, guest counts, budgets, or vibe notes in the intro
- When listing vendors, ALWAYS name each vendor explicitly - never say "these vendors" or "a photographer" without naming them
- Vendor list: use a two-line format per vendor. Line 1 (no bullet): "**Category** | Status". Line 2 (bullet): "- Vendor Name". Example:

**Photography** | Approved
- Aurora Photography

Do NOT bold the status word. Only append a note on the vendor name line if planner_note or couple_note is present.
- After the vendor list, add one short, friendly closing sentence with the most actionable next step. This sentence must also respect the SKIP RULE - only reference vendors you actually listed.
- Tone: warm and collegial - you are a knowledgeable colleague, not a database printout
BEHAVIOUR GUIDELINES:
- For queries about upcoming weddings or planning status, call get_couples_list first, then call get_couple_vendor_summary for each relevant couple
- You can make multiple tool calls in sequence to gather all needed information
- When the planner wants to add a couple, call parse_couple first, then open_couple_modal with the result
- For navigation requests ("go to vendors", "show settings", "vendors tab", "vendors table"), call navigate_to with the appropriate URL
- When asked to go to a specific couple ("go to Alice and Jasper", "open Bella and Edward"), first call get_couples_list to find their share_link_id, then call navigate_to with /planners/couples/{share_link_id}
- Always call open_couple_modal after parse_couple when adding a couple - don't just describe what you found

QUICK REPLY FORMAT:
ALWAYS append a QUICK_REPLIES block at the end of your response when there are logical next actions. Format:

[QUICK_REPLIES]
Short label|Full message to send when clicked
Another option|Full message for this choice
[/QUICK_REPLIES]

Rules:
- Labels: 2-5 words, shown on buttons
- Prompts: complete sentence the planner would say, that you can act on immediately
- 2-4 options max
- The block is hidden from the user - they only see buttons

When to use quick replies:
- After asking a yes/no or choice question (e.g. "Check vendors?" -> buttons for each couple)
- After showing vendor status with approved vendors -> offer "I've confirmed [Vendor Name]" button for each approved vendor
- After showing a couple overview -> offer "Go to [Couple Name]" buttons
- The "I've confirmed [Vendor Name]" quick reply MUST use the action format so the frontend can fast-path the booking without extra API calls:
  Confirm [Vendor Name]|ACTION:book_vendor:[couple_id]:[vendor_id]:[share_link_id]:[vendor_name]
  You have all four values from prior tool calls (couple_id and vendor_id from get_couple_vendor_summary, share_link_id from get_couples_list). Example:
  Confirm Aurora Photography|ACTION:book_vendor:11111111-aaaa-bbbb-cccc-dddddddddddd:aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee:edward-bella-demo:Aurora Photography

BOOKING CONFIRMATION:
When the planner says they have confirmed a booking with a vendor (e.g. "I've confirmed the booking with Ivan Budarin"), call mark_vendor_booked with the couple_id, vendor_id, and share_link_id. You should already have these from a prior get_couple_vendor_summary call. If not, call get_couples_list and get_couple_vendor_summary first to find the IDs.`

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
      if (data.success) {
        const couples = data.data.map((c: any) => ({
          couple_id: c.id,
          share_link_id: c.share_link_id,
          couple_names: c.couple_names,
          couple_email: c.couple_email,
          wedding_date: c.wedding_date,
          wedding_location: c.wedding_location,
          venue_name: c.venue_name,
          notes: c.notes,
        }))
        result = {
          couples,
          _hint: 'This list does NOT include vendor data. You MUST call get_couple_vendor_summary with each couple_id to get their vendor status. Never assume a couple has no vendors based on this list alone.',
        }
      } else {
        result = { error: data.error }
      }

    } else if (toolUse.name === 'get_couple_vendor_summary') {
      const { couple_id: coupleId } = toolUse.input as { couple_id: string }
      const data = await callInternalAPI(
        `/api/planners/couples/${coupleId}/vendors`,
        { headers: internalHeaders },
        baseUrl
      )
      if (data.success) {
        const vendors = data.data as Array<{ id: string; vendor_name: string; vendor_type: string; couple_status: string | null; planner_note?: string; couple_note?: string }>
        const list = vendors.map(v => ({
          vendor_id: v.id,
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

    } else if (toolUse.name === 'mark_vendor_booked') {
      const { couple_id, vendor_id, share_link_id } = toolUse.input as { couple_id: string; vendor_id: string; share_link_id: string }
      const patchData = await callInternalAPI(
        `/api/planners/couples/${couple_id}/vendors/${vendor_id}`,
        {
          method: 'PATCH',
          headers: internalHeaders,
          body: JSON.stringify({ couple_status: 'booked' }),
        },
        baseUrl
      )
      if (patchData.success) {
        const navUrl = `/planners/couples/${share_link_id}?tab=vendors`
        action = {
          type: 'navigate',
          payload: {
            url: navUrl,
            bookingContext: { vendorId: vendor_id, vendorName: patchData.data?.vendor_name },
          },
        }
        result = { success: true, message: `Vendor marked as Booked & Confirmed. Navigating to vendor team.` }
      } else {
        result = { error: patchData.error || 'Failed to mark vendor as booked' }
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

    // Full conversation history (for Phase 2 contextual response)
    const fullHistory: Anthropic.MessageParam[] = messages.map(m => ({
      role: m.role,
      content: m.content,
    }))

    // Phase 1 uses ONLY the latest user message (no history).
    // This prevents Haiku from answering data queries from stale
    // conversation context instead of calling tools.
    const latestUserContent = messages[messages.length - 1].content
    let toolMessages: Anthropic.MessageParam[] = [
      { role: 'user', content: latestUserContent },
    ]

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

          // Phase 1: Non-streaming tool loop (history-free)
          // Uses only the latest user message so Haiku always calls tools
          // for data queries instead of hallucinating from prior messages.
          let didProcessTools = false

          while (iterations < MAX_ITERATIONS) {
            iterations++

            const response = await anthropic.messages.create({
              model: 'claude-haiku-4-5-20251001',
              max_tokens: 2048,
              system: systemPrompt,
              tools: TOOLS,
              messages: toolMessages,
            })

            const toolUseBlocks = response.content.filter(
              (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
            )

            // No tool calls - we're done gathering data
            if (toolUseBlocks.length === 0) {
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

            // Add Claude's response to tool message chain
            toolMessages.push({ role: 'assistant', content: response.content })

            // Execute all tool calls in parallel
            const results = await Promise.all(
              toolUseBlocks.map(toolUse => executeTool(toolUse, internalHeaders, baseUrl))
            )

            // Collect any actions from tool results
            for (const { action } of results) {
              if (action) finalAction = action
            }

            // Add tool results to tool message chain
            toolMessages.push({
              role: 'user',
              content: results.map(r => r.toolResult),
            })
          }

          // When there's a booking navigate action, skip the text stream
          // so the client can navigate immediately (toast + scroll happen on
          // the destination page; a canned chat message is injected client-side).
          if (finalAction?.payload?.bookingContext) {
            send({ type: 'action', action: finalAction })
            send({ type: 'done' })
          } else {
            // Phase 2: Stream the final response
            // Merge full conversation history with tool results so the
            // response is both data-accurate and conversationally aware.
            if (didProcessTools) {
              // Build Phase 2 messages: full history + tool chain (minus
              // the duplicate first user message already in history)
              const phase2Messages: Anthropic.MessageParam[] = [
                ...fullHistory,
                ...toolMessages.slice(1), // skip toolMessages[0] (same as last in fullHistory)
              ]

              const finalStream = anthropic.messages.stream({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 2048,
                system: systemPrompt,
                tools: TOOLS,
                messages: phase2Messages,
              })

              finalStream.on('text', (textDelta) => {
                send({ type: 'delta', text: textDelta })
              })

              await finalStream.finalMessage()
            }

            // Send final action and done event
            if (finalAction) send({ type: 'action', action: finalAction })
            send({ type: 'done' })
          }
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
