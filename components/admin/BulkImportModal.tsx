'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, Upload, AlertCircle, Loader2, ChevronLeft, ChevronRight, CheckCircle, Sparkles } from 'lucide-react'
import { ParsedVendorOperation } from '@/types/vendor'
import VendorOperationCard from './VendorOperationCard'
import { useThemeStyles } from '@/hooks/useThemeStyles'

interface BulkImportModalProps {
  onClose: () => void
  onImport: (vendors: any[]) => void
}

export default function BulkImportModal({ onClose, onImport }: BulkImportModalProps) {
  const theme = useThemeStyles()
  const [pastedData, setPastedData] = useState('')
  const [operations, setOperations] = useState<ParsedVendorOperation[]>([])
  const [currentOperationIndex, setCurrentOperationIndex] = useState(0)
  const [clarifications, setClarifications] = useState<Array<{
    question: string
    field: string
    field_type?: 'text' | 'number' | 'date' | 'email' | 'phone' | 'choice'
    context?: string
    operation_index?: number
    required?: boolean
    choices?: string[]
  }>>([])
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  // Warn when leaving with unsaved operations
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (operations.length > 0) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [operations])

  const handleParse = async () => {
    if (!pastedData.trim()) {
      setError('Please enter some data to parse')
      return
    }

    setLoading(true)
    setError('')
    setOperations([])
    setCurrentOperationIndex(0)
    setClarifications([])

    try {
      const token = sessionStorage.getItem('admin_auth')
      const result = await fetch('/api/admin/vendors/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text: pastedData
        })
      })

      const data = await result.json()

      if (!result.ok || !data.success) {
        throw new Error(data.error || 'Failed to parse')
      }

      setOperations(data.data.operations)
      setClarifications(data.data.clarifications_needed || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse. Please check your input and try again.')
      console.error('Parse error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveOperation = (index: number) => {
    const newOperations = operations.filter((_, i) => i !== index)
    setOperations(newOperations)
    // Adjust current index if needed
    if (currentOperationIndex >= newOperations.length && newOperations.length > 0) {
      setCurrentOperationIndex(newOperations.length - 1)
    }
  }

  const handlePrevious = () => {
    if (currentOperationIndex > 0) {
      setCurrentOperationIndex(currentOperationIndex - 1)
    }
  }

  const handleNext = () => {
    if (currentOperationIndex < operations.length - 1) {
      setCurrentOperationIndex(currentOperationIndex + 1)
    }
  }

  const currentOperation = operations[currentOperationIndex]

  // Filter clarifications for current operation
  const globalClarifications = clarifications.filter(c => c.operation_index === undefined)
  const currentOperationClarifications = clarifications.filter(c => c.operation_index === currentOperationIndex)

  const handleExecute = async () => {
    if (operations.length === 0) {
      setError('No operations to execute')
      return
    }

    setLoading(true)
    setError('')

    try {
      const token = sessionStorage.getItem('admin_auth')
      const results = []

      for (const operation of operations) {
        const url = operation.action === 'create'
          ? '/api/admin/vendors'
          : `/api/admin/vendors/${operation.vendor_id}`

        const method = operation.action === 'create' ? 'POST' : 'PATCH'

        // For update operations, include mergePayments flag to preserve existing payments
        const requestBody = operation.action === 'update'
          ? { ...operation.vendor_data, mergePayments: true }
          : operation.vendor_data

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
          console.error(`Failed to ${operation.action} vendor:`, data.error)
          throw new Error(`Failed to ${operation.action} vendor: ${data.error}`)
        }

        results.push(data.data)
      }

      onImport(results)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute operations')
      console.error('Execute error:', err)
      // Keep operations in state and localStorage so user can retry
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4" onClick={onClose} style={{ WebkitBackdropFilter: 'blur(12px)', backdropFilter: 'blur(12px)' }}>
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[95vh] border border-stone-200 overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-white border-b border-stone-200 px-8 py-6 flex justify-between items-center flex-shrink-0">
          <h3 className={`font-display text-2xl md:text-3xl ${theme.textPrimary}`}>
            Ask Bridezilla
          </h3>
          <button
            onClick={onClose}
            className={`${theme.textMuted} hover:${theme.textSecondary} transition-colors`}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-4">
          <div>
            <label className={`block text-xs font-medium ${theme.textSecondary} uppercase tracking-widest mb-3`}>
              Paste vendor information
            </label>
            <textarea
              value={pastedData}
              onChange={(e) => setPastedData(e.target.value)}
              rows={10}
              autoFocus
              className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all resize-none placeholder:text-gray-400 placeholder:whitespace-pre-wrap"
              placeholder={"Examples:\n• Add pending payment of $500 for photographer\n• Paid deposit of 600 euros to venue today\n• Hired photographer for 1200 euros, deposit 600 due March 1\n• Signed contract with caterer yesterday\n• Update DJ email to john@example.com"}
            />
            <p className={`text-xs ${theme.textSecondary} mt-2 tracking-wide`}>
              You can paste multiple vendors at once. AI will extract names, contacts, pricing, and more.
            </p>
          </div>

          {operations.length === 0 && (
            <div className="flex gap-3 pt-6">
              <button
                onClick={handleParse}
                disabled={loading || !pastedData.trim()}
                className={`flex-1 ${theme.primaryButton} ${theme.textOnPrimary} px-6 py-3 rounded-xl text-sm font-medium ${theme.primaryButtonHover} transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Parse with AI
                  </>
                )}
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {globalClarifications.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">
                General Clarifications Needed
              </h4>
              {globalClarifications.map((c, i) => (
                <div key={i} className="text-sm text-gray-700 mb-2">
                  <p className="font-medium">{c.question}</p>
                  <p className="text-gray-600">{c.context}</p>
                </div>
              ))}
            </div>
          )}

          {operations.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">
                  Review Operations
                </h4>
                <div className="text-sm text-gray-600">
                  {currentOperationIndex + 1} of {operations.length}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-600 transition-all duration-300"
                    style={{ width: `${((currentOperationIndex + 1) / operations.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Current Operation Card */}
              {currentOperation && (
                <div className="mb-4">
                  <VendorOperationCard
                    operation={currentOperation}
                    onEdit={(updated) => {
                      const newOperations = [...operations]
                      newOperations[currentOperationIndex] = updated
                      setOperations(newOperations)
                    }}
                    onRemove={() => handleRemoveOperation(currentOperationIndex)}
                  />

                  {/* Operation-specific clarifications */}
                  {currentOperationClarifications.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {currentOperationClarifications.map((clarification, clarificationIndex) => {
                        const clarificationKey = `${clarification.operation_index}-${clarification.field}`
                        const answerValue = clarificationAnswers[clarificationKey] || ''

                        const handleAnswer = (valueOverride?: string) => {
                          const finalValue = valueOverride || answerValue
                          if (!finalValue.trim()) return

                          // Handle action_choice specially
                          if (clarification.field === 'action_choice') {
                            if (finalValue === 'Skip') {
                              // Remove this operation entirely
                              handleRemoveOperation(currentOperationIndex)
                            } else if (finalValue.startsWith('Update')) {
                              // Keep as update operation (no changes needed)
                            } else if (finalValue === 'Create new vendor') {
                              // Change to create operation
                              const newOperations = [...operations]
                              newOperations[currentOperationIndex] = {
                                ...newOperations[currentOperationIndex],
                                action: 'create',
                                vendor_id: undefined,
                                matched_vendor_name: undefined
                              }
                              setOperations(newOperations)
                            }
                          } else if (clarification.field === 'payment_type') {
                            // Special handling for payment_type - update the payment in payments array
                            const newOperations = [...operations]
                            const currentOp = newOperations[currentOperationIndex]

                            // Convert "Cash" or "Bank Transfer" to the correct value
                            const paymentTypeValue = finalValue === 'Cash' ? 'cash' : 'bank_transfer'

                            // Find the first payment without a payment_type and set it
                            if (currentOp.vendor_data.payments && Array.isArray(currentOp.vendor_data.payments)) {
                              const updatedPayments = currentOp.vendor_data.payments.map((payment: any) => {
                                if (!payment.payment_type) {
                                  return { ...payment, payment_type: paymentTypeValue }
                                }
                                return payment
                              })

                              currentOp.vendor_data = {
                                ...currentOp.vendor_data,
                                payments: updatedPayments
                              }
                            }

                            setOperations(newOperations)
                          } else {
                            // Update the operation with the new field value
                            const newOperations = [...operations]
                            let value: any = finalValue.trim()

                            // Handle special payment description clarifications
                            if (clarification.field.match(/^payment_\d+_description$/)) {
                              const paymentIndex = parseInt(clarification.field.split('_')[1])
                              const currentPayments = newOperations[currentOperationIndex].vendor_data.payments || []

                              if (currentPayments[paymentIndex]) {
                                // Map user's answer to actual description
                                const description = finalValue === 'Total cost' ? 'Full payment' : '1st deposit'

                                const updatedPayments = [...currentPayments]
                                updatedPayments[paymentIndex] = {
                                  ...updatedPayments[paymentIndex],
                                  description
                                }

                                newOperations[currentOperationIndex].vendor_data = {
                                  ...newOperations[currentOperationIndex].vendor_data,
                                  payments: updatedPayments
                                }
                              }
                            } else {
                              // Standard field update logic
                              // Convert and format value based on field type and field name
                              if (clarification.field_type === 'number') {
                                value = parseFloat(finalValue)
                              } else if (clarification.field_type === 'email') {
                                value = finalValue.trim().toLowerCase()
                              } else if (clarification.field === 'vendor_name' || clarification.field === 'contact_name') {
                                // Title case for names: "el cortijo de los caballos" -> "El Cortijo De Los Caballos"
                                value = finalValue.trim()
                                  .split(' ')
                                  .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                  .join(' ')
                              }

                              newOperations[currentOperationIndex].vendor_data = {
                                ...newOperations[currentOperationIndex].vendor_data,
                                [clarification.field]: value
                              }
                            }
                            setOperations(newOperations)
                          }

                          // Remove this clarification
                          setClarifications(clarifications.filter((_, idx) => {
                            const globalIndex = clarifications.findIndex(c =>
                              c.operation_index === clarification.operation_index &&
                              c.field === clarification.field
                            )
                            return idx !== globalIndex
                          }))

                          // Clear the answer from state
                          const newAnswers = { ...clarificationAnswers }
                          delete newAnswers[clarificationKey]
                          setClarificationAnswers(newAnswers)
                        }

                        const handleSkip = () => {
                          // Remove this clarification
                          setClarifications(clarifications.filter((_, idx) => {
                            const globalIndex = clarifications.findIndex(c =>
                              c.operation_index === clarification.operation_index &&
                              c.field === clarification.field
                            )
                            return idx !== globalIndex
                          }))

                          // Clear the answer from state
                          const newAnswers = { ...clarificationAnswers }
                          delete newAnswers[clarificationKey]
                          setClarificationAnswers(newAnswers)
                        }

                        return (
                          <div key={clarificationIndex} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-start gap-2 mb-2">
                              <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                              <p className="text-sm font-medium text-gray-900">{clarification.question}</p>
                            </div>

                            {clarification.field_type === 'choice' && clarification.choices ? (
                              <div className="space-y-2">
                                {clarification.choices.map((choice, choiceIndex) => (
                                  <label
                                    key={choiceIndex}
                                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                  >
                                    <input
                                      type="radio"
                                      name={clarificationKey}
                                      value={choice}
                                      checked={answerValue === choice}
                                      onChange={(e) => {
                                        const newValue = e.target.value
                                        setClarificationAnswers({
                                          ...clarificationAnswers,
                                          [clarificationKey]: newValue
                                        })
                                        // Auto-submit when choice is selected
                                        if (newValue.trim()) {
                                          handleAnswer(newValue)
                                        }
                                      }}
                                      className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="text-sm font-medium text-gray-900">
                                      {choice === 'bank_transfer' ? 'Bank Transfer' :
                                       choice === 'cash' ? 'Cash' :
                                       choice}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            ) : (
                              <div className="flex gap-2 items-end">
                                <div className="flex-1">
                                  <input
                                    type={clarification.field_type === 'date' ? 'text' : (clarification.field_type || 'text')}
                                    value={answerValue}
                                    onChange={(e) => {
                                      let value = e.target.value

                                      // Auto-format date input as YYYY-MM-DD
                                      if (clarification.field_type === 'date') {
                                        // Remove any non-digit characters
                                        const digits = value.replace(/\D/g, '')

                                        // Format as YYYY-MM-DD
                                        if (digits.length <= 4) {
                                          value = digits
                                        } else if (digits.length <= 6) {
                                          value = `${digits.slice(0, 4)}-${digits.slice(4)}`
                                        } else {
                                          value = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`
                                        }
                                      }

                                      setClarificationAnswers({
                                        ...clarificationAnswers,
                                        [clarificationKey]: value
                                      })
                                    }}
                                    placeholder={clarification.field_type === 'date' ? 'YYYY-MM-DD' : 'Enter value...'}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    maxLength={clarification.field_type === 'date' ? 10 : undefined}
                                  />
                                </div>
                                <button
                                  onClick={() => handleAnswer()}
                                  disabled={!answerValue.trim()}
                                  className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                  Update
                                </button>
                                <button
                                  onClick={handleSkip}
                                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                  Skip
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Controls */}
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={handlePrevious}
                  disabled={currentOperationIndex === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                <div className="flex gap-1">
                  {operations.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentOperationIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentOperationIndex
                          ? 'bg-primary-600'
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                      aria-label={`Go to operation ${index + 1}`}
                    />
                  ))}
                </div>

                <button
                  onClick={handleNext}
                  disabled={currentOperationIndex === operations.length - 1}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {operations.length > 0 && (
            <div className="flex gap-3 justify-end pt-6 border-t border-stone-200">
              <button
                type="button"
                onClick={onClose}
                className={`px-6 py-2.5 ${theme.secondaryButton} rounded-xl text-sm font-medium ${theme.secondaryButtonHover} transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={handleExecute}
                disabled={loading}
                className={`px-6 py-2.5 ${theme.primaryButton} ${theme.primaryButtonHover} ${theme.textOnPrimary} rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
