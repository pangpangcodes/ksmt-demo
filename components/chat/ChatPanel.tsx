'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Loader2, Mic, MicOff, Trash2 } from 'lucide-react'

// ── Minimal markdown renderer ──────────────────────────────────────────────
function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function renderInline(s: string): string {
  // Stash markdown links before escaping so URLs survive
  const links: [string, string][] = []
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, u) => {
    links.push([t, u])
    return `\x00L${links.length - 1}\x00`
  })
  s = escHtml(s)
  s = s.replace(/\x00L(\d+)\x00/g, (_, i) => {
    const [t, u] = links[+i]
    return `<a href="${u}" class="text-ksmt-crimson underline font-semibold hover:opacity-70 transition-opacity">${escHtml(t)}</a>`
  })
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/\*(.+?)\*/g, '<em>$1</em>')
  // Status badges — match "| Status" at end of vendor lines
  s = s.replace(
    /\s*\|\s*(Approved|Booked (?:&amp;|&) Confirmed|Not Reviewed|Review Needed|Declined|Booked)\s*$/,
    (_, st: string) => {
      const key = st.replace(/&amp;/g, '&').toLowerCase()
      let cls: string, label: string
      if (key === 'approved') {
        cls = 'bg-emerald-50 text-emerald-700 border-emerald-200'
        label = 'Approved'
      } else if (key.startsWith('booked')) {
        cls = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold'
        label = 'Booked & Confirmed'
      } else if (key === 'declined') {
        cls = 'bg-gray-100 text-gray-400 border-gray-200'
        label = 'Declined'
      } else {
        cls = 'bg-slate-100 text-slate-600 border-slate-200'
        label = 'Not Reviewed'
      }
      return ` <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider border ${cls} ml-1.5" style="vertical-align: middle">${label}</span>`
    }
  )
  return s
}

function renderMarkdown(md: string): string {
  const lines = md.split('\n')
  const out: string[] = []
  let olOpen = false
  let ulOpen = false
  let currentLiSubs: string[] = []

  const flushLi = () => {
    if (currentLiSubs.length) {
      // inject sub-items inside the content div (before </div></li>)
      const last = out.pop()!
      out.push(last.replace('</div></li>', `<div class="flex flex-col gap-0.5 mt-1">${currentLiSubs.join('')}</div></div></li>`))
      currentLiSubs = []
    }
  }

  const closeOl = () => { flushLi(); if (olOpen) { out.push('</ol>'); olOpen = false } }
  const closeUl = () => { flushLi(); if (ulOpen) { out.push('</ul>'); ulOpen = false } }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const olM = line.match(/^(\d+)\.\s+(.+)/)
    const subM = (olOpen || ulOpen) && line.match(/^[ \t]{1,4}[-*]\s+(.+)/)
    const ulM = !subM && line.match(/^[ \t]{0,4}[-*]\s+(.+)/)

    if (subM) {
      // Sub-item under current list entry
      currentLiSubs.push(
        `<div class="text-[13px] text-stone-600 flex gap-1.5"><span class="flex-shrink-0 text-stone-400">-</span><span>${renderInline(subM[1])}</span></div>`
      )
    } else if (olM) {
      closeUl()
      flushLi()
      if (!olOpen) { out.push('<ol class="space-y-3 list-none pl-0 mt-1">'); olOpen = true }
      out.push(`<li class="border-b border-stone-100 pb-2.5 last:border-0 last:pb-0"><div>${renderInline(olM[2])}</div></li>`)
    } else if (ulM) {
      closeOl()
      flushLi()
      if (!ulOpen) { out.push('<ul class="space-y-1 list-none pl-0 mt-1">'); ulOpen = true }
      out.push(`<li class="flex gap-2"><span class="text-stone-300 flex-shrink-0">-</span><div class="flex-1 min-w-0">${renderInline(ulM[1])}</div></li>`)
    } else {
      closeOl()
      closeUl()
      const headingM = line.match(/^(#{1,3})\s+(.+)/)
      if (headingM) {
        const level = headingM[1].length
        const cls = level === 1
          ? 'text-sm font-bold text-stone-900 mt-2'
          : level === 2
            ? 'text-sm font-semibold text-stone-800 mt-2'
            : 'text-xs font-semibold text-stone-700 mt-1.5'
        out.push(`<p class="${cls}">${renderInline(headingM[2])}</p>`)
      } else if (line.trim() === '') {
        if (out.length && out[out.length - 1] !== '<div class="h-2"></div>') {
          out.push('<div class="h-2"></div>')
        }
      } else {
        out.push(`<p class="leading-relaxed">${renderInline(line)}</p>`)
      }
    }
  }
  closeOl()
  closeUl()
  return out.join('')
}
// ── Quick-reply helpers ───────────────────────────────────────────────────
interface QuickReply {
  label: string
  prompt: string
}

const QUICK_REPLIES_RE = /\[QUICK_REPLIES\]([\s\S]*?)\[\/QUICK_REPLIES\]/

function extractQuickReplies(content: string): QuickReply[] {
  const match = content.match(QUICK_REPLIES_RE)
  if (!match) return []
  return match[1]
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.includes('|'))
    .map(line => {
      const idx = line.indexOf('|')
      return { label: line.slice(0, idx), prompt: line.slice(idx + 1) }
    })
}

