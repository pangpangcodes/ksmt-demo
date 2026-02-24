'use client'

import { useState } from 'react'
import { ParsedVendorOperation } from '@/types/vendor'
import { useThemeStyles } from '@/hooks/useThemeStyles'

interface VendorOperationCardProps {
  operation: ParsedVendorOperation
  onEdit: (updated: ParsedVendorOperation) => void
  onRemove: () => void
}

export default function VendorOperationCard({ operation, onEdit, onRemove }: VendorOperationCardProps) {
  const theme = useThemeStyles()
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState(operation.vendor_data)
  const [notesExpanded, setNotesExpanded] = useState(false)
  const isUpdate = operation.action === 'update'

  const handleSave = () => {
    onEdit({ ...operation, vendor_data: editedData })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedData(operation.vendor_data)
    setIsEditing(false)
  }

  const inputClass = `flex-1 px-2 py-1 text-xs border ${theme.border} ${theme.cardBackground} ${theme.textPrimary} rounded-lg focus:outline-none focus:ring-1`

  return (
    <div className={`${theme.cardBackground} p-4 rounded-xl border ${theme.border}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
          isUpdate
            ? `${theme.warning.bg} ${theme.warning.text}`
            : `${theme.success.bg} ${theme.success.text}`
        }`}>
          {isUpdate ? 'UPDATE' : 'CREATE'}
        </span>
        <span className={`font-bold ${theme.textPrimary}`}>
          {operation.matched_vendor_name || operation.vendor_data.vendor_name || operation.vendor_data.vendor_type || '(Unknown vendor)'}
        </span>
      </div>

      {isUpdate && (
        <div className={`text-xs font-medium ${theme.warning.text} ${theme.warning.bg} border ${theme.border} px-3 py-1.5 rounded-lg mb-3`}>
          {operation.matched_vendor_name
            ? `Updating existing ${operation.matched_vendor_name}`
            : `Updating vendor - please verify this is the correct vendor (ID: ${operation.vendor_id?.substring(0, 8)}...)`
          }
        </div>
      )}

      {/* View mode */}
      {!isEditing ? (
        <div className={`text-sm ${theme.textSecondary} space-y-1`}>
          {Object.entries(operation.vendor_data).map(([key, value]) => {
            if (key === 'payments') return null
            if (value === undefined || value === '' || value === null) return null

            let displayValue = String(value)
            if (key === 'vendor_cost_original' && operation.vendor_data.vendor_currency) {
              displayValue = `${value} ${operation.vendor_data.vendor_currency}`
            } else if (key === 'total_cost') {
              displayValue = `${value} USD`
            }

            const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

            if (key === 'notes') {
              const isLong = displayValue.length > 120
              return (
                <div key={key} className="flex gap-2">
                  <span className={`font-medium ${theme.textSecondary} shrink-0`}>{label}:</span>
                  <div>
                    <span className={theme.textPrimary}>
                      {isLong && !notesExpanded ? displayValue.slice(0, 120) + '...' : displayValue}
                    </span>
                    {isLong && (
                      <button
                        onClick={() => setNotesExpanded(v => !v)}
                        className={`ml-1 text-xs underline ${theme.textSecondary} hover:${theme.textPrimary}`}
                      >
                        {notesExpanded ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </div>
                </div>
              )
            }

            return (
              <div key={key} className="flex gap-2">
                <span className={`font-medium ${theme.textSecondary}`}>{label}:</span>
                <span className={theme.textPrimary}>{displayValue}</span>
              </div>
            )
          })}

          {operation.vendor_data.payments && Array.isArray(operation.vendor_data.payments) && operation.vendor_data.payments.length > 0 && (
            <div className={`mt-2 pt-2 border-t ${theme.border}`}>
              <span className={`font-medium ${theme.textSecondary} text-xs block mb-1`}>Payments:</span>
              <div className="space-y-1 pl-2">
                {[...operation.vendor_data.payments].sort((a: any, b: any) => {
                  const seqOrder = (desc: string) => {
                    const d = (desc || '').toLowerCase()
                    if (d.includes('final') || d.includes('balance')) return 90
                    if (d.match(/\b3rd\b|\bthird\b/)) return 30
                    if (d.match(/\b2nd\b|\bsecond\b/)) return 20
                    if (d.match(/\b1st\b|\bdeposit\b|\bfirst\b/)) return 10
                    return 50
                  }
                  const seqDiff = seqOrder(a.description) - seqOrder(b.description)
                  if (seqDiff !== 0) return seqDiff
                  if (!a.due_date && !b.due_date) return 0
                  if (!a.due_date) return -1
                  if (!b.due_date) return 1
                  return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
                }).map((payment: any, idx: number) => (
                  <div key={idx} className={`text-xs ${theme.textSecondary} space-y-0.5`}>
                    <div>
                      - {payment.description || `Payment ${idx + 1}`}: {payment.amount} {operation.vendor_data.vendor_currency || 'EUR'}
                      {payment.amount_converted && payment.amount_converted_currency && ` (${payment.amount_converted} ${payment.amount_converted_currency})`}
                      {payment.payment_type && (
                        <span className={`ml-2 px-1.5 py-0.5 ${theme.pageBackground} ${theme.textSecondary} rounded text-xs border ${theme.border}`}>
                          {payment.payment_type === 'cash' ? 'Cash' : 'Bank Transfer'}
                        </span>
                      )}
                    </div>
                    {payment.due_date && <div className={`pl-3 ${theme.textMuted}`}>Due: {payment.due_date}</div>}
                    {payment.paid && (
                      <div className={`pl-3 ${theme.success.text}`}>
                        Paid{payment.paid_date && ` on ${payment.paid_date}`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Edit mode */
        <div className="text-sm space-y-2">
          {Object.entries(editedData).map(([key, value]) => {
            if (key === 'payments') return null
            if (value === undefined || value === null) return null

            const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

            if (key === 'notes') {
              return (
                <div key={key} className="flex gap-2 items-start">
                  <span className={`font-medium ${theme.textSecondary} w-40 text-xs mt-1.5`}>{label}:</span>
                  <textarea
                    value={String(value)}
                    onChange={(e) => setEditedData({ ...editedData, [key]: e.target.value })}
                    rows={4}
                    className={`flex-1 px-2 py-1 text-xs border ${theme.border} ${theme.cardBackground} ${theme.textPrimary} rounded-lg focus:outline-none focus:ring-1 resize-y`}
                  />
                </div>
              )
            }

            return (
              <div key={key} className="flex gap-2 items-center">
                <span className={`font-medium ${theme.textSecondary} w-40 text-xs`}>{label}:</span>
                {typeof value === 'boolean' ? (
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setEditedData({ ...editedData, [key]: e.target.checked })}
                    className="w-4 h-4"
                  />
                ) : typeof value === 'number' ? (
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setEditedData({ ...editedData, [key]: parseFloat(e.target.value) || 0 })}
                    className={inputClass}
                  />
                ) : (
                  <input
                    type="text"
                    value={String(value)}
                    onChange={(e) => setEditedData({ ...editedData, [key]: e.target.value })}
                    className={inputClass}
                  />
                )}
              </div>
            )
          })}

          {/* Editable payments */}
          <div className={`mt-2 pt-2 border-t ${theme.border}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`font-medium ${theme.textSecondary} text-xs`}>Payments:</span>
              <button
                type="button"
                onClick={() => {
                  const newPayment = {
                    id: crypto.randomUUID(),
                    description: 'New payment',
                    amount: 0,
                    amount_currency: editedData.vendor_currency || 'EUR',
                    payment_type: 'bank_transfer' as 'cash' | 'bank_transfer',
                    refundable: false,
                    paid: false
                  }
                  setEditedData({ ...editedData, payments: [...(editedData.payments || []), newPayment] })
                }}
                className={`px-3 py-1 text-xs ${theme.secondaryButton} ${theme.secondaryButtonHover} ${theme.textPrimary} rounded-lg transition-colors font-medium border ${theme.border}`}
              >
                + Add Payment
              </button>
            </div>

            {editedData.payments && Array.isArray(editedData.payments) && editedData.payments.length > 0 ? (
              <div className="space-y-3">
                {[...editedData.payments].sort((a: any, b: any) => {
                  if (!a.due_date && !b.due_date) return 0
                  if (!a.due_date) return 1
                  if (!b.due_date) return -1
                  return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
                }).map((payment: any, idx: number) => (
                  <div key={payment.id || idx} className={`${theme.pageBackground} p-3 rounded-xl border ${theme.border}`}>
                    <div className="space-y-2">
                      <div className="flex gap-2 items-center">
                        <span className={`text-xs ${theme.textSecondary} w-20`}>Description:</span>
                        <input
                          type="text"
                          value={payment.description || ''}
                          onChange={(e) => {
                            const newPayments = [...(editedData.payments || [])]
                            newPayments[idx] = { ...newPayments[idx], description: e.target.value }
                            setEditedData({ ...editedData, payments: newPayments })
                          }}
                          className={inputClass}
                          placeholder="e.g., Deposit, 2nd payment"
                        />
                      </div>

                      <div className="flex gap-2 items-center">
                        <span className={`text-xs ${theme.textSecondary} w-20`}>Amount:</span>
                        <input
                          type="number"
                          value={payment.amount || 0}
                          onChange={(e) => {
                            const newPayments = [...(editedData.payments || [])]
                            newPayments[idx] = { ...newPayments[idx], amount: parseFloat(e.target.value) || 0 }
                            setEditedData({ ...editedData, payments: newPayments })
                          }}
                          className={inputClass}
                        />
                      </div>

                      <div className="flex gap-2 items-center">
                        <span className={`text-xs ${theme.textSecondary} w-20`}>Converted Amount:</span>
                        <input
                          type="number"
                          value={payment.amount_converted || ''}
                          onChange={(e) => {
                            const newPayments = [...(editedData.payments || [])]
                            newPayments[idx] = { ...newPayments[idx], amount_converted: parseFloat(e.target.value) || undefined }
                            setEditedData({ ...editedData, payments: newPayments })
                          }}
                          className={inputClass}
                          placeholder="Optional converted amount"
                        />
                      </div>

                      <div className="flex gap-2 items-center">
                        <span className={`text-xs ${theme.textSecondary} w-20`}>Payment Type:</span>
                        <select
                          value={payment.payment_type || 'bank_transfer'}
                          onChange={(e) => {
                            const newPayments = [...(editedData.payments || [])]
                            newPayments[idx] = { ...newPayments[idx], payment_type: e.target.value as 'cash' | 'bank_transfer' }
                            setEditedData({ ...editedData, payments: newPayments })
                          }}
                          className={`flex-1 px-2 py-1 text-xs border ${theme.border} ${theme.cardBackground} ${theme.textPrimary} rounded-lg`}
                        >
                          <option value="bank_transfer">Bank Transfer</option>
                          <option value="cash">Cash</option>
                        </select>
                      </div>

                      <div className="flex gap-2 items-center">
                        <span className={`text-xs ${theme.textSecondary} w-20`}>Due Date:</span>
                        <input
                          type="date"
                          value={payment.due_date || ''}
                          onChange={(e) => {
                            const newPayments = [...(editedData.payments || [])]
                            newPayments[idx] = { ...newPayments[idx], due_date: e.target.value }
                            setEditedData({ ...editedData, payments: newPayments })
                          }}
                          className={inputClass}
                        />
                      </div>

                      <div className="flex gap-4 items-center">
                        <label className={`flex items-center gap-1 text-xs ${theme.textSecondary}`}>
                          <input
                            type="checkbox"
                            checked={payment.paid || false}
                            onChange={(e) => {
                              const newPayments = [...(editedData.payments || [])]
                              newPayments[idx] = {
                                ...newPayments[idx],
                                paid: e.target.checked,
                                paid_date: e.target.checked ? (newPayments[idx].paid_date || new Date().toISOString().split('T')[0]) : undefined
                              }
                              setEditedData({ ...editedData, payments: newPayments })
                            }}
                            className="w-4 h-4"
                          />
                          Paid
                        </label>

                        {payment.paid && (
                          <div className="flex gap-2 items-center flex-1">
                            <span className={`text-xs ${theme.textSecondary}`}>Paid Date:</span>
                            <input
                              type="date"
                              value={payment.paid_date || ''}
                              onChange={(e) => {
                                const newPayments = [...(editedData.payments || [])]
                                newPayments[idx] = { ...newPayments[idx], paid_date: e.target.value }
                                setEditedData({ ...editedData, payments: newPayments })
                              }}
                              className={inputClass}
                            />
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const newPayments = (editedData.payments || []).filter((_: any, i: number) => i !== idx)
                          setEditedData({ ...editedData, payments: newPayments })
                        }}
                        className={`text-xs ${theme.error.text} font-medium`}
                      >
                        Remove Payment
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`text-xs ${theme.textMuted} italic`}>No payments yet. Click &quot;+ Add Payment&quot; to create one.</div>
            )}
          </div>
        </div>
      )}

      {/* Ambiguous fields */}
      {operation.ambiguous_fields && operation.ambiguous_fields.length > 0 && (
        <div className={`${theme.warning.text} text-xs mt-3 flex items-start gap-1`}>
          <span>!</span>
          <span>Review: {operation.ambiguous_fields.join(', ')}</span>
        </div>
      )}

      {/* Warnings */}
      {operation.warnings && operation.warnings.length > 0 && (
        <div className={`${theme.warning.text} text-xs mt-3 flex items-start gap-1`}>
          <span>!</span>
          <span>{operation.warnings.join(', ')}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-3">
        {!isEditing ? (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className={`text-xs ${theme.textSecondary} hover:${theme.textPrimary} font-medium transition-colors`}
            >
              Edit
            </button>
            <button
              onClick={onRemove}
              className={`text-xs ${theme.error.text} font-medium`}
            >
              Remove
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleSave}
              className={`px-3 py-1 text-xs ${theme.primaryButton} ${theme.primaryButtonHover} ${theme.textOnPrimary} rounded-lg font-medium transition-colors`}
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className={`px-3 py-1 text-xs ${theme.secondaryButton} ${theme.secondaryButtonHover} ${theme.textSecondary} rounded-lg font-medium transition-colors border ${theme.border}`}
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  )
}
