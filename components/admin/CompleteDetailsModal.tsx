'use client'

import { useState, useEffect } from 'react'
import { X, ChevronRight, CheckCircle, AlertCircle } from 'lucide-react'
import { Vendor } from '@/types/vendor'
import { useThemeStyles } from '@/hooks/useThemeStyles'

interface Clarification {
  question: string
  field: string
  field_type: 'text' | 'number' | 'date' | 'email' | 'phone'
  required: boolean
}

interface CompleteDetailsModalProps {
  vendors: Vendor[]
  onClose: () => void
  onComplete: () => void
}

export default function CompleteDetailsModal({ vendors, onClose, onComplete }: CompleteDetailsModalProps) {
  const theme = useThemeStyles()
  const [currentVendorIndex, setCurrentVendorIndex] = useState(0)
  const [clarifications, setClarifications] = useState<Clarification[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const currentVendor = vendors[currentVendorIndex]

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  // Generate clarifications for current vendor on mount/vendor change
  useEffect(() => {
    if (currentVendor) {
      const newClarifications: Clarification[] = []

      // Only ask for essential fields: vendor_name, contact_name, email
      // Skip minor fields like phone and website
      if (!currentVendor.vendor_name) {
        newClarifications.push({
          question: `What is the ${currentVendor.vendor_type}'s vendor name?`,
          field: 'vendor_name',
          field_type: 'text',
          required: false
        })
      }

      if (!currentVendor.contact_name) {
        newClarifications.push({
          question: `What is the ${currentVendor.vendor_type}'s contact name?`,
          field: 'contact_name',
          field_type: 'text',
          required: false
        })
      }

      if (!currentVendor.email) {
        newClarifications.push({
          question: `What is the ${currentVendor.vendor_type}'s email?`,
          field: 'email',
          field_type: 'email',
          required: false
        })
      }

      setClarifications(newClarifications)
      setAnswers({})
    }
  }, [currentVendorIndex, currentVendor])

  const formatValue = (value: string, field: string, field_type: string) => {
    const trimmed = value.trim()
    if (!trimmed) return trimmed

    if (field_type === 'number') {
      return parseFloat(trimmed)
    } else if (field_type === 'email') {
      return trimmed.toLowerCase()
    } else if (field === 'vendor_name' || field === 'contact_name') {
      // Title case for names
      return trimmed
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
    }
    return trimmed
  }

  const handleNext = async () => {
    setLoading(true)
    setError('')

    try {
      const token = sessionStorage.getItem('admin_auth')

      // Build update object with all filled-in answers
      const updates: Record<string, any> = {}
      clarifications.forEach(clarification => {
        const value = answers[clarification.field]
        if (value && value.trim()) {
          updates[clarification.field] = formatValue(value, clarification.field, clarification.field_type)
        }
      })

      // Only make API call if there are updates
      if (Object.keys(updates).length > 0) {
        const response = await fetch(`/api/admin/vendors/${currentVendor.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updates)
        })

        if (!response.ok) {
          throw new Error('Failed to update vendor')
        }
      }

      // Move to next vendor or complete
      if (currentVendorIndex < vendors.length - 1) {
        setCurrentVendorIndex(currentVendorIndex + 1)
        setAnswers({})
      } else {
        // All done
        onComplete()
        onClose()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update vendor')
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    // Move to next vendor without saving
    if (currentVendorIndex < vendors.length - 1) {
      setCurrentVendorIndex(currentVendorIndex + 1)
      setAnswers({})
    } else {
      // All done
      onComplete()
      onClose()
    }
  }

  const handleDontAskAgain = async () => {
    setLoading(true)
    setError('')

    try {
      const token = sessionStorage.getItem('admin_auth')

      // Mark this vendor to not be prompted again
      const response = await fetch(`/api/admin/vendors/${currentVendor.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ skip_completion_prompt: true })
      })

      if (!response.ok) {
        throw new Error('Failed to update vendor')
      }

      // Move to next vendor or complete
      if (currentVendorIndex < vendors.length - 1) {
        setCurrentVendorIndex(currentVendorIndex + 1)
        setAnswers({})
      } else {
        // All done
        onComplete()
        onClose()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update vendor')
    } finally {
      setLoading(false)
    }
  }

  const formatDateInput = (value: string) => {
    // Remove any non-digit characters
    const digits = value.replace(/\D/g, '')

    // Format as YYYY-MM-DD
    if (digits.length <= 4) {
      return digits
    } else if (digits.length <= 6) {
      return `${digits.slice(0, 4)}-${digits.slice(4)}`
    } else {
      return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`
    }
  }

  const handleInputChange = (field: string, value: string, field_type: string) => {
    let formattedValue = value

    // Auto-format date input as YYYY-MM-DD
    if (field_type === 'date') {
      formattedValue = formatDateInput(value)
    }

    setAnswers({ ...answers, [field]: formattedValue })
  }

  if (!currentVendor || clarifications.length === 0) {
    // No vendors with missing details
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4" style={{ WebkitBackdropFilter: 'blur(12px)', backdropFilter: 'blur(12px)' }}>
      <div className={`${theme.cardBackground} rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className={`${theme.cardBackground} border-b border-stone-200 px-8 py-6 flex justify-between items-center flex-shrink-0`}>
          <h3 className={`font-display text-2xl md:text-3xl ${theme.textPrimary}`}>
            Complete Vendor Details
          </h3>
          <button
            onClick={onClose}
            className={`${theme.textMuted} hover:${theme.textSecondary} transition-colors`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-8 py-8">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Vendor Info */}
          <div className="mb-6 bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">
              {currentVendor.vendor_name || `(no name)`} - {currentVendor.vendor_type}
            </h3>
            {currentVendor.contact_name && (
              <p className="text-sm text-gray-600">Contact: {currentVendor.contact_name}</p>
            )}
          </div>

          {/* All Questions for Current Vendor */}
          <div className="space-y-4 mb-6">
            {clarifications.map((clarification) => (
              <div key={clarification.field}>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  {clarification.question}
                  {!clarification.required && (
                    <span className="text-gray-500 ml-2">(optional)</span>
                  )}
                </label>
                <input
                  type={clarification.field_type === 'email' ? 'email' :
                        clarification.field_type === 'phone' ? 'tel' :
                        clarification.field_type === 'number' ? 'number' :
                        'text'}
                  value={answers[clarification.field] || ''}
                  onChange={(e) => handleInputChange(clarification.field, e.target.value, clarification.field_type)}
                  placeholder={clarification.field_type === 'date' ? 'YYYY-MM-DD' : `Enter ${clarification.field.replace('_', ' ')}`}
                  maxLength={clarification.field_type === 'date' ? 10 : undefined}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-full font-semibold hover:bg-gray-200 hover:scale-105 transition-all disabled:opacity-50"
              >
                Skip
              </button>
              <button
                onClick={handleNext}
                disabled={loading}
                className={`flex-1 px-4 py-2 ${theme.primaryButton} ${theme.primaryButtonHover} ${theme.textOnPrimary} rounded-full font-semibold hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center gap-2`}
              >
                {loading ? (
                  'Saving...'
                ) : currentVendorIndex < vendors.length - 1 ? (
                  <>
                    Next <ChevronRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Complete <CheckCircle className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
            <button
              onClick={handleDontAskAgain}
              disabled={loading}
              className="w-full px-4 py-2 bg-red-50 text-red-700 rounded-lg font-semibold hover:bg-red-100 transition-colors disabled:opacity-50 text-sm"
            >
              Don't Ask Again
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