function stripQuickReplies(content: string): string {
  return content.replace(QUICK_REPLIES_RE, '').trimEnd()
}
// ──────────────────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatPanelProps {
  currentView: string
}

function useVoiceInput({
  onFinalTranscript,
  onInterimTranscript,
}: {
  onFinalTranscript: (text: string) => void
  onInterimTranscript: (text: string) => void
}) {
  const [isRecording, setIsRecording] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) setIsSupported(false)
  }, [])

  const start = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR || isRecording) return
    const recognition = new SR()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.onstart = () => setIsRecording(true)
    recognition.onresult = (e: any) => {
      let interim = ''
      let final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) final += t
        else interim += t
      }
      if (interim) onInterimTranscript(interim)
      if (final) onFinalTranscript(final)
    }
    recognition.onend = () => { setIsRecording(false); recognitionRef.current = null }
    recognition.onerror = () => { setIsRecording(false); recognitionRef.current = null }
    recognitionRef.current = recognition
    recognition.start()
  }, [isRecording, onFinalTranscript, onInterimTranscript])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  return { isRecording, isSupported, start, stop }
}

const CHAT_STORAGE_KEY = 'ksmt_chat_messages'

export default function ChatPanel({ currentView }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const saved = sessionStorage.getItem(CHAT_STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [streamingContent, setStreamingContent] = useState('')
  const accumulatedTextRef = useRef('')
  const isEmpty = messages.length === 0

  useEffect(() => {
    try { sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages)) } catch {}
  }, [messages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, streamingContent])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    // Fast path: booking action from quick reply - bypass Claude entirely
    const bookMatch = trimmed.match(/^ACTION:book_vendor:([^:]+):([^:]+):([^:]+):(.+)$/)
    if (bookMatch) {
      const [, coupleId, vendorId, shareLinkId, vendorName] = bookMatch
      const userMsg = `I've confirmed the booking with ${vendorName}.`
      setMessages(prev => [...prev, { role: 'user', content: userMsg }])
      setLoading(true)
      try {
        const token = sessionStorage.getItem('planner_auth') || 'planner'
        const res = await fetch(`/api/planners/couples/${coupleId}/vendors/${vendorId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ couple_status: 'booked' }),
        })
        if (!res.ok) throw new Error('Failed to update vendor')
        // Inject confirmation into chat storage for persistence across navigation
        const saved = JSON.parse(sessionStorage.getItem(CHAT_STORAGE_KEY) || '[]')
        saved.push({ role: 'user', content: userMsg })
        saved.push({ role: 'assistant', content: `Done! ${vendorName} is now Booked & Confirmed.` })
        sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(saved))
        // Set booking context for toast + scroll on destination page
        sessionStorage.setItem('ksmt_booking_context', JSON.stringify({ vendorId, vendorName }))
        window.location.href = `/planners/couples/${shareLinkId}?tab=vendors`
      } catch {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong confirming the booking. Please try again.' }])
      } finally {
        setLoading(false)
      }
      return
    }

    const userMessage: Message = { role: 'user', content: trimmed }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)
    accumulatedTextRef.current = ''
    setStreamingContent('')

    try {
      const token = sessionStorage.getItem('planner_auth') || 'planner'
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: nextMessages,
          context: { view: currentView },
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to get response')
      }

      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let pendingAction: { type: string; payload: any } | null = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Parse complete SSE events (separated by double newline)
        const parts = buffer.split('\n\n')
        buffer = parts.pop()! // Keep potentially incomplete last chunk

        for (const part of parts) {
          const trimmedPart = part.trim()
          if (!trimmedPart || !trimmedPart.startsWith('data: ')) continue

          let data: any
          try {
            data = JSON.parse(trimmedPart.slice(6))
          } catch {
            continue
          }

          if (data.type === 'delta') {
            accumulatedTextRef.current += data.text
            setStreamingContent(accumulatedTextRef.current)
          } else if (data.type === 'action') {
            pendingAction = data.action
          } else if (data.type === 'done') {
            // Capture text before clearing - React's functional updater
            // executes later, so the ref would be empty by then
            const finalText = accumulatedTextRef.current
            accumulatedTextRef.current = ''
            setStreamingContent('')
            if (finalText) {
              setMessages(prev => [...prev, { role: 'assistant', content: finalText }])
            }

            if (pendingAction) {
              const { type, payload } = pendingAction
              if (type === 'open_couple_modal') {
                window.dispatchEvent(new CustomEvent('ksmt:chat-action', {
                  detail: { type: 'open_couple_modal', data: payload },
                }))
              } else if (type === 'navigate') {
                if (payload.bookingContext) {
                  // Inject a confirmation reply into chat history before navigating
                  // (the server skips streaming for booking actions so we navigate instantly)
                  const saved = JSON.parse(sessionStorage.getItem(CHAT_STORAGE_KEY) || '[]')
                  saved.push({
                    role: 'assistant',
                    content: `Done! ${payload.bookingContext.vendorName} is now Booked & Confirmed.`,
                  })
                  sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(saved))
                  sessionStorage.setItem('ksmt_booking_context', JSON.stringify(payload.bookingContext))
                }
                // Navigate directly — works on all pages, not just PlannerDashboard
                window.location.href = payload.url
              }
            }
          } else if (data.type === 'error') {
            throw new Error(data.message || 'Something went wrong')
          }
        }
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ])
      accumulatedTextRef.current = ''
      setStreamingContent('')
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }, [loading, messages, currentView])

  const handleFinalTranscript = useCallback((text: string) => {
    setInput('')
    sendMessage(text)
  }, [sendMessage])

  const handleInterimTranscript = useCallback((text: string) => {
    setInput(text)
  }, [])

  const voice = useVoiceInput({
    onFinalTranscript: handleFinalTranscript,
    onInterimTranscript: handleInterimTranscript,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Message thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {isEmpty ? (
          /* Voice-first empty state */
          <div className="flex flex-col items-center justify-center h-full gap-6 pb-4">
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-stone-700">What can I help with?</p>
              <p className="text-xs text-stone-400">Speak or type below</p>
            </div>

            {/* Big mic button */}
            <button
              onClick={voice.isRecording ? voice.stop : voice.start}
              disabled={!voice.isSupported || loading}
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all ${
                voice.isRecording
                  ? 'bg-red-500 text-white scale-110 animate-pulse'
                  : 'bg-ksmt-brown text-white hover:bg-ksmt-brown-hover hover:scale-105 active:scale-95'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
              aria-label={voice.isRecording ? 'Stop recording' : 'Start voice input'}
            >
              {voice.isRecording ? <MicOff size={32} /> : <Mic size={32} />}
            </button>

            {/* Interim transcript */}
            {input && (
              <p className="text-sm text-stone-600 italic text-center max-w-[260px]">
                &ldquo;{input}&rdquo;
              </p>
            )}

            {voice.isRecording && !input && (
              <p className="text-xs text-red-500 animate-pulse">Listening...</p>
            )}

            {!voice.isSupported && (
              <p className="text-xs text-stone-400">Voice not supported in this browser</p>
            )}

            {/* Hint pills */}
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {[
                'Who is getting married in September?',
                'Add a new couple',
                'Go to vendors',
              ].map(hint => (
                <button
                  key={hint}
                  onClick={() => sendMessage(hint)}
                  disabled={loading}
                  className="text-xs px-3 py-1.5 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors disabled:opacity-40"
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Conversation view */
          <>
            {messages.map((msg, i) => {
              if (msg.role === 'user') {
                return (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[85%] px-3 py-2 rounded-2xl rounded-br-sm text-sm leading-relaxed bg-ksmt-brown text-white">
                      {msg.content}
                    </div>
                  </div>
                )
              }

              const quickReplies = extractQuickReplies(msg.content)
              const displayContent = stripQuickReplies(msg.content)

              return (
                <div key={i} className="flex flex-col items-start gap-2">
                  <div
                    className="max-w-[90%] px-3 py-2.5 rounded-2xl rounded-bl-sm text-sm bg-stone-100 text-stone-800"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(displayContent) }}
                  />
                  {quickReplies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pl-1">
                      {quickReplies.map((reply) => (
                        <button
                          key={reply.label}
                          onClick={() => sendMessage(reply.prompt)}
                          disabled={loading}
                          className="text-xs px-3 py-1.5 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors disabled:opacity-40 border border-stone-200"
                        >
                          {reply.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Streaming assistant message — strip any partial/complete [QUICK_REPLIES] block */}
            {streamingContent && (() => {
              const display = streamingContent.replace(/\[QUICK[\s\S]*$/, '').trimEnd()
              return display ? (
                <div className="flex flex-col items-start gap-2">
                  <div
                    className="max-w-[90%] px-3 py-2.5 rounded-2xl rounded-bl-sm text-sm bg-stone-100 text-stone-800"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(display) }}
                  />
                </div>
              ) : null
            })()}

            {/* Spinner - only while waiting for first token */}
            {loading && !streamingContent && (
              <div className="flex justify-start">
                <div className="bg-stone-100 px-3 py-2 rounded-2xl rounded-bl-sm">
                  <Loader2 size={16} className="text-stone-400 animate-spin" />
                </div>
              </div>
            )}

            {/* Clear button - below latest response */}
            {!loading && (
              <div className="flex justify-end mt-1">
                <button
                  onClick={() => setMessages([])}
                  className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 transition-colors"
                  title="Clear conversation"
                >
                  <Trash2 size={12} />
                  Clear
                </button>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 p-3 border-t border-stone-200 bg-white rounded-b-2xl flex-shrink-0"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={voice.isRecording ? 'Listening...' : 'Or type here...'}
          disabled={loading}
          className="flex-1 text-sm px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-400 disabled:opacity-60 min-w-0"
        />

        {/* Inline mic (conversation mode) */}
        {!isEmpty && (
          <button
            type="button"
            onClick={voice.isRecording ? voice.stop : voice.start}
            disabled={!voice.isSupported || loading}
            title={voice.isRecording ? 'Stop recording' : 'Start voice input'}
            className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
              voice.isRecording
                ? 'text-red-500 bg-red-50 animate-pulse'
                : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <Mic size={18} />
          </button>
        )}

        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2 rounded-lg bg-ksmt-brown text-white hover:bg-ksmt-brown-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
