'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Settings } from 'lucide-react'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { supabase } from '@/lib/supabase'

interface ReminderTypes {
  overdue: boolean
  due_today: boolean
  '7_days': boolean
  '30_days': boolean
}

interface PaymentReminderSettings {
  id: string
  enabled: boolean
  email_recipient: string
  reminder_types: ReminderTypes
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export default function PaymentReminderSettingsModal({ isOpen, onClose, onSave }: Props) {
  const theme = useThemeStyles()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<PaymentReminderSettings | null>(null)
  const [enabled, setEnabled] = useState(true)
  const [emailRecipient, setEmailRecipient] = useState('')
  const [reminderTypes, setReminderTypes] = useState<ReminderTypes>({
    overdue: true,
    due_today: true,
    '7_days': true,
    '30_days': true
  })
  const [emailError, setEmailError] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      fetchSettings()
    }
  }, [isOpen])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const token = sessionStorage.getItem('admin_auth')
      const response = await fetch('/api/admin/payment-reminder-settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch settings')
      }

      const data = await response.json()
      if (data.success && data.data.settings) {
        const s = data.data.settings
        setSettings(s)
        setEnabled(s.enabled)
        setEmailRecipient(s.email_recipient)
        setReminderTypes(s.reminder_types)
      }
    } catch (err) {
      console.error('Fetch settings error:', err)
      showToast('Failed to load settings', 'error')
    } finally {
      setLoading(false)
    }
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmailRecipient(value)
    if (value && !validateEmail(value)) {
      setEmailError('Invalid email format')
    } else {
      setEmailError('')
    }
  }

  const handleReminderTypeToggle = (type: keyof ReminderTypes) => {
    setReminderTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }))
  }

  const handleSave = async () => {
    // Validation
    if (!emailRecipient) {
      setEmailError('Email is required')
      return
    }

    if (!validateEmail(emailRecipient)) {
      setEmailError('Invalid email format')
      return
    }

    setSaving(true)
    try {
      const token = sessionStorage.getItem('admin_auth')
      const response = await fetch('/api/admin/payment-reminder-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          enabled,
          email_recipient: emailRecipient,
          reminder_types: reminderTypes
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save settings')
      }

      showToast('Settings saved successfully', 'success')
      onSave()
      setTimeout(() => {
        onClose()
      }, 1000)
    } catch (err: any) {
      console.error('Save settings error:', err)
      showToast(err.message || 'Failed to save settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  if (!isOpen) return null
  if (typeof window === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4" onClick={onClose} style={{ WebkitBackdropFilter: 'blur(12px)', backdropFilter: 'blur(12px)' }}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[95vh] border border-stone-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white border-b border-stone-200 px-8 py-6 flex justify-between items-center flex-shrink-0">
          <h3 className={`font-display text-2xl md:text-3xl ${theme.textPrimary}`}>
            Payment Reminder Settings
          </h3>
          <button
            onClick={onClose}
            className={`${theme.textMuted} hover:${theme.textSecondary} transition-colors`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading settings...</div>
          ) : (
            <>
              {/* Enable/Disable Toggle */}
              <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl border border-stone-200">
                  <div>
                    <label className="text-sm font-semibold text-gray-900">
                      Enable Payment Reminders
                    </label>
                    <p className="text-xs text-gray-600 mt-1">
                      Receive automated email reminders for upcoming and overdue payments
                    </p>
                  </div>
                  <button
                    onClick={() => setEnabled(!enabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      enabled ? theme.primaryButton : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

              {/* Email Recipient */}
              <div>
                <label className={`block text-xs font-medium ${theme.textSecondary} uppercase tracking-widest mb-3`}>
                  Email Recipient
                </label>
                <input
                  type="email"
                  value={emailRecipient}
                  onChange={handleEmailChange}
                  placeholder="your.email@example.com"
                  className={`w-full px-4 py-3 border rounded-xl text-sm focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all ${
                    emailError
                      ? 'border-red-300'
                      : 'border-stone-200'
                  }`}
                />
                {emailError && (
                  <p className="text-xs text-red-600 mt-1">{emailError}</p>
                )}
              </div>

              {/* Reminder Types */}
              <div>
                <label className={`block text-xs font-medium ${theme.textSecondary} uppercase tracking-widest mb-3`}>
                  Send reminders for:
                </label>
                  <div className="space-y-3">
                    <label className={`flex items-center gap-3 ${enabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'} group`}>
                      <input
                        type="checkbox"
                        checked={enabled && reminderTypes.overdue}
                        onChange={() => handleReminderTypeToggle('overdue')}
                        disabled={!enabled}
                        className="w-4 h-4 text-bridezilla-pink rounded focus:ring-bridezilla-pink disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900">
                        Overdue payments
                      </span>
                    </label>

                    <label className={`flex items-center gap-3 ${enabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'} group`}>
                      <input
                        type="checkbox"
                        checked={enabled && reminderTypes.due_today}
                        onChange={() => handleReminderTypeToggle('due_today')}
                        disabled={!enabled}
                        className="w-4 h-4 text-bridezilla-pink rounded focus:ring-bridezilla-pink disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900">
                        Due today
                      </span>
                    </label>

                    <label className={`flex items-center gap-3 ${enabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'} group`}>
                      <input
                        type="checkbox"
                        checked={enabled && reminderTypes['7_days']}
                        onChange={() => handleReminderTypeToggle('7_days')}
                        disabled={!enabled}
                        className="w-4 h-4 text-bridezilla-pink rounded focus:ring-bridezilla-pink disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900">
                        7 days before due date
                      </span>
                    </label>

                    <label className={`flex items-center gap-3 ${enabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'} group`}>
                      <input
                        type="checkbox"
                        checked={enabled && reminderTypes['30_days']}
                        onChange={() => handleReminderTypeToggle('30_days')}
                        disabled={!enabled}
                        className="w-4 h-4 text-bridezilla-pink rounded focus:ring-bridezilla-pink disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900">
                        30 days before due date
                      </span>
                    </label>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer - Sticky CTA Buttons */}
        <div className="flex items-center justify-end gap-3 px-8 py-6 border-t border-stone-200 bg-white flex-shrink-0">
          <button
            onClick={onClose}
            disabled={saving}
            className={`px-6 py-2.5 ${theme.secondaryButton} rounded-xl text-sm font-medium ${theme.secondaryButtonHover} transition-colors disabled:opacity-50`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading || !!emailError}
            className={`px-6 py-2.5 ${theme.primaryButton} ${theme.primaryButtonHover} ${theme.textOnPrimary} rounded-xl text-sm font-medium transition-colors disabled:opacity-50`}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
