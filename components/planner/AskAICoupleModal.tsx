'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { X, Loader2, Sparkles, CheckCircle, Calendar } from 'lucide-react'
import { PlannerCouple, ParsedCoupleOperation, CoupleParseResult } from '@/types/planner'
import { v4 as uuidv4 } from 'uuid'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { useModalSize, getModalClasses } from '@/hooks/useModalSize'

interface AskAICoupleModalProps {
  existingCouples: PlannerCouple[]
  onClose: () => void
  onSuccess: () => void
}

export default function AskAICoupleModal({
  existingCouples,
  onClose,
  onSuccess
}: AskAICoupleModalProps) {
  const theme = useThemeStyles()
  const [textInput, setTextInput] = useState('')
  const [operations, setOperations] = useState<ParsedCoupleOperation[]>([])
  const [clarifications, setClarifications] = useState<any[]>([])
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<string, string>>({})

  const [parsing, setParsing] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  const { headerRef, contentRef, isLargeModal } = useModalSize(mounted)
  const { overlay: overlayClass, maxH: maxHClass } = getModalClasses(isLargeModal)

  // Handle mounting and prevent body scroll when modal is open
  useEffect(() => {
    setMounted(true)
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const handleParse = async () => {
    if (!textInput.trim()) {
      setError('Please enter couple information')
      return
    }

    setParsing(true)
    setError('')
    setOperations([])
    setClarifications([])

    try {
      const token = sessionStorage.getItem('planner_auth')
      const response = await fetch('/api/planner/couples/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: textInput })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to parse couple information')
      }

      const parseResult: CoupleParseResult = data.data
      setOperations(parseResult.operations)
      setClarifications(parseResult.clarifications_needed || [])
    } catch (err: any) {
      setError(err.message || 'Failed to parse. Please check your input and try again.')
      console.error('Parse error:', err)
    } finally {
      setParsing(false)
    }
  }

  const normalizeCoupleNames = (names: string): string => {
    // Replace "and" with "&" (case-insensitive)
    return names.replace(/\s+and\s+/gi, ' & ')
  }

  const handleExecute = async () => {
    if (operations.length === 0) {
      setError('No couples to add')
      return
    }

    setExecuting(true)
    setError('')

    try {
      const token = sessionStorage.getItem('planner_auth')

      for (const operation of operations) {
        // Generate share link ID for new couples
        const shareLinkId = operation.action === 'create' ? uuidv4() : undefined

        const url = operation.action === 'create'
          ? '/api/planner/couples'
          : `/api/planner/couples/${operation.couple_id}`

        const method = operation.action === 'create' ? 'POST' : 'PATCH'

        // Normalize couple names before submitting
        const normalizedCoupleData = {
          ...operation.couple_data,
          couple_names: operation.couple_data.couple_names
            ? normalizeCoupleNames(operation.couple_data.couple_names)
            : operation.couple_data.couple_names
        }

        const requestBody = operation.action === 'create'
          ? { ...normalizedCoupleData, share_link_id: shareLinkId }
          : normalizedCoupleData

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestBody)
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          console.error(`Failed to ${operation.action} couple:`, data.error)
          throw new Error(`Failed to ${operation.action} couple: ${data.error}`)
        }
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Failed to save couples')
      console.error('Execute error:', err)
    } finally {
      setExecuting(false)
    }
  }

  const handleEditOperation = (index: number, field: string, value: any) => {
    const newOperations = [...operations]
    newOperations[index] = {
      ...newOperations[index],
      couple_data: {
        ...newOperations[index].couple_data,
        [field]: value
      }
    }
    setOperations(newOperations)
  }

  const handleRemoveOperation = (index: number) => {
    setOperations(operations.filter((_, i) => i !== index))
  }

  if (!mounted) return null

  return createPortal(
    <div className={`${overlayClass} bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4`} style={{ WebkitBackdropFilter: 'blur(12px)', backdropFilter: 'blur(12px)' }}>
      <div className={`bg-white rounded-2xl shadow-xl max-w-2xl w-full ${maxHClass} border border-stone-200 overflow-hidden flex flex-col`}>
        {/* Header */}
        <div ref={headerRef} className="bg-white border-b border-stone-200 px-8 py-6 flex justify-between items-center flex-shrink-0">
          <h3 className={`font-display text-2xl md:text-3xl ${theme.textPrimary}`}>
            Ask AI
          </h3>
          <button
            onClick={onClose}
            className={`${theme.textMuted} hover:${theme.textSecondary} transition-colors`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div ref={contentRef} className="flex-1 overflow-y-auto px-8 py-8">
          {/* Step 1: Input */}
          {operations.length === 0 && (
            <div className="space-y-4">
              <div>
                <label className={`block text-xs font-medium ${theme.textSecondary} uppercase tracking-widest mb-3`}>
                  Describe the couple and wedding details
                </label>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Example: Sarah and Mike getting married September 14, 2026 at La Vie Estate in Marbella, email sarah.mike@gmail.com, boho rustic style, 100 guests..."
                  rows={8}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all resize-none"
                />
                <p className={`text-xs ${theme.textSecondary} mt-2 tracking-wide`}>
                  AI will extract couple names, wedding date (required), venue, email, and other details.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-2 sm:gap-3 pt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className={`flex-1 px-3 sm:px-6 py-3 border border-stone-200 ${theme.textSecondary} rounded-xl text-xs sm:text-sm font-medium hover:bg-stone-50 transition-colors whitespace-nowrap`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleParse}
                  disabled={parsing || !textInput.trim()}
                  className={`flex-1 ${theme.primaryButton} ${theme.textOnPrimary} px-3 sm:px-6 py-3 rounded-xl text-xs sm:text-sm font-medium ${theme.primaryButtonHover} transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap`}
                >
                  {parsing ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      Analyzing with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                      Parse with AI
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Review Parsed Couples */}
          {operations.length > 0 && (
            <div className="space-y-4">
              {operations.map((operation, idx) => (
                <div key={idx} className="bg-white p-4 md:p-6 rounded-xl border border-stone-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {operation.action === 'update' ? (
                        <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg font-semibold uppercase">
                          UPDATE
                        </span>
                      ) : (
                        <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg font-semibold uppercase">
                          CREATE
                        </span>
                      )}
                      <span className={`font-bold ${theme.textPrimary} text-sm md:text-base`}>
                        {operation.couple_data.couple_names || '(Couple names missing)'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveOperation(idx)}
                      className={`p-2 ${theme.textSecondary} hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Editable Fields */}
                  <div className="space-y-4">
                    {/* Couple Names */}
                    <div>
                      <label className={`block text-xs font-medium ${theme.textSecondary} uppercase tracking-widest mb-3`}>
                        Couple Names <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={operation.couple_data.couple_names || ''}
                        onChange={(e) => handleEditOperation(idx, 'couple_names', e.target.value)}
                        onBlur={(e) => {
                          const normalized = normalizeCoupleNames(e.target.value)
                          if (normalized !== e.target.value) {
                            handleEditOperation(idx, 'couple_names', normalized)
                          }
                        }}
                        placeholder="Sarah & Mike"
                        className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all"
                      />
                    </div>

                    {/* Wedding Date */}
                    <div>
                      <label className={`block text-xs font-medium ${theme.textSecondary} uppercase tracking-widest mb-3`}>
                        Wedding Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={operation.couple_data.wedding_date || ''}
                        onChange={(e) => handleEditOperation(idx, 'wedding_date', e.target.value)}
                        className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all"
                      />
                      <p className={`text-xs ${theme.textSecondary} mt-2 tracking-wide`}>Required for calendar view</p>
                    </div>

                    {/* Email */}
                    <div>
                      <label className={`block text-xs font-medium ${theme.textSecondary} uppercase tracking-widest mb-3`}>Email</label>
                      <input
                        type="email"
                        value={operation.couple_data.couple_email || ''}
                        onChange={(e) => handleEditOperation(idx, 'couple_email', e.target.value)}
                        placeholder="couple@example.com"
                        className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all"
                      />
                    </div>

                    {/* Venue Name */}
                    <div>
                      <label className={`block text-xs font-medium ${theme.textSecondary} uppercase tracking-widest mb-3`}>Venue Name</label>
                      <input
                        type="text"
                        value={operation.couple_data.venue_name || ''}
                        onChange={(e) => handleEditOperation(idx, 'venue_name', e.target.value)}
                        placeholder="La Vie Estate"
                        className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all"
                      />
                    </div>

                    {/* Wedding Location */}
                    <div>
                      <label className={`block text-xs font-medium ${theme.textSecondary} uppercase tracking-widest mb-3`}>Wedding Location</label>
                      <input
                        type="text"
                        value={operation.couple_data.wedding_location || ''}
                        onChange={(e) => handleEditOperation(idx, 'wedding_location', e.target.value)}
                        placeholder="Marbella, Spain"
                        className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all"
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <label className={`block text-xs font-medium ${theme.textSecondary} uppercase tracking-widest mb-3`}>Planner Notes</label>
                      <textarea
                        value={operation.couple_data.notes || ''}
                        onChange={(e) => handleEditOperation(idx, 'notes', e.target.value)}
                        rows={3}
                        placeholder="Private notes about this couple..."
                        className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all resize-none"
                      />
                    </div>
                  </div>

                  {/* Warnings */}
                  {operation.warnings && operation.warnings.length > 0 && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-sm font-semibold text-amber-900 mb-1">Warnings:</p>
                      <ul className="text-xs md:text-sm text-amber-800 list-disc list-inside space-y-1">
                        {operation.warnings.map((warning, wIdx) => (
                          <li key={wIdx}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Confidence */}
                  {operation.confidence !== undefined && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className={`text-xs ${theme.textSecondary}`}>AI Confidence:</span>
                      <div className="flex-1 bg-stone-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            operation.confidence > 0.8
                              ? 'bg-emerald-600'
                              : operation.confidence > 0.6
                              ? 'bg-amber-500'
                              : 'bg-orange-500'
                          }`}
                          style={{ width: `${operation.confidence * 100}%` }}
                        />
                      </div>
                      <span className={`text-xs font-semibold ${theme.textSecondary}`}>
                        {Math.round(operation.confidence * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {/* Clarifications */}
              {clarifications.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="font-semibold text-amber-900 mb-3 text-sm">Clarifications Needed:</p>
                  <div className="space-y-3">
                    {clarifications.map((clarification, idx) => (
                      <div key={idx}>
                        <label className="block text-xs font-medium text-amber-900 mb-1">
                          {clarification.question}
                        </label>
                        {clarification.field_type === 'date' ? (
                          <input
                            type="date"
                            value={clarificationAnswers[`${idx}-${clarification.field}`] || ''}
                            onChange={(e) => setClarificationAnswers({
                              ...clarificationAnswers,
                              [`${idx}-${clarification.field}`]: e.target.value
                            })}
                            className="w-full px-3 py-2 border border-amber-300 rounded-xl focus:outline-none focus:border-amber-500 text-sm"
                          />
                        ) : clarification.field_type === 'choice' ? (
                          <select
                            value={clarificationAnswers[`${idx}-${clarification.field}`] || ''}
                            onChange={(e) => setClarificationAnswers({
                              ...clarificationAnswers,
                              [`${idx}-${clarification.field}`]: e.target.value
                            })}
                            className="w-full px-3 py-2 border border-amber-300 rounded-xl focus:outline-none focus:border-amber-500 text-sm"
                          >
                            <option value="">Select...</option>
                            {clarification.choices?.map((choice: string) => (
                              <option key={choice} value={choice}>{choice}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={clarification.field_type || 'text'}
                            value={clarificationAnswers[`${idx}-${clarification.field}`] || ''}
                            onChange={(e) => setClarificationAnswers({
                              ...clarificationAnswers,
                              [`${idx}-${clarification.field}`]: e.target.value
                            })}
                            className="w-full px-3 py-2 border border-amber-300 rounded-xl focus:outline-none focus:border-amber-500 text-sm"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-6 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => {
                    setOperations([])
                    setTextInput('')
                  }}
                  className={`flex-1 px-6 py-3 border border-stone-200 ${theme.textSecondary} rounded-xl text-sm font-medium hover:bg-stone-50 transition-colors`}
                >
                  Start Over
                </button>
                <button
                  onClick={handleExecute}
                  disabled={executing}
                  className={`flex-1 ${theme.primaryButton} ${theme.textOnPrimary} px-6 py-3 rounded-xl text-sm font-medium ${theme.primaryButtonHover} transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                >
                  {executing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Adding Couple{operations.length > 1 ? 's' : ''}...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Add {operations.length} Couple{operations.length !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
