'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, X } from 'lucide-react'
import ChatPanel from './ChatPanel'

interface ChatBubbleProps {
  currentView: string
}

export default function ChatBubble({ currentView }: ChatBubbleProps) {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === 'undefined') return false
    return sessionStorage.getItem('ksmt_chat_open') === 'true'
  })

  useEffect(() => {
    sessionStorage.setItem('ksmt_chat_open', String(isOpen))
  }, [isOpen])

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
      {/* Chat panel — always mounted so messages persist; hidden via CSS when closed */}
      <div
        className={`w-[380px] bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden transition-all duration-200 pointer-events-auto ${
          isOpen ? 'opacity-100' : 'opacity-0 !pointer-events-none'
        }`}
        style={{ height: 'calc(100vh - 8rem)', maxHeight: '560px' }}
        aria-hidden={!isOpen}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 bg-white rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-sm font-semibold text-stone-800">ksmt AI</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-stone-400 hover:text-stone-700 transition-colors p-1 rounded-lg hover:bg-stone-100"
          >
            <X size={16} />
          </button>
        </div>

        <ChatPanel currentView={currentView} />
      </div>

      {/* Floating button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="w-14 h-14 rounded-full bg-ksmt-brown hover:bg-ksmt-brown-hover text-white shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 pointer-events-auto"
        aria-label={isOpen ? 'Close chat' : 'Open AI chat'}
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  )
}
