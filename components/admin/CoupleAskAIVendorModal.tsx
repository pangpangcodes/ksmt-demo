'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { X, Upload, AlertCircle, Loader2, ChevronLeft, ChevronRight, CheckCircle, Sparkles, FileText } from 'lucide-react'
import { ParsedVendorOperation } from '@/types/vendor'
import VendorOperationCard from './VendorOperationCard'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { useModalSize, getModalClasses } from '@/hooks/useModalSize'

interface BulkImportModalProps {
  onClose: () => void
  onImport: (vendors: any[]) => void
}

export default function CoupleAskAIVendorModal({ onClose, onImport }: BulkImportModalProps) {
  const theme = useThemeStyles()
  const [mounted, setMounted] = useState(false)
  const { headerRef, contentRef, isLargeModal } = useModalSize(mounted)
  const { overlay: overlayClass, maxH: maxHClass } = getModalClasses(isLargeModal)

  const [inputMode, setInputMode] = useState<'text' | 'pdf' | null>(null)
  const [pastedData, setPastedData] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [pdfError, setPdfError] = useState('')
  const [parsing, setParsing] = useState(false)

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

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Prevent body scroll when modal is open
  useEffect(() => {
    setMounted(true)
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  // Auto-open file picker when PDF mode is selected
  useEffect(() => {
    if (inputMode === 'pdf' && operations.length === 0) {
      setTimeout(() => {
        fileInputRef.current?.click()
      }, 100)
    }
  }, [inputMode, operations.length])

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      setPdfError('Please select a PDF file')
      return
    }

    if (file.size > 20 * 1024 * 1024) {
      setPdfError('PDF file size must be under 20MB')
      return
    }

    setSelectedFile(file)
    setPdfError('')
  }

  const handleParsePDF = async () => {
    if (!selectedFile) return

    setParsing(true)
    setError('')
    setPdfError('')
    setOperations([])
    setCurrentOperationIndex(0)
    setClarifications([])

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      let token = sessionStorage.getItem('admin_auth')
      if (!token) {
        sessionStorage.setItem('admin_auth', 'admin')
        token = 'admin'
      }
      const response = await fetch('/api/admin/vendors/parse', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      const contentType = response.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        const text = await response.text()
        console.error('Non-JSON response:', text.substring(0, 200))
        throw new Error(`Server error (${response.status}). Check console for details.`)
      }

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to parse PDF')
      }

      setOperations(data.data.operations)
      setClarifications(data.data.clarifications_needed || [])
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : 'Failed to parse PDF. Please try again.')
      console.error('PDF parse error:', err)
    } finally {
      setParsing(false)
    }
  }

  const handleParseText = async () => {
    if (!pastedData.trim()) {
      setError('Please enter some data to parse')
      return
    }

    setParsing(true)
    setError('')
    setOperations([])
    setCurrentOperationIndex(0)
    setClarifications([])

    try {
      let token = sessionStorage.getItem('admin_auth')
      if (!token) {
        sessionStorage.setItem('admin_auth', 'admin')
        token = 'admin'
      }
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

      const contentType = result.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        const text = await result.text()
        console.error('Non-JSON response:', text.substring(0, 200))
        throw new Error(`Server error (${result.status}). Check console for details.`)
      }

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
      setParsing(false)
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
      let token = sessionStorage.getItem('admin_auth')
      if (!token) {
        sessionStorage.setItem('admin_auth', 'admin')
        token = 'admin'
      }
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
      // Keep operations in state so user can retry
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null

  return createPortal(
    <div className={`${overlayClass} bg-black/65 z-[9999] flex items-center justify-center p-4`} onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-xl max-w-2xl w-full ${maxHClass} border border-stone-200 overflow-hidden flex flex-col`} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div ref={headerRef} className="bg-white border-b border-stone-200 px-8 py-6 flex justify-between items-center flex-shrink-0">
          <h3 className={`font-display text-2xl md:text-3xl ${theme.textPrimary}`}>
            Ask AI
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
        <div className="flex-1 overflow-y-auto">
        <div ref={contentRef} className="px-8 py-8 space-y-4">

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileSelect}
            className="hidden"
            hidden
          />

          {/* Step 1: Choose Input Mode */}
          {!inputMode && operations.length === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setInputMode('text')}
                  className="p-6 border border-stone-200 rounded-xl hover:border-stone-900 hover:bg-stone-50 transition-colors text-left"
                >
                  <Sparkles className={`w-8 h-8 ${theme.textPrimary} mb-3`} />
                  <h3 className={`font-bold ${theme.textPrimary} mb-2`}>Paste Text</h3>
                  <p className={`text-sm ${theme.textSecondary}`}>
                    Describe vendor updates in natural language and let AI extract the changes
                  </p>
                </button>

                <button
                  onClick={() => setInputMode('pdf')}
                  className="p-6 border border-stone-200 rounded-xl hover:border-stone-900 hover:bg-stone-50 transition-colors text-left"
                >
                  <FileText className={`w-8 h-8 ${theme.textPrimary} mb-3`} />
                  <h3 className={`font-bold ${theme.textPrimary} mb-2`}>Upload PDF</h3>
                  <p className={`text-sm ${theme.textSecondary}`}>
                    Upload a contract or quote PDF and let AI extract the vendor details
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Step 2a: Text Input */}
          {inputMode === 'text' && operations.length === 0 && (
            <div className="space-y-4">
              <div>
                <label className={`block text-xs font-medium ${theme.textSecondary} uppercase tracking-widest mb-3`}>
                  Paste vendor update
                </label>
                <textarea
                  value={pastedData}
                  onChange={(e) => setPastedData(e.target.value)}
                  rows={10}
                  autoFocus
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all resize-none placeholder:text-gray-400 placeholder:whitespace-pre-wrap"
                  placeholder={"Examples:\n- Add pending payment of $500 for photographer\n- Paid deposit of 600 euros to venue today\n- Hired photographer for 1200 euros, deposit 600 due March 1\n- Signed contract with caterer yesterday\n- Update DJ email to john@example.com"}
                />
                <p className={`text-xs ${theme.textSecondary} mt-2 tracking-wide`}>
                  You can paste multiple vendors at once. AI will extract names, contacts, pricing, and more.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-2 sm:gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setInputMode(null)
                    setError('')
                  }}
                  className={`flex-1 px-3 sm:px-6 py-3 border border-stone-200 ${theme.textSecondary} rounded-xl text-xs sm:text-sm font-medium hover:bg-stone-50 transition-colors whitespace-nowrap`}
                >
                  Back
                </button>
                <button
                  onClick={handleParseText}
                  disabled={parsing || !pastedData.trim()}
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

          {/* Step 2b: PDF Upload */}
          {inputMode === 'pdf' && operations.length === 0 && (
            <div className="space-y-4">
              <div>
                <label className={`block text-xs font-medium ${theme.textSecondary} uppercase tracking-widest mb-3`}>
                  Upload PDF file
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-stone-300 rounded-lg p-8 text-center hover:border-stone-900 hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  <Upload className="w-12 h-12 text-stone-400 mx-auto mb-3" />
                  {selectedFile ? (
                    <div>
                      <p className={`${theme.textPrimary} font-semibold mb-1`}>{selectedFile.name}</p>
                      <p className={`text-sm ${theme.textSecondary}`}>
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className={`${theme.textSecondary} font-medium mb-1`}>Click to upload PDF</p>
                      <p className={`text-sm ${theme.textMuted}`}>Max 20MB</p>
                    </div>
                  )}
                </div>
              </div>

              {(error || pdfError) && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error || pdfError}</span>
                </div>
              )}

              <div className="flex gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setInputMode(null)
                    setSelectedFile(null)
                    setPdfError('')
                    setError('')
                  }}
                  disabled={parsing}
                  className={`flex-1 px-6 py-3 border border-stone-200 ${theme.textSecondary} rounded-xl text-sm font-medium hover:bg-stone-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Back
                </button>
                <button
                  onClick={handleParsePDF}
                  disabled={parsing || !selectedFile}
                  className={`flex-1 ${theme.primaryButton} ${theme.textOnPrimary} px-6 py-3 rounded-xl text-sm font-medium ${theme.primaryButtonHover} transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-2`}
                >
                  {parsing && selectedFile ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Analyzing...</span>
                      </div>
                      <span className="text-xs opacity-90">
                        {(() => {
                          const sizeMB = selectedFile.size / (1024 * 1024)
                          if (sizeMB > 5) return 'Large file - this may take 2-3 minutes'
                          if (sizeMB > 2) return 'This may take 1-2 minutes'
                          return 'Should complete in less than a minute'
                        })()}
                      </span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Parse PDF with AI
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review Operations */}
          {globalClarifications.length > 0 && (
            <div className={`${theme.warning.bg} border ${theme.border} rounded-xl p-4`}>
              <h4 className={`font-semibold ${theme.textPrimary} mb-2`}>
                General Clarifications Needed
              </h4>
              {globalClarifications.map((c, i) => (
                <div key={i} className={`text-sm ${theme.textSecondary} mb-2`}>
                  <p className={`font-medium ${theme.textPrimary}`}>{c.question}</p>
                  <p>{c.context}</p>
                </div>
              ))}
            </div>
          )}

          {operations.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className={`font-semibold ${theme.textPrimary}`}>
                  Review Vendors
                </h4>
                {operations.length > 1 && (
                  <div className={`text-sm ${theme.textSecondary}`}>
                    {currentOperationIndex + 1} of {operations.length}
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {operations.length > 1 && (
                <div className="mb-4">
                  <div className={`h-2 ${theme.pageBackground} rounded-full overflow-hidden`}>
                    <div
                      className="h-full transition-all duration-300 rounded-full"
                      style={{ width: `${((currentOperationIndex + 1) / operations.length) * 100}%`, backgroundColor: theme.primaryColor }}
                    />
                  </div>
                </div>
              )}

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
                          <div key={clarificationIndex} className={`${theme.warning.bg} border ${theme.border} rounded-xl p-3`}>
                            <div className="flex items-start gap-2 mb-2">
                              <AlertCircle className={`w-4 h-4 ${theme.warning.text} flex-shrink-0 mt-0.5`} />
                              <p className={`text-sm font-medium ${theme.textPrimary}`}>{clarification.question}</p>
                            </div>

                            {clarification.field_type === 'choice' && clarification.choices ? (
                              <div className="space-y-2">
                                {clarification.choices.map((choice, choiceIndex) => (
                                  <label
                                    key={choiceIndex}
                                    className={`flex items-center gap-3 p-3 border ${theme.border} ${theme.cardBackground} rounded-xl hover:${theme.pageBackground} cursor-pointer transition-colors`}
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
                                        if (newValue.trim()) {
                                          handleAnswer(newValue)
                                        }
                                      }}
                                      className="w-4 h-4"
                                    />
                                    <span className={`text-sm font-medium ${theme.textPrimary}`}>
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

                                      if (clarification.field_type === 'date') {
                                        const digits = value.replace(/\D/g, '')
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
                                    className={`w-full px-3 py-2 text-sm border ${theme.border} ${theme.cardBackground} ${theme.textPrimary} rounded-xl focus:outline-none focus:ring-1`}
                                    maxLength={clarification.field_type === 'date' ? 10 : undefined}
                                  />
                                </div>
                                <button
                                  onClick={() => handleAnswer()}
                                  disabled={!answerValue.trim()}
                                  className={`px-4 py-2 ${theme.primaryButton} ${theme.primaryButtonHover} ${theme.textOnPrimary} text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                  Update
                                </button>
                                <button
                                  onClick={handleSkip}
                                  className={`px-4 py-2 ${theme.secondaryButton} ${theme.secondaryButtonHover} ${theme.textSecondary} text-sm font-medium rounded-xl transition-colors border ${theme.border}`}
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
              {operations.length > 1 && (
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={handlePrevious}
                    disabled={currentOperationIndex === 0}
                    className={`flex items-center gap-2 px-4 py-2 ${theme.secondaryButton} ${theme.secondaryButtonHover} ${theme.textSecondary} rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
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
                          index !== currentOperationIndex ? 'bg-stone-300 hover:bg-stone-400' : ''
                        }`}
                        style={index === currentOperationIndex ? { backgroundColor: theme.primaryColor } : {}}
                        aria-label={`Go to operation ${index + 1}`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={handleNext}
                    disabled={currentOperationIndex === operations.length - 1}
                    className={`flex items-center gap-2 px-4 py-2 ${theme.secondaryButton} ${theme.secondaryButtonHover} ${theme.textSecondary} rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {error && operations.length > 0 && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
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
    </div>,
    document.body
  )
}
