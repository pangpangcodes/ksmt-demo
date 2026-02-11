'use client'

import { useState } from 'react'
import { Instagram, Globe, Mail, Phone, MessageSquare, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import type { SharedVendor, VendorStatus } from '@/types/planner'

interface VendorCardProps {
  vendor: SharedVendor
  mode: 'planner' | 'shared'
  onStatusChange?: (vendorId: string, status: VendorStatus) => void
  onNoteChange?: (vendorId: string, note: string) => void
  isSuperseded?: boolean // True when another vendor in same category is approved
}

const STATUS_OPTIONS_COUPLE: { value: VendorStatus; label: string }[] = [
  { value: null, label: 'Review Needed' },
  { value: 'interested' as const, label: 'Approved' },
  { value: 'pass' as const, label: 'Declined' },
]

const STATUS_OPTIONS_PLANNER: { value: VendorStatus; label: string }[] = [
  { value: null, label: 'Review Needed' },
  { value: 'interested' as const, label: 'Approved' },
  { value: 'booked' as const, label: 'Booked & Confirmed' },
  { value: 'pass' as const, label: 'Declined' },
]

// Type guard to help TypeScript understand vendor status
const isPassStatus = (status: VendorStatus | undefined): status is 'pass' => status === 'pass'

export default function VendorCard({ vendor, mode, onStatusChange, onNoteChange, isSuperseded = false }: VendorCardProps) {
  const theme = useThemeStyles()
  const [note, setNote] = useState(vendor.couple_note || '')
  const [isNoteOpen, setIsNoteOpen] = useState(false)
  const [showDetails, setShowDetails] = useState(mode === 'shared')
  const [showConfirmation, setShowConfirmation] = useState(false)

  const handleStatusChange = (newStatus: VendorStatus) => {
    if (onStatusChange) {
      if (mode === 'shared') {
        // Toggle behavior: if clicking the same status, revert to null (Review Needed)
        const finalStatus = vendor.couple_status === newStatus ? null : newStatus
        onStatusChange(vendor.id, finalStatus)
        // Show confirmation message
        setShowConfirmation(true)
        setTimeout(() => setShowConfirmation(false), 3000)
      } else if (mode === 'planner') {
        // Planner can update status directly (no toggle behavior)
        onStatusChange(vendor.id, newStatus)
        setShowConfirmation(true)
        setTimeout(() => setShowConfirmation(false), 3000)
      }
    }
  }

  const handleNoteBlur = () => {
    if (mode === 'shared' && onNoteChange && note !== (vendor.couple_note || '')) {
      onNoteChange(vendor.id, note)
    }
  }

  const handleNoteKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (mode === 'shared' && onNoteChange && note !== (vendor.couple_note || '')) {
        onNoteChange(vendor.id, note)
      }
      // Blur the textarea to close it
      ;(e.target as HTMLTextAreaElement).blur()
    }
  }

  const formatCurrency = (amount: number | null | undefined, currency: 'EUR' | 'USD') => {
    if (!amount) return null
    const symbol = currency === 'EUR' ? '€' : '$'
    return `${symbol}${amount.toLocaleString()}`
  }

  const getStatusDisplay = (status: VendorStatus | undefined, superseded: boolean = false) => {
    if (superseded && !status) {
      return 'Alternative'
    }
    switch (status) {
      case 'interested':
        return 'Approved'
      case 'booked':
        return 'Booked & Confirmed'
      case 'pass':
        return 'Declined'
      default:
        return 'Review Needed'
    }
  }

  const getStatusColor = (status: VendorStatus | undefined, superseded: boolean = false) => {
    if (superseded && !status) {
      return 'bg-gray-50 text-gray-400 border-gray-200'
    }
    switch (status) {
      case null:
      case undefined:
        return 'bg-slate-100 text-slate-600 border-slate-200'
      case 'interested':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'booked':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold'
      case 'pass':
        return 'bg-gray-100 text-gray-400 border-gray-200 line-through opacity-70'
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200'
    }
  }

  const plannerNote = vendor.custom_note || vendor.planner_note

  return (
    <div
      className={`group ${theme.cardBackground} rounded-2xl shadow-sm ${theme.border} ${theme.borderWidth} overflow-hidden transition-all duration-300 hover:shadow-lg flex flex-col ${
        vendor.couple_status === 'pass' || isSuperseded ? 'opacity-60 grayscale-[0.5]' : ''
      }`}
    >
      {/* Card Content */}
      <div className="p-6 flex-1 flex flex-col">
        {/* Growing Content Area */}
        <div className="flex-1">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className={`text-xs ${theme.textSecondary} font-bold tracking-widest uppercase mb-1`}>
                {vendor.vendor_type}
              </div>
              <h3 className={`font-serif text-2xl ${theme.textPrimary} leading-tight`}>
                {vendor.vendor_name}
              </h3>
              {vendor.contact_name && (
                <p className={`text-sm ${theme.textSecondary} mt-1`}>{vendor.contact_name}</p>
              )}
            </div>

            {/* Status Badge */}
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider border ${getStatusColor(
                vendor.couple_status,
                isSuperseded
              )}`}
            >
              {getStatusDisplay(vendor.couple_status, isSuperseded)}
            </span>
          </div>

          {/* Price Display */}
          {(vendor.estimated_cost_eur || vendor.estimated_cost_usd) && (
            <div className="mb-4">
              <div className="flex items-baseline gap-2">
                {vendor.estimated_cost_eur && (
                  <span className={`font-serif text-xl ${theme.textPrimary}`}>
                    {formatCurrency(vendor.estimated_cost_eur, 'EUR')}
                  </span>
                )}
                {vendor.estimated_cost_eur && vendor.estimated_cost_usd && (
                  <span className={theme.textMuted}>/</span>
                )}
                {vendor.estimated_cost_usd && (
                  <span className={`font-serif text-xl ${theme.textPrimary}`}>
                    {formatCurrency(vendor.estimated_cost_usd, 'USD')}
                  </span>
                )}
              </div>
              <p className={`text-xs ${theme.textMuted}`}>Estimated</p>
            </div>
          )}

          {/* Planner's Insight */}
          {plannerNote && (
            <div
              className="border-l-4 p-4 mb-6 rounded-r-lg"
              style={{
                backgroundColor: `${theme.primaryColor}08`,
                borderColor: theme.primaryColor,
              }}
            >
              <div className="flex items-center gap-2 mb-2" style={{ color: theme.primaryColor }}>
                <Sparkles size={16} />
                <span className="text-sm font-semibold font-serif">Planner's Insight</span>
              </div>
              <p className={`text-sm ${theme.textSecondary} italic leading-relaxed`}>"{plannerNote}"</p>
            </div>
          )}

          {/* Couple's Feedback (Planner View Only) */}
          {mode === 'planner' && vendor.couple_note && (
            <div className={`border-l-4 border-stone-300 bg-stone-50 p-4 mb-6 rounded-r-lg`}>
              <div className={`flex items-center gap-2 mb-2 ${theme.textSecondary}`}>
                <MessageSquare size={16} />
                <span className="text-sm font-semibold font-serif">Couple's Feedback</span>
              </div>
              <p className={`text-sm ${theme.textPrimary} italic leading-relaxed`}>"{vendor.couple_note}"</p>
            </div>
          )}
        </div>

        {/* Action Buttons - Always at Bottom */}
        <div className={`border-t ${theme.border} pt-4 space-y-4`}>
          <div className="flex gap-2">
            {vendor.website && (
              <a
                href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`}
                target="_blank"
                rel="noreferrer"
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 ${theme.secondaryButton} ${theme.secondaryButtonHover} rounded-lg text-sm ${theme.textSecondary} transition-colors`}
              >
                <Globe size={16} /> Website
              </a>
            )}
            {vendor.instagram && (
              <a
                href={`https://instagram.com/${vendor.instagram.replace('@', '')}`}
                target="_blank"
                rel="noreferrer"
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 ${theme.secondaryButton} ${theme.secondaryButtonHover} rounded-lg text-sm ${theme.textSecondary} transition-colors`}
              >
                <Instagram size={16} /> Insta
              </a>
            )}
            {vendor.email && (
              <a
                href={`mailto:${vendor.email}`}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 ${theme.secondaryButton} ${theme.secondaryButtonHover} rounded-lg text-sm ${theme.textSecondary} transition-colors`}
              >
                <Mail size={16} /> Email
              </a>
            )}
          </div>

          {/* Expandable Pricing Details */}
          <div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className={`flex items-center justify-between w-full text-xs font-bold ${theme.textMuted} uppercase tracking-widest hover:${theme.textPrimary} transition-colors`}
            >
              <span>Pricing</span>
              {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showDetails && (
              <div className={`mt-4 text-sm ${theme.textSecondary} animate-in fade-in slide-in-from-top-2 max-h-[40vh] md:max-h-none overflow-y-auto`}>
                {/* Display pricing details from library vendor */}
                {vendor.vendor_library?.pricing ? (
                  <div className="space-y-1 whitespace-pre-line leading-relaxed">
                    {vendor.vendor_library.pricing}
                  </div>
                ) : (
                  /* Fallback: Show estimated pricing only */
                  <div className="space-y-3">
                    {(vendor.estimated_cost_eur || vendor.estimated_cost_usd) ? (
                      <div>
                        <div className="font-semibold text-stone-900 mb-1">Estimated Cost</div>
                        <div className="text-lg font-serif text-stone-900">
                          {vendor.estimated_cost_eur && formatCurrency(vendor.estimated_cost_eur, 'EUR')}
                          {vendor.estimated_cost_eur && vendor.estimated_cost_usd && ' / '}
                          {vendor.estimated_cost_usd && formatCurrency(vendor.estimated_cost_usd, 'USD')}
                        </div>
                      </div>
                    ) : (
                      <div className="text-stone-400 italic">
                        Pricing information not available. Contact vendor for details.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notes Section (Shared View Only) - Moved above status buttons */}
          {mode === 'shared' && (
            <div>
              <button
                onClick={() => setIsNoteOpen(!isNoteOpen)}
                className={`flex items-center gap-2 text-sm ${theme.textSecondary} transition-colors`}
                style={{ color: theme.primaryColor }}
              >
                <MessageSquare size={16} />
                {vendor.couple_note ? 'Edit your notes' : 'Add private note'}
              </button>

              {(isNoteOpen || vendor.couple_note) && (
                <div className={`mt-2 transition-all duration-300 ${isNoteOpen ? 'block' : vendor.couple_note ? 'block' : 'hidden'}`}>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    onBlur={handleNoteBlur}
                    onKeyDown={handleNoteKeyDown}
                    placeholder="e.g., Contacted on Tuesday, waiting for pricing PDF... (Press Enter to save)"
                    className={`w-full text-sm p-3 ${theme.border} rounded-lg bg-yellow-50/30 focus:${theme.cardBackground} focus:ring-2 outline-none resize-none transition-all`}
                    rows={2}
                  />
                </div>
              )}
            </div>
          )}

          {/* Status Selection (Shared View Only) */}
          {mode === 'shared' && (
            <div className="relative">
              <label className={`text-xs font-semibold ${theme.textMuted} uppercase tracking-wider mb-3 block`}>
                Your Decision
              </label>

              {vendor.couple_status === 'pass' ? (
                /* Declined State - Show Restore Button */
                <div className="space-y-2">
                  <div className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-50 text-gray-500 border-2 border-gray-200 rounded-lg font-medium text-sm">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Declined
                  </div>
                  <button
                    onClick={() => handleStatusChange(null)}
                    className={`w-full flex items-center justify-center gap-2 py-2 px-4 ${theme.primaryButton} ${theme.textOnPrimary} ${theme.primaryButtonHover} rounded-lg font-medium text-sm transition-colors`}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    Restore to List
                  </button>
                </div>
              ) : (
                /* Approve/Pass State - Two Side-by-Side Buttons */
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleStatusChange('interested')}
                      className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium text-sm transition-colors ${
                        vendor.couple_status === 'interested'
                          ? `${theme.primaryButton} ${theme.textOnPrimary} ${theme.primaryButtonHover}`
                          : `${theme.secondaryButton} ${theme.textSecondary} ${theme.secondaryButtonHover}`
                      }`}
                      title={vendor.couple_status === 'interested' ? 'Click again to unapprove' : 'Mark as interested'}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                      {vendor.couple_status === 'interested' ? 'Approved ✓' : 'Approve'}
                    </button>

                    <button
                      onClick={() => handleStatusChange('pass' as VendorStatus)}
                      className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium text-sm transition-colors ${
                        isPassStatus(vendor.couple_status)
                          ? `bg-gray-100 text-gray-600 border border-gray-300`
                          : `${theme.secondaryButton} ${theme.textSecondary} ${theme.secondaryButtonHover}`
                      }`}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      Not for us
                    </button>
                  </div>

                  {/* Confirmation Message */}
                  {showConfirmation && (
                    <div className={`text-center py-2 px-3 bg-green-50 text-green-700 rounded-lg text-xs animate-in fade-in slide-in-from-top-2`}>
                      ✓ Your feedback has been shared with your planner
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Status Actions (Planner View Only) */}
          {mode === 'planner' && vendor.couple_status === 'interested' && (
            <div className="relative">
              <label className={`text-xs font-semibold ${theme.textMuted} uppercase tracking-wider mb-3 block`}>
                Planner Actions
              </label>

              <div className="space-y-2">
                <button
                  onClick={() => handleStatusChange('booked')}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 ${theme.primaryButton} ${theme.textOnPrimary} ${theme.primaryButtonHover} rounded-lg font-medium text-sm transition-colors`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Mark as Booked & Confirmed
                </button>

                {/* Confirmation Message */}
                {showConfirmation && (
                  <div className={`text-center py-2 px-3 bg-green-50 text-green-700 rounded-lg text-xs animate-in fade-in slide-in-from-top-2`}>
                    ✓ Vendor marked as Booked & Confirmed
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
