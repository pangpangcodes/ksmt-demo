'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Link as LinkIcon, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import type { CreatePlannerCoupleInput, PlannerCouple } from '@/types/planner'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import LocationAutocompleteInput from '@/components/LocationAutocompleteInput'
import { useModalSize, getModalClasses } from '@/hooks/useModalSize'

interface InviteCoupleModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  coupleToEdit?: PlannerCouple
}

export default function InviteCoupleModal({ isOpen, onClose, onSuccess, coupleToEdit }: InviteCoupleModalProps) {
  const theme = useThemeStyles()
  const isEditMode = !!coupleToEdit
  const [formData, setFormData] = useState<CreatePlannerCoupleInput>({
    couple_names: '',
    couple_email: '',
    wedding_date: '',
    wedding_location: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shareLink, setShareLink] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const { headerRef, contentRef, isLargeModal } = useModalSize(isOpen)
  const { overlay: overlayClass, maxH: maxHClass } = getModalClasses(isLargeModal)

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen])

  // Initialize form with existing data when editing
  useEffect(() => {
    if (isOpen && coupleToEdit) {
      setFormData({
        couple_names: coupleToEdit.couple_names,
        couple_email: coupleToEdit.couple_email || '',
        wedding_date: coupleToEdit.wedding_date || '',
        wedding_location: coupleToEdit.wedding_location || '',
        notes: coupleToEdit.notes || '',
      })
    } else if (isOpen && !coupleToEdit) {
      // Reset form for new couple
      setFormData({
        couple_names: '',
        couple_email: '',
        wedding_date: '',
        wedding_location: '',
        notes: '',
      })
    }
  }, [isOpen, coupleToEdit])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const normalizeCoupleNames = (names: string): string => {
    // Replace "and" with "&" (case-insensitive)
    return names.replace(/\s+and\s+/gi, ' & ')
  }

  const handleCoupleNamesBlur = () => {
    setFormData(prev => ({
      ...prev,
      couple_names: normalizeCoupleNames(prev.couple_names)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const token = sessionStorage.getItem('planner_auth')
      if (!token) {
        setError('Authentication required. Please log in again.')
        return
      }

      const url = isEditMode
        ? `/api/planner/couples/${coupleToEdit.id}`
        : '/api/planner/couples'

      const method = isEditMode ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          couple_names: normalizeCoupleNames(formData.couple_names.trim()),
          couple_email: formData.couple_email?.trim() || null,
          wedding_date: formData.wedding_date || null,
          wedding_location: formData.wedding_location?.trim() || null,
          notes: formData.notes?.trim() || null,
        })
      })

      const result = await response.json()

      if (!result.success || !result.data) {
        console.error(`Failed to ${isEditMode ? 'update' : 'create'} couple:`, result.error)
        setError(result.error || `Failed to ${isEditMode ? 'update' : 'invite'} couple. Please try again.`)
        return
      }

      // For edit mode, skip share link display and close immediately
      if (isEditMode) {
        onSuccess()
        onClose()
      } else {
        // Generate share link for new couples
        const link = `${window.location.origin}/s/${result.data.share_link_id}`
        setShareLink(link)
        setShowSuccess(true)

        // Note: Email sending skipped in demo mode
        if (formData.couple_email) {
          console.log('Email would be sent to:', formData.couple_email)
        }
      }
    } catch (err) {
      console.error(`${isEditMode ? 'Update' : 'Invite'} couple error:`, err)
      setError(`Failed to ${isEditMode ? 'update' : 'invite'} couple. Please try again.`)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink)
    // Show copied feedback (could add toast notification)
    alert('Link copied to clipboard!')
  }

  const handleClose = () => {
    setFormData({
      couple_names: '',
      couple_email: '',
      wedding_date: '',
      wedding_location: '',
      notes: '',
    })
    setError('')
    setShareLink('')
    setShowSuccess(false)
    onClose()
  }

  const handleDone = () => {
    handleClose()
    onSuccess()
  }

  if (!isOpen) return null

  // Render modal in portal to avoid stacking context issues
  if (typeof window === 'undefined') return null

  return createPortal(
    <div className={`${overlayClass} bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4`} style={{ WebkitBackdropFilter: 'blur(12px)', backdropFilter: 'blur(12px)' }}>
      <div className={`bg-white rounded-2xl shadow-xl max-w-2xl w-full ${maxHClass} border border-stone-200 overflow-hidden flex flex-col`}>
        {/* Header */}
        <div ref={headerRef} className="bg-white border-b border-stone-200 px-8 py-6 flex justify-between items-center flex-shrink-0">
          <h3 className={`font-display text-2xl md:text-3xl ${theme.textPrimary}`}>
            {showSuccess
              ? 'Couple Created!'
              : isEditMode
                ? 'Edit Couple'
                : 'Add New Couple'
            }
          </h3>
          <button
            onClick={handleClose}
            className={`${theme.textMuted} hover:${theme.textSecondary} transition-colors`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div ref={contentRef} className="flex-1 overflow-y-auto px-8 py-8">
          {!showSuccess ? (
            // Invite form
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="couple_names" className={`block text-xs font-medium ${theme.textSecondary} uppercase tracking-widest mb-3`}>
                  Couple Names
                </label>
                <input
                  type="text"
                  id="couple_names"
                  name="couple_names"
                  required
                  value={formData.couple_names}
                  onChange={handleChange}
                  onBlur={handleCoupleNamesBlur}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all"
                  placeholder="e.g., Sarah & Mike"
                />
              </div>

              <div>
                <label htmlFor="couple_email" className={`block text-xs font-medium ${theme.textSecondary} uppercase tracking-widest mb-3`}>
                  Email Address
                </label>
                <input
                  type="email"
                  id="couple_email"
                  name="couple_email"
                  required
                  value={formData.couple_email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all"
                  placeholder="couple@example.com"
                />
                <p className={`text-xs ${theme.textSecondary} mt-2 tracking-wide`}>
                  You can send an invitation email from the couple detail page after sharing vendors
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="wedding_date" className={`block text-xs font-medium ${theme.textSecondary} uppercase tracking-widest mb-3`}>
                    Wedding Date
                  </label>
                  <input
                    type="date"
                    id="wedding_date"
                    name="wedding_date"
                    value={formData.wedding_date}
                    onChange={handleChange}
                    placeholder="yyyy-mm-dd"
                    className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="wedding_location" className={`block text-xs font-medium ${theme.textSecondary} uppercase tracking-widest mb-3`}>
                    Location
                  </label>
                  <LocationAutocompleteInput
                    id="wedding_location"
                    name="wedding_location"
                    value={formData.wedding_location || ''}
                    onChange={(value) => setFormData(prev => ({ ...prev, wedding_location: value }))}
                    placeholder="e.g., Marbella, Spain"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="notes" className={`block text-xs font-medium ${theme.textSecondary} uppercase tracking-widest mb-3`}>
                  Private Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all resize-none"
                  placeholder="Your private notes about this couple (not visible to them)"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-2 sm:gap-3 pt-6">
                <button
                  type="button"
                  onClick={handleClose}
                  className={`flex-1 px-3 sm:px-6 py-3 border border-stone-200 ${theme.textSecondary} rounded-xl text-xs sm:text-sm font-medium hover:bg-stone-50 transition-colors whitespace-nowrap`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 ${theme.primaryButton} ${theme.textOnPrimary} px-3 sm:px-6 py-3 rounded-xl text-xs sm:text-sm font-medium ${theme.primaryButtonHover} transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap`}
                >
                  {loading
                    ? (isEditMode ? 'Updating...' : 'Creating...')
                    : (isEditMode ? 'Update Couple' : 'Create Couple')
                  }
                </button>
              </div>
            </form>
          ) : (
            // Success state
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="text-emerald-600" size={32} />
              </div>

              <h4 className={`text-lg md:text-xl font-semibold mb-2 ${theme.textPrimary}`}>
                {formData.couple_names} Created!
              </h4>

              <p className={`text-sm md:text-base ${theme.textSecondary} mb-6`}>
                {formData.couple_email
                  ? `Couple created with email ${formData.couple_email}. Send an invitation email from the couple detail page when ready.`
                  : 'Couple created successfully! Add an email address and send an invitation from the couple detail page.'
                }
              </p>

              <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 mb-6">
                <p className={`text-xs md:text-sm font-semibold ${theme.textSecondary} mb-2 flex items-center justify-center gap-2`}>
                  <LinkIcon size={16} />
                  Share Link
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareLink}
                    className="flex-1 px-3 py-2 bg-white border-2 border-gray-300 rounded-lg text-xs md:text-sm"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`px-3 md:px-4 py-2 ${theme.primaryButton} ${theme.textOnPrimary} rounded-lg text-sm font-semibold ${theme.primaryButtonHover} transition-colors whitespace-nowrap`}
                  >
                    Copy
                  </button>
                </div>
                <p className={`text-xs ${theme.textSecondary} mt-2`}>
                  Share this link with the couple to view your vendor recommendations
                </p>
              </div>

              <button
                onClick={handleDone}
                className={`w-full ${theme.primaryButton} ${theme.textOnPrimary} px-4 md:px-6 py-2 md:py-3 rounded-full text-sm md:text-base font-semibold ${theme.primaryButtonHover} transition-colors`}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
