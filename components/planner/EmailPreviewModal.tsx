'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Send, Loader2, Mail } from 'lucide-react'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import type { PlannerCouple } from '@/types/planner'
import VendorInviteEmailTemplate from './VendorInviteEmailTemplate'

interface VendorCategory {
  type: string
  count: number
}

interface EmailPreviewModalProps {
  couple: PlannerCouple
  vendorCount: number
  vendorCategories?: VendorCategory[]
  plannerName?: string
  customMessage?: string
  onBack: () => void
  onConfirm: () => Promise<void>
  onClose: () => void
}

export default function EmailPreviewModal({
  couple,
  vendorCount,
  vendorCategories,
  plannerName,
  customMessage,
  onBack,
  onConfirm,
  onClose
}: EmailPreviewModalProps) {
  const theme = useThemeStyles()
  const [sending, setSending] = useState(false)

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const handleConfirm = async () => {
    setSending(true)
    try {
      await onConfirm()
    } finally {
      setSending(false)
    }
  }

  const modalContent = (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-[9999] flex items-center justify-center p-4" style={{ WebkitBackdropFilter: 'blur(20px)', backdropFilter: 'blur(20px)' }}>
      <div className={`${theme.cardBackground} rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-stone-200`}>
        {/* Modal Header */}
        <div className={`${theme.cardBackground} border-b border-stone-200 px-8 py-6 flex justify-between items-center flex-shrink-0`}>
          <h3 className={`font-display text-2xl md:text-3xl ${theme.textPrimary}`}>
            Email Preview
          </h3>
          <button
            onClick={onClose}
            className={`${theme.textMuted} hover:${theme.textSecondary} transition-colors`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Email Preview Content */}
        <div className="flex-1 overflow-y-auto px-8 py-8 bg-stone-50">
          <div className="max-w-2xl mx-auto">
            {/* Info Box */}
            <div className="bg-stone-50 border-2 border-stone-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <Mail className={`w-5 h-5 ${theme.textSecondary} flex-shrink-0 mt-0.5`} />
                <div>
                  <p className={`text-sm font-bold ${theme.textPrimary} mb-1`}>
                    This email will be sent to:
                  </p>
                  <p className={`text-sm ${theme.textSecondary} font-medium`}>
                    {couple.couple_email}
                  </p>
                  <p className={`text-xs ${theme.textMuted} mt-2`}>
                    {vendorCount} vendor{vendorCount !== 1 ? 's' : ''} will be shared with {couple.couple_names}
                  </p>
                </div>
              </div>
            </div>

            {/* Email Template Preview */}
            <div className="shadow-xl">
              <VendorInviteEmailTemplate
                coupleName={couple.couple_names}
                plannerName={plannerName}
                vendorCategories={vendorCategories}
                customMessage={customMessage}
                shareLinkId={couple.share_link_id}
              />
            </div>
          </div>
        </div>

        {/* Footer Actions - Sticky CTA Buttons */}
        <div className="border-t border-stone-200 px-8 py-6 bg-white flex-shrink-0">
          <div className="flex gap-3 max-w-2xl mx-auto">
            <button
              onClick={onBack}
              disabled={sending}
              className={`px-3 md:px-4 py-2 ${theme.secondaryButton} ${theme.textPrimary} rounded-xl text-sm font-medium ${theme.secondaryButtonHover} transition-colors disabled:opacity-50`}
            >
              Go Back
            </button>
            <button
              onClick={handleConfirm}
              disabled={sending}
              className={`flex-1 px-3 md:px-4 py-2 ${theme.primaryButton} ${theme.textOnPrimary} rounded-xl text-sm font-medium ${theme.primaryButtonHover} transition-colors disabled:opacity-50 flex items-center justify-center gap-2`}
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sharing & Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Share & Send Email
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null
}
