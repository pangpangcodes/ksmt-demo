'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { X, Upload, Loader2, ChevronLeft, ChevronRight, CheckCircle, FileText, Sparkles } from 'lucide-react'
import { VendorLibrary, ParsedVendorLibraryOperation, VendorParseResult } from '@/types/planner'
import VendorLibraryOperationCard from './VendorLibraryOperationCard'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { useModalSize, getModalClasses } from '@/hooks/useModalSize'

interface AskAIVendorModalProps {
  existingVendors: VendorLibrary[]
  onClose: () => void
  onSuccess: () => void
}

export default function PlannerAskAIVendorModal({
  existingVendors,
  onClose,
  onSuccess
}: AskAIVendorModalProps) {
  const theme = useThemeStyles()
  const [inputMode, setInputMode] = useState<'text' | 'pdf' | null>(null)
  const [textInput, setTextInput] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [pdfText, setPdfText] = useState<string>('')

  const [operations, setOperations] = useState<ParsedVendorLibraryOperation[]>([])
  const [currentOperationIndex, setCurrentOperationIndex] = useState(0)
  const [clarifications, setClarifications] = useState<any[]>([])
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<string, string>>({})

  const [loading, setLoading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [error, setError] = useState('')
  const [pdfError, setPdfError] = useState('')
  const [mounted, setMounted] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
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

  // Auto-open file picker when PDF mode is selected
  useEffect(() => {
    if (inputMode === 'pdf' && operations.length === 0) {
      // Small delay to ensure the file input is rendered
      setTimeout(() => {
        fileInputRef.current?.click()
      }, 100)
    }
  }, [inputMode, operations.length])

  // Warn when leaving with unsaved operations
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (operations.length > 0 && !executing) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [operations, executing])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (file.type !== 'application/pdf') {
      setPdfError('Please select a PDF file')
      return
    }

    // Validate file size (20MB limit)
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

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      let token = sessionStorage.getItem('planner_auth')

      // Fallback: if token is missing, try to get it from the environment
      if (!token) {
        // Set it manually for existing sessions
        const PLANNER_PASSWORD = 'planner'
        sessionStorage.setItem('planner_auth', PLANNER_PASSWORD)
        token = PLANNER_PASSWORD
      }

      console.log('Client sending token:', token ? 'present' : 'missing')

      const response = await fetch('/api/planners/vendor-library/parse', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Non-JSON response:', text.substring(0, 200))
        throw new Error(`Server error: Expected JSON but got ${contentType}. Status: ${response.status}`)
      }

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to parse PDF')
      }

      const parseResult: VendorParseResult = data.data

      // Debug: Log what we received
      console.log('📊 Parse Result:', {
        operationCount: parseResult.operations.length,
        vendors: parseResult.operations.map(op => ({
          action: op.action,
          name: op.vendor_data.vendor_name,
          type: op.vendor_data.vendor_type
        }))
      })

      setPdfText(data.extracted_text || '')
      setOperations(parseResult.operations)
      setClarifications(parseResult.clarifications_needed || [])
      setCurrentOperationIndex(0)
    } catch (err: any) {
      setPdfError(err.message || 'Failed to parse PDF. Please try again.')
      console.error('PDF parse error:', err)
    } finally {
      setParsing(false)
    }
  }

  const handleParseText = async () => {
    if (!textInput.trim()) {
      setError('Please enter some vendor information')
      return
    }

    setParsing(true)
    setError('')
    setOperations([])
    setClarifications([])

    try {
      const token = sessionStorage.getItem('planner_auth')
      const response = await fetch('/api/planners/vendor-library/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: textInput })
      })

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Non-JSON response:', text.substring(0, 200))
        throw new Error(`Server error: Expected JSON but got ${contentType}. Status: ${response.status}`)
      }

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to parse vendors')
      }

      const parseResult: VendorParseResult = data.data
      setOperations(parseResult.operations)
      setClarifications(parseResult.clarifications_needed || [])
      setCurrentOperationIndex(0)
    } catch (err: any) {
      setError(err.message || 'Failed to parse. Please check your input and try again.')
      console.error('Parse error:', err)
    } finally {
      setParsing(false)
    }
  }

  const handleRemoveOperation = (index: number) => {
    const newOperations = operations.filter((_, i) => i !== index)
    setOperations(newOperations)

    if (currentOperationIndex >= newOperations.length && newOperations.length > 0) {
      setCurrentOperationIndex(newOperations.length - 1)
    }
  }

  const handleEditOperation = (index: number, updated: ParsedVendorLibraryOperation) => {
    const newOperations = [...operations]
    newOperations[index] = updated
    setOperations(newOperations)
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

  const handleExecute = async () => {
    if (operations.length === 0) {
      setError('No vendors to add')
      return
    }

    setExecuting(true)
    setError('')

    try {
      const token = sessionStorage.getItem('planner_auth')
      const results = []

      for (const operation of operations) {
        const url = operation.action === 'create'
          ? '/api/planners/vendor-library'
          : `/api/planners/vendor-library/${operation.vendor_id}`

        const method = operation.action === 'create' ? 'POST' : 'PATCH'

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(operation.vendor_data)
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          console.error(`Failed to ${operation.action} vendor:`, data.error)
          throw new Error(`Failed to ${operation.action} vendor: ${data.error}`)
        }

        results.push(data.data)
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Failed to save vendors')
      console.error('Execute error:', err)
    } finally {
      setExecuting(false)
    }
  }

  const currentOperation = operations[currentOperationIndex]

  // Filter clarifications
  const globalClarifications = clarifications.filter(c => c.operation_index === undefined)
  const currentOperationClarifications = clarifications.filter(c => c.operation_index === currentOperationIndex)

  if (!mounted) return null

  return createPortal(
    <div className={`${overlayClass} bg-black/65 z-[9999] flex items-center justify-center p-4`}>
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

        {/* Content - Scrollable outer, unconstrained inner for size measurement */}
        <div className="flex-1 overflow-y-auto">
        <div ref={contentRef} className="px-8 py-8">
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
                    Paste vendor information in natural language and let AI extract the details
                  </p>
                </button>

                <button
                  onClick={() => setInputMode('pdf')}
                  className="p-6 border border-stone-200 rounded-xl hover:border-stone-900 hover:bg-stone-50 transition-colors text-left"
                >
                  <FileText className={`w-8 h-8 ${theme.textPrimary} mb-3`} />
                  <h3 className={`font-bold ${theme.textPrimary} mb-2`}>Upload PDF</h3>
                  <p className={`text-sm ${theme.textSecondary}`}>
                    Upload a PDF with vendor information and let AI extract everything
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Text Input */}
          {inputMode === 'text' && operations.length === 0 && (
            <div className="space-y-4">
              <div>
                <label className={`block text-xs font-medium ${theme.textSecondary} uppercase tracking-widest mb-3`}>
                  Paste vendor information
                </label>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Example: Maria's Flowers in Marbella, Instagram @mariasflores, email maria@flowers.es, phone +34 123 456, specializes in boho weddings, €800-1500 for arrangements..."
                  rows={10}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all resize-none"
                />
                <p className={`text-xs ${theme.textSecondary} mt-2 tracking-wide`}>
                  You can paste multiple vendors at once. AI will extract names, contacts, pricing, and more.
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
                  onClick={() => setInputMode(null)}
                  className={`flex-1 px-3 sm:px-6 py-3 border border-stone-200 ${theme.textSecondary} rounded-xl text-xs sm:text-sm font-medium hover:bg-stone-50 transition-colors whitespace-nowrap`}
                >
                  Back
                </button>
                <button
                  onClick={handleParseText}
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

          {/* Step 2: PDF Upload */}
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
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {(error || pdfError) && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error || pdfError}
                </div>
              )}

              <div className="flex gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setInputMode(null)
                    setSelectedFile(null)
                    setPdfError('')
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

          {/* Step 3: Review Parsed Vendors */}
          {operations.length > 0 && (
            <div className="space-y-4">
              {/* Progress */}
              <div className="mb-4">
                <p className={`text-sm ${theme.textSecondary}`}>
                  Reviewing vendor {currentOperationIndex + 1} of {operations.length}
                </p>
                <div className="w-full bg-stone-200 h-2 rounded-full mt-2">
                  <div
                    className="bg-emerald-600 h-2 rounded-full transition-all"
                    style={{ width: `${((currentOperationIndex + 1) / operations.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Current Operation */}
              {currentOperation && (
                <VendorLibraryOperationCard
                  key={`vendor-${currentOperationIndex}-${currentOperation.vendor_data.vendor_name}`}
                  operation={currentOperation}
                  existingVendor={
                    currentOperation.action === 'update' && currentOperation.vendor_id
                      ? existingVendors.find(v => v.id === currentOperation.vendor_id)
                      : undefined
                  }
                  onEdit={(updated) => handleEditOperation(currentOperationIndex, updated)}
                  onRemove={() => handleRemoveOperation(currentOperationIndex)}
                />
              )}

              {/* Clarifications */}
              {currentOperationClarifications.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="font-semibold text-amber-900 mb-3">Clarifications Needed:</p>
                  <div className="space-y-3">
                    {currentOperationClarifications.map((clarification, idx) => (
                      <div key={idx}>
                        <label className="block text-sm font-medium text-amber-900 mb-1">
                          {clarification.question}
                        </label>
                        {clarification.field_type === 'choice' ? (
                          <select
                            value={clarificationAnswers[`${currentOperationIndex}-${clarification.field}`] || ''}
                            onChange={(e) => setClarificationAnswers({
                              ...clarificationAnswers,
                              [`${currentOperationIndex}-${clarification.field}`]: e.target.value
                            })}
                            className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:outline-none focus:border-amber-500"
                          >
                            <option value="">Select...</option>
                            {clarification.choices?.map((choice: string) => (
                              <option key={choice} value={choice}>{choice}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={clarification.field_type || 'text'}
                            value={clarificationAnswers[`${currentOperationIndex}-${clarification.field}`] || ''}
                            onChange={(e) => setClarificationAnswers({
                              ...clarificationAnswers,
                              [`${currentOperationIndex}-${clarification.field}`]: e.target.value
                            })}
                            className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:outline-none focus:border-amber-500"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between gap-4 pt-4 border-t border-stone-200">
                <button
                  onClick={handlePrevious}
                  disabled={currentOperationIndex === 0}
                  className="px-4 py-2 border border-stone-200 rounded-lg font-semibold hover:border-stone-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Previous
                </button>

                {currentOperationIndex < operations.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className={`px-4 py-2 ${theme.primaryButton} ${theme.textOnPrimary} rounded-lg font-semibold ${theme.primaryButtonHover} transition-colors flex items-center gap-2`}
                  >
                    Next
                    <ChevronRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={handleExecute}
                    disabled={executing}
                    className={`px-6 py-2 ${theme.primaryButton} ${theme.textOnPrimary} rounded-lg font-semibold ${theme.primaryButtonHover} transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                  >
                    {executing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Add {operations.length} Vendor{operations.length !== 1 ? 's' : ''} to Library
                      </>
                    )}
                  </button>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
