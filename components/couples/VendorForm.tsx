'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus, Trash2 } from 'lucide-react'
import { Vendor, VendorFormData, Payment, VENDOR_TYPES, CURRENCIES } from '@/types/vendor'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { useModalSize, getModalClasses } from '@/hooks/useModalSize'

interface VendorFormProps {
  vendor?: Vendor | null
  onClose: () => void
  onSave: () => void
}

export default function VendorForm({ vendor, onClose, onSave }: VendorFormProps) {
  const theme = useThemeStyles()
  const [formData, setFormData] = useState<VendorFormData>({
    vendor_type: '',
    vendor_name: '',
    contact_name: '',
    email: '',
    phone: '',
    website: '',
    vendor_currency: 'USD',      // Changed from 'EUR' to match database default
    converted_currency: 'USD',   // NEW: user's preferred conversion currency
    vendor_cost: '',             // Renamed from vendor_cost_original
    cost_converted: '',          // Renamed from total_cost (flexible!)
    contract_required: false,
    contract_signed: false,
    contract_signed_date: '',
    payments: [],
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  const { headerRef, contentRef, footerRef, isLargeModal } = useModalSize(mounted)
  const { overlay: overlayClass, maxH: maxHClass } = getModalClasses(isLargeModal)

  // Handle mounting and prevent body scroll when modal is open
  useEffect(() => {
    setMounted(true)
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  useEffect(() => {
    if (vendor) {
      // Ensure payment amounts are parsed as numbers, not strings
      const parsedPayments = (vendor.payments || []).map(payment => ({
        ...payment,
        amount: typeof payment.amount === 'string' ? parseFloat(payment.amount) : payment.amount,
        amount_converted: typeof payment.amount_converted === 'string' ? parseFloat(payment.amount_converted) : payment.amount_converted,
      }))

      setFormData({
        vendor_type: vendor.vendor_type,
        vendor_name: vendor.vendor_name || '',
        contact_name: vendor.contact_name || '',
        email: vendor.email || '',
        phone: vendor.phone || '',
        website: vendor.website || '',
        vendor_currency: vendor.vendor_currency || 'USD',
        converted_currency: vendor.cost_converted_currency || 'USD',  // NEW: load conversion currency
        vendor_cost: vendor.vendor_cost?.toString() || '',            // Renamed
        cost_converted: vendor.cost_converted?.toString() || '',      // Renamed
        contract_required: vendor.contract_required || false,
        contract_signed: vendor.contract_signed || false,
        contract_signed_date: vendor.contract_signed_date || '',
        payments: parsedPayments,
        notes: vendor.notes || ''
      })
    }
  }, [vendor])

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '')

    if (digits.length <= 3) {
      return digits
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    } else {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setFormData({ ...formData, phone: formatted })
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

  const handleAddPayment = () => {
    const newPayment: Payment = {
      id: crypto.randomUUID(),
      description: '',
      amount: 0,
      amount_currency: formData.vendor_currency,  // Set from vendor currency
      amount_converted: 0,  // Initialize with 0
      amount_converted_currency: formData.converted_currency,  // Set conversion currency
      payment_type: 'bank_transfer',  // Default to bank transfer
      refundable: false,  // Default to non-refundable
      due_date: '',
      paid: false,
      paid_date: ''
    }
    setFormData({
      ...formData,
      payments: [...formData.payments, newPayment]
    })
  }

  const handleUpdatePayment = (index: number, updated: Partial<Payment>) => {
    const newPayments = [...formData.payments]
    newPayments[index] = { ...newPayments[index], ...updated }
    setFormData({ ...formData, payments: newPayments })
  }

  const handleRemovePayment = (index: number) => {
    setFormData({
      ...formData,
      payments: formData.payments.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const token = sessionStorage.getItem('couples_auth')
      const url = vendor
        ? `/api/couples/vendors/${vendor.id}`
        : '/api/couples/vendors'

      const method = vendor ? 'PATCH' : 'POST'

      // Calculate totals from payments (excluding refundable)
      const calculatedVendorCost = formData.payments
        .filter(p => !p.refundable)
        .reduce((sum, p) => sum + (p.amount || 0), 0)
      const calculatedConvertedCost = formData.payments
        .filter(p => !p.refundable)
        .reduce((sum, p) => {
          if (p.amount_converted) {
            return sum + p.amount_converted
          }
          return sum + (p.amount || 0)
        }, 0)

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          vendor_type: formData.vendor_type,
          vendor_name: formData.vendor_name || null,
          contact_name: formData.contact_name || null,
          email: formData.email || null,
          phone: formData.phone || null,
          website: formData.website || null,
          vendor_currency: formData.vendor_currency,
          vendor_cost: calculatedVendorCost > 0 ? calculatedVendorCost : null,
          cost_converted: calculatedConvertedCost > 0 ? calculatedConvertedCost : null,
          cost_converted_currency: formData.converted_currency,  // Transform: converted_currency → cost_converted_currency
          contract_required: formData.contract_required || false,
          contract_signed: formData.contract_signed,
          contract_signed_date: formData.contract_signed_date || null,
          payments: formData.payments,
          notes: formData.notes || null
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save vendor')
      }

      onSave()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null

  return createPortal(
    <div className={`${overlayClass} bg-black/65 z-[9999] flex items-center justify-center p-4`} onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-xl max-w-3xl w-full ${maxHClass} border border-stone-200 overflow-hidden flex flex-col`} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div ref={headerRef} className="bg-white border-b border-stone-200 px-8 py-6 flex justify-between items-center flex-shrink-0">
          <h3 className={`font-display text-2xl md:text-3xl ${theme.textPrimary}`}>
            {vendor ? 'Edit Vendor' : 'Add Vendor'}
          </h3>
          <button
            onClick={onClose}
            className={`${theme.textMuted} hover:${theme.textSecondary} transition-colors`}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form - Scrollable Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div ref={contentRef} className="px-8 py-8 space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Vendor Type */}
            <div>
              <label htmlFor="vendor_type" className={`block text-xs font-medium ${theme.textSecondary} uppercase tracking-widest mb-3`}>
                Vendor Type *
              </label>
              <select
                id="vendor_type"
                required
                value={formData.vendor_type}
                onChange={(e) => setFormData({ ...formData, vendor_type: e.target.value })}
                className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm bg-white focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all"
              >
                <option value="">Select type...</option>
                {VENDOR_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Vendor Name */}
            <div>
              <label htmlFor="vendor_name" className={`block text-xs font-medium ${theme.textSecondary} uppercase tracking-widest mb-3`}>
                Vendor Name
              </label>
              <input
                type="text"
                id="vendor_name"
                value={formData.vendor_name}
                onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all"
                placeholder="Optional vendor name"
              />
            </div>

            {/* Contact Name */}
            <div>
              <label htmlFor="contact_name" className={`block text-xs font-medium ${theme.textSecondary} uppercase tracking-widest mb-3`}>
                Contact Name
              </label>
              <input
                type="text"
                id="contact_name"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all"
                placeholder="Contact person name"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className={`block text-xs font-medium ${theme.textSecondary} uppercase tracking-widest mb-3`}>
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all"
                placeholder="email@example.com"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className={`block text-xs font-medium ${theme.textSecondary} uppercase tracking-widest mb-3`}>
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={handlePhoneChange}
                className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all"
                placeholder="(555) 555-5555"
              />
            </div>

            {/* Website */}
            <div>
              <label htmlFor="website" className={`block text-xs font-medium ${theme.textSecondary} uppercase tracking-widest mb-3`}>
                Website
              </label>
              <input
                type="url"
                id="website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all"
                placeholder="https://example.com"
              />
            </div>

            {/* Vendor Currency */}
            <div>
              <label htmlFor="vendor_currency" className={`block text-xs font-medium ${theme.textSecondary} uppercase tracking-widest mb-3`}>
                Vendor Currency
              </label>
              <select
                id="vendor_currency"
                value={formData.vendor_currency}
                onChange={(e) => setFormData({ ...formData, vendor_currency: e.target.value })}
                className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm bg-white focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all"
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} ({currency.symbol}) - {currency.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Vendor Cost in Vendor Currency - Auto-calculated */}
            <div>
              <label htmlFor="vendor_cost" className={`block text-xs font-medium ${theme.textSecondary} uppercase tracking-widest mb-3`}>
                Vendor Cost ({CURRENCIES.find(c => c.code === formData.vendor_currency)?.symbol || '$'}) <span className="text-xs font-normal normal-case">- Auto-calculated</span>
              </label>
              <input
                type="text"
                id="vendor_cost"
                value={(() => {
                  const total = formData.payments
                    .filter(p => !p.refundable)
                    .reduce((sum, p) => sum + (p.amount || 0), 0)
                  return total > 0 ? total.toFixed(2) : '0.00'
                })()}
                readOnly
                disabled
                className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm bg-gray-50 text-gray-700 cursor-not-allowed"
              />
            </div>

            {/* Conversion Currency Dropdown */}
            <div>
              <label htmlFor="converted_currency" className={`block text-xs font-medium ${theme.textSecondary} uppercase tracking-widest mb-3`}>
                Conversion Currency
              </label>
              <select
                id="converted_currency"
                value={formData.converted_currency}
                onChange={(e) => setFormData({ ...formData, converted_currency: e.target.value })}
                className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm bg-white focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all"
              >
                {CURRENCIES.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Converted Cost - Auto-calculated */}
            <div>
              <label htmlFor="cost_converted" className={`block text-xs font-medium ${theme.textSecondary} uppercase tracking-widest mb-3`}>
                Converted Cost ({CURRENCIES.find(c => c.code === formData.converted_currency)?.symbol || '$'}) <span className="text-xs font-normal normal-case">- Auto-calculated</span>
              </label>
              <input
                type="text"
                id="cost_converted"
                value={(() => {
                  const total = formData.payments
                    .filter(p => !p.refundable)
                    .reduce((sum, p) => {
                      if (p.amount_converted) {
                        return sum + p.amount_converted
                      }
                      // If no converted amount, use the original amount as fallback
                      return sum + (p.amount || 0)
                    }, 0)
                  return total > 0 ? total.toFixed(2) : '0.00'
                })()}
                readOnly
                disabled
                className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm bg-gray-50 text-gray-700 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Contract Section */}
          <div className="border-t pt-4">
            <h4 className="font-semibold text-gray-900 mb-3">Contract</h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="contract_required"
                  checked={formData.contract_required}
                  onChange={(e) => setFormData({ ...formData, contract_required: e.target.checked })}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="contract_required" className="ml-2 text-sm font-medium text-gray-700">
                  Contract Required
                </label>
              </div>

              {formData.contract_required && (
                <>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="contract_signed"
                      checked={formData.contract_signed}
                      onChange={(e) => setFormData({ ...formData, contract_signed: e.target.checked })}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <label htmlFor="contract_signed" className="ml-2 text-sm font-medium text-gray-700">
                      Contract Signed
                    </label>
                  </div>

                  {formData.contract_signed && (
                    <div>
                      <label htmlFor="contract_signed_date" className={`block text-xs font-medium ${theme.textSecondary} uppercase tracking-widest mb-3`}>
                        Contract Signed Date
                      </label>
                      <input
                        type="text"
                        id="contract_signed_date"
                        value={formData.contract_signed_date}
                        onChange={(e) => {
                          const formatted = formatDateInput(e.target.value)
                          setFormData({ ...formData, contract_signed_date: formatted })
                        }}
                        placeholder="YYYY-MM-DD"
                        maxLength={10}
                        className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Payments Section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">Payments</h4>
              <button
                type="button"
                onClick={handleAddPayment}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                <Plus className="w-4 h-4" />
                Add Payment
              </button>
            </div>

            {formData.payments.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No payments added yet. Click "Add Payment" to add one.</p>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-gray-600 border-b border-gray-200 bg-gray-50">
                      <th className="text-left px-3 py-2 font-medium min-w-[140px]">Description *</th>
                      <th className="text-left px-3 py-2 font-medium min-w-[120px] whitespace-nowrap">
                        Amount in {formData.vendor_currency} ({CURRENCIES.find(c => c.code === formData.vendor_currency)?.symbol || '€'}) *
                      </th>
                      <th className="text-left px-3 py-2 font-medium min-w-[120px] whitespace-nowrap">
                        Amount in {formData.converted_currency} ({CURRENCIES.find(c => c.code === formData.converted_currency)?.symbol || '$'})
                      </th>
                      <th className="text-left px-3 py-2 font-medium min-w-[140px] whitespace-nowrap">Payment Type</th>
                      <th className="text-center px-3 py-2 font-medium min-w-[100px]">Refundable</th>
                      <th className="text-left px-3 py-2 font-medium min-w-[120px] whitespace-nowrap">Due Date</th>
                      <th className="text-center px-3 py-2 font-medium min-w-[60px]">Paid</th>
                      <th className="text-left px-3 py-2 font-medium min-w-[120px] whitespace-nowrap">Paid Date</th>
                      <th className="min-w-[50px]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...formData.payments].sort((a, b) => {
                      // Sort by due_date chronologically (earliest first)
                      if (!a.due_date && !b.due_date) return 0
                      if (!a.due_date) return 1 // Payments without due_date go last
                      if (!b.due_date) return -1
                      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
                    }).map((payment) => {
                      const originalIndex = formData.payments.findIndex(p => p.id === payment.id)
                      return (
                        <tr key={payment.id} className="border-b border-gray-100 last:border-0">
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={payment.description}
                              onChange={(e) => handleUpdatePayment(originalIndex, { description: e.target.value })}
                              className="w-full min-w-[130px] px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              placeholder="e.g., Deposit"
                              required
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={payment.amount || ''}
                              onChange={(e) => {
                                // Allow typing by updating amount immediately
                                const newAmount = parseFloat(e.target.value) || 0
                                handleUpdatePayment(originalIndex, { amount: newAmount })
                              }}
                              onBlur={async (e) => {
                                const newAmount = parseFloat(e.target.value) || 0

                                // Only auto-calculate for unpaid payments (paid amounts are historical facts)
                                if (payment.paid) {
                                  handleUpdatePayment(originalIndex, { amount: newAmount })
                                  return
                                }

                                // Auto-calculate amount_converted using live market rate
                                let amountConverted = newAmount
                                if (formData.vendor_currency !== formData.converted_currency) {
                                  try {
                                    // Fetch live exchange rate from Frankfurter API (free, no API key)
                                    const response = await fetch(
                                      `https://api.frankfurter.app/latest?from=${formData.vendor_currency}&to=${formData.converted_currency}`
                                    )
                                    const data = await response.json()
                                    const rate = data.rates[formData.converted_currency]

                                    if (rate) {
                                      amountConverted = parseFloat((newAmount * rate).toFixed(2))
                                    }
                                  } catch (error) {
                                    console.error('Failed to fetch exchange rate:', error)
                                    // Fallback: keep amount as-is
                                    amountConverted = newAmount
                                  }
                                }

                                handleUpdatePayment(originalIndex, {
                                  amount: newAmount,
                                  amount_converted: amountConverted,
                                  amount_converted_currency: formData.converted_currency
                                })
                              }}
                              className="w-full min-w-[110px] px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              placeholder="0.00"
                              required
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={payment.amount_converted || ''}
                              onChange={(e) => handleUpdatePayment(originalIndex, {
                                amount_converted: parseFloat(e.target.value) || 0,
                                amount_converted_currency: formData.converted_currency
                              })}
                              className="w-full min-w-[110px] px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              placeholder="0.00"
                              required={payment.paid}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={payment.payment_type || 'bank_transfer'}
                              onChange={(e) => handleUpdatePayment(originalIndex, { payment_type: e.target.value as 'cash' | 'bank_transfer' })}
                              className="w-full min-w-[130px] px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                              <option value="bank_transfer">Bank Transfer</option>
                              <option value="cash">Cash</option>
                            </select>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={payment.refundable || false}
                              onChange={(e) => handleUpdatePayment(originalIndex, { refundable: e.target.checked })}
                              className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                              title="Exclude from total cost if refundable"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={payment.due_date || ''}
                              onChange={(e) => {
                                const formatted = formatDateInput(e.target.value)
                                handleUpdatePayment(originalIndex, { due_date: formatted })
                              }}
                              placeholder="YYYY-MM-DD"
                              maxLength={10}
                              className="w-full min-w-[110px] px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={payment.paid}
                              onChange={(e) => handleUpdatePayment(originalIndex, { paid: e.target.checked })}
                              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                            />
                          </td>
                          <td className="px-3 py-2">
                            {payment.paid && (
                              <input
                                type="text"
                                value={payment.paid_date || ''}
                                onChange={(e) => {
                                  const formatted = formatDateInput(e.target.value)
                                  // If no due date exists, auto-set it to the paid date
                                  const updates: Partial<Payment> = { paid_date: formatted }
                                  if (!payment.due_date && formatted.length === 10) {
                                    updates.due_date = formatted
                                  }
                                  handleUpdatePayment(originalIndex, updates)
                                }}
                                placeholder="YYYY-MM-DD"
                                maxLength={10}
                                className="w-full min-w-[110px] px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              />
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemovePayment(originalIndex)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Remove"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 border-t-2 border-gray-300">
                      <td className="px-3 py-3 text-sm font-bold text-gray-900">Total</td>
                      <td className="px-3 py-3 text-sm font-bold text-gray-900">
                        {CURRENCIES.find(c => c.code === formData.vendor_currency)?.symbol}
                        {formData.payments
                          .filter(p => !p.refundable)
                          .reduce((sum, p) => sum + (p.amount || 0), 0)
                          .toFixed(2)} {formData.vendor_currency}
                      </td>
                      <td className="px-3 py-3 text-sm font-bold text-gray-900">
                        {(() => {
                          const total = formData.payments
                            .filter(p => !p.refundable)
                            .reduce((sum, p) => sum + (p.amount_converted || 0), 0)
                          const symbol = CURRENCIES.find(c => c.code === formData.converted_currency)?.symbol
                          return `${symbol}${total.toFixed(2)} ${formData.converted_currency}`
                        })()}
                      </td>
                      <td colSpan={6}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className={`block text-xs font-medium ${theme.textSecondary} uppercase tracking-widest mb-3`}>
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all resize-none"
              placeholder="Additional notes..."
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>
        </form>

        {/* Footer - Sticky CTA Buttons */}
        <div ref={footerRef} className="bg-white border-t border-stone-200 px-8 py-6 flex gap-3 justify-end flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className={`px-6 py-2.5 ${theme.secondaryButton} rounded-xl text-sm font-medium ${theme.secondaryButtonHover} transition-colors`}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="vendor-form"
            disabled={loading}
            className={`px-6 py-2.5 ${theme.primaryButton} ${theme.primaryButtonHover} ${theme.textOnPrimary} rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            onClick={handleSubmit}
          >
            {loading ? 'Saving...' : (vendor ? 'Update Vendor' : 'Add Vendor')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
