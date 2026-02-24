'use client'

import { useState, useEffect, Fragment } from 'react'
import Image from 'next/image'
import { Users, DollarSign, AlertCircle, CheckCircle, Download, Plus, Edit2, Trash2, Upload, Copy, Check, Settings, Calendar, ChevronDown, ChevronRight } from 'lucide-react'
import { Vendor, VendorStats, VENDOR_TYPES } from '@/types/vendor'
import { formatCurrency, getCurrencySymbol, calculateVendorStats, exportVendorsToCSV } from '@/lib/vendorUtils'
import { supabase } from '@/lib/supabase'
import VendorForm from './VendorForm'
import CoupleAskAIVendorModal from './CoupleAskAIVendorModal'
import CompleteDetailsModal from './CompleteDetailsModal'
import PaymentReminderSettingsModal from './PaymentReminderSettingsModal'
import SearchableMultiSelect from '../SearchableMultiSelect'
import { useTheme } from '@/contexts/ThemeContext'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { StatCard, StatCardSkeleton } from '@/components/ui/StatCard'

export default function VendorsPage() {
  const { theme: currentTheme } = useTheme()
  const theme = useThemeStyles()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [stats, setStats] = useState<VendorStats | null>(null)
  const [typeFilter, setTypeFilter] = useState<string[]>([])
  const [currencyDisplay, setCurrencyDisplay] = useState<'eur' | 'cad' | 'both'>('eur')
  const [weddingSettings, setWeddingSettings] = useState<{
    wedding_budget: number
    local_currency: string
    vendor_currency: string
    exchange_rate: number
  } | null>(null)

  // Preserve scroll position when filters change
  const preserveScrollPosition = () => {
    const scrollY = window.scrollY
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY)
    })
  }

  // Filter handler with scroll preservation
  const handleTypeFilterChange = (values: string[]) => {
    preserveScrollPosition()
    setTypeFilter(values)
  }
  const [showForm, setShowForm] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [showCompleteDetails, setShowCompleteDetails] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null)
  const [paymentReminders, setPaymentReminders] = useState<any[]>([])
  const [showRemindersBanner, setShowRemindersBanner] = useState(true)
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null)
  const [showReminderSettings, setShowReminderSettings] = useState(false)
  const [scrollToVendorId, setScrollToVendorId] = useState<string | null>(null)

  useEffect(() => {
    fetchVendors()
    fetchPaymentReminders()
    fetchWeddingSettings()
  }, [typeFilter])

  // Scroll to vendor after editing
  useEffect(() => {
    if (scrollToVendorId && vendors.length > 0 && !loading) {
      const vendorElement = document.getElementById(`vendor-${scrollToVendorId}`)
      if (vendorElement) {
        setTimeout(() => {
          vendorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          setScrollToVendorId(null)
        }, 100)
      }
    }
  }, [vendors, loading, scrollToVendorId])

  const fetchVendors = async () => {
    setError(null)
    setLoading(true)
    try {
      const { data: rawVendors, error: supabaseError } = await supabase.from('vendors').select('*')

      if (supabaseError || !rawVendors) {
        setError('Could not load vendors. Please try refreshing the page.')
        return
      }

      // Map database fields to component expected fields
      const allVendors = (rawVendors || []).map((v: any) => ({
        ...v,
        vendor_cost: v.estimated_cost_eur || v.vendor_cost,
        cost_converted: v.estimated_cost_cad || v.cost_converted,
        vendor_currency: 'EUR',
        cost_converted_currency: 'USD'
      }))

      // Filter by type if needed
      let filteredVendors = allVendors || []
      if (typeFilter.length > 0) {
        filteredVendors = filteredVendors.filter((v: Vendor) => typeFilter.includes(v.vendor_type))
      }

      // Sort vendors: Venue always first, then alphabetically by type
      const sortedVendors = filteredVendors.sort((a: Vendor, b: Vendor) => {
        if (a.vendor_type === 'Venue') return -1
        if (b.vendor_type === 'Venue') return 1
        return a.vendor_type.localeCompare(b.vendor_type)
      })

      // Calculate stats
      const stats = calculateVendorStats(allVendors || [])

      setVendors(sortedVendors)
      setStats(stats)
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Could not load vendors. Please try refreshing the page.')
    } finally {
      setLoading(false)
    }
  }

  const fetchPaymentReminders = async () => {
    try {
      const { data: vendors } = await supabase.from('vendors').select('*')

      // Calculate payment reminders
      const reminders: any[] = []
      vendors?.forEach((vendor: Vendor) => {
        vendor.payments?.forEach((payment: any) => {
          if (!payment.paid && payment.due_date) {
            const dueDate = new Date(payment.due_date)
            dueDate.setHours(0, 0, 0, 0) // Normalize to midnight
            const today = new Date()
            today.setHours(0, 0, 0, 0) // Normalize to midnight
            const daysUntilDue = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

            let reminderType: 'overdue' | 'due_today' | '7_days' = '7_days'
            if (daysUntilDue < 0) reminderType = 'overdue'
            else if (daysUntilDue === 0) reminderType = 'due_today'

            // Only show payments due in the next 7 days (exclude overdue)
            if (daysUntilDue >= 0 && daysUntilDue <= 7) {
              reminders.push({
                vendor_name: vendor.vendor_name,
                vendor_type: vendor.vendor_type,
                payment_description: payment.description,
                amount: payment.amount_converted || payment.amount,
                currency: payment.amount_converted_currency || payment.amount_currency,
                due_date: payment.due_date,
                reminder_type: reminderType,
                days_until_due: daysUntilDue
              })
            }
          }
        })
      })

      setPaymentReminders(reminders.sort((a, b) => a.days_until_due - b.days_until_due))
    } catch (err) {
      console.error('Payment reminders error:', err)
      setPaymentReminders([])
    }
  }

  const fetchWeddingSettings = async () => {
    try {
      const { data } = await supabase.from('wedding_settings').select('*').single()
      if (data) {
        setWeddingSettings({
          wedding_budget: data.wedding_budget ?? 50000,
          local_currency: data.local_currency ?? 'USD',
          vendor_currency: data.vendor_currency ?? 'EUR',
          exchange_rate: data.exchange_rate ?? 0.9259,
        })
      }
    } catch (err) {
      console.error('Failed to fetch wedding settings:', err)
    }
  }

  const handleExportCSV = async () => {
    try {
      // Use the exportVendorsToCSV function from lib/vendorUtils
      const csvContent = exportVendorsToCSV(vendors)
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `vendors-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
    } catch (err) {
      console.error('Export error:', err)
    }
  }

  const handleAddVendor = () => {
    setEditingVendor(null)
    setShowForm(true)
  }

  const handleEditVendor = (vendor: Vendor) => {
    setEditingVendor(vendor)
    setShowForm(true)
  }

  const handleDeleteVendor = async (id: string) => {
    try {
      await supabase.from('vendors').delete().eq('id', id)
      fetchVendors()
      fetchPaymentReminders()
      setDeleteConfirm(null)
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingVendor(null)
  }

  const handleFormSave = () => {
    // Store vendor ID to scroll to after refresh
    if (editingVendor) {
      setScrollToVendorId(editingVendor.id)
    }
    fetchVendors()
    fetchPaymentReminders()
  }

  const handleBulkImport = async (vendors: any[]) => {
    try {
      // Import each vendor
      for (const vendor of vendors) {
        await supabase.from('vendors').insert(vendor)
      }

      // Scroll to and expand the first imported vendor
      const firstId = vendors[0]?.id
      if (firstId) {
        setScrollToVendorId(firstId)
        setExpandedVendor(firstId)
      }

      // Refresh vendor list
      fetchVendors()
      fetchPaymentReminders()
    } catch (err) {
      console.error('Bulk import error:', err)
      throw err
    }
  }

  // Detect vendors with missing important details (only essential fields)
  const getVendorsWithMissingDetails = () => {
    return vendors.filter(vendor =>
      !vendor.skip_completion_prompt && (
        !vendor.vendor_name ||
        !vendor.contact_name ||
        !vendor.email
      )
    )
  }

  const handleCompleteDetails = () => {
    fetchVendors()
    setShowCompleteDetails(false)
  }

  const handleCopyEmail = async (email: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(email)
      setCopiedEmail(email)
      setTimeout(() => setCopiedEmail(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const vendorsNeedingDetails = getVendorsWithMissingDetails()

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
        {loading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <StatCardSkeleton key={i} theme={theme} />
            ))}
          </>
        ) : stats && (
          <>
            <StatCard
              icon={<Users className={`w-4 h-4 ${theme.textSecondary}`} />}
              label="Total Vendors"
              value={stats.totalVendors}
              theme={theme}
            />

            <StatCard
              icon={<DollarSign className={`w-4 h-4 ${theme.textSecondary}`} />}
              label="Total Cost"
              value={formatCurrency(stats.totalCost)}
              subtitle="USD"
              theme={theme}
            />

            <StatCard
              icon={<DollarSign className={`w-4 h-4 ${theme.success.text}`} />}
              iconBg={theme.success.bg}
              label="Total Paid"
              value={formatCurrency(stats.totalPaid)}
              subtitle="USD"
              theme={theme}
            />

            <StatCard
              icon={<AlertCircle className={`w-4 h-4 ${theme.textSecondary}`} />}
              label="Total Outstanding"
              value={formatCurrency(stats.totalOutstanding)}
              subtitle="USD"
              theme={theme}
            />
          </>
        )}
      </div>

      {/* Controls */}
      <div className={`${theme.cardBackground} rounded-xl shadow p-3 md:p-4 mb-4 md:mb-6`}>
        {/* Mobile: Stacked layout with inline dropdown */}
        <div className="lg:hidden">
          <div className="flex flex-col gap-2">
            {/* Top row: Type filter + Currency toggles */}
            <div className="flex gap-2 items-center">
              <SearchableMultiSelect
                options={VENDOR_TYPES.map(type => ({ value: type, label: type }))}
                selectedValues={typeFilter}
                onChange={handleTypeFilterChange}
                placeholder="Filter by type..."
                allLabel="All Types"
                className="flex-1 min-w-0"
                inlineOnMobile={true}
              />
              <div className={`flex items-center gap-1.5 px-2 py-2 ${theme.border} ${theme.borderWidth} rounded-xl ${theme.cardBackground} flex-shrink-0`}>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currencyDisplay === 'eur' || currencyDisplay === 'both'}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setCurrencyDisplay(currencyDisplay === 'cad' ? 'both' : 'eur')
                      } else {
                        setCurrencyDisplay('cad')
                      }
                    }}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className={`text-xs font-medium ${theme.textPrimary}`}>EUR</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currencyDisplay === 'cad' || currencyDisplay === 'both'}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setCurrencyDisplay(currencyDisplay === 'eur' ? 'both' : 'cad')
                      } else {
                        setCurrencyDisplay('eur')
                      }
                    }}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className={`text-xs font-medium ${theme.textPrimary}`}>USD</span>
                </label>
              </div>
            </div>

            {/* Bottom row: Export + Add + Ask AI */}
            <div className="flex gap-2">
              <button
                onClick={handleExportCSV}
                className={`flex items-center justify-center px-3 py-2 ${theme.secondaryButton} rounded-xl text-sm font-medium ${theme.secondaryButtonHover} transition-colors`}
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={handleAddVendor}
                className={`flex items-center justify-center gap-2 px-3 py-2 ${theme.secondaryButton} rounded-xl text-sm font-medium ${theme.secondaryButtonHover} transition-colors flex-shrink-0`}
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
              <button
                id="tour-ask-ksmt-vendors-couples-mobile"
                onClick={() => setShowBulkImport(true)}
                className="flex items-center justify-center gap-2 px-3 py-[5px] bg-ksmt-crimson hover:bg-[#7a2520] text-white rounded-xl text-sm font-medium transition-colors flex-1 min-w-0"
              >
                <img src="/ksmt-logo.svg" alt="ksmt" className="w-[26px] h-[26px] object-contain flex-shrink-0" />
                <span className="truncate">Ask AI</span>
              </button>
            </div>
          </div>
        </div>

        {/* Desktop: Original two-group layout */}
        <div className="hidden lg:flex flex-wrap gap-2 lg:gap-4 items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            <SearchableMultiSelect
              options={VENDOR_TYPES.map(type => ({ value: type, label: type }))}
              selectedValues={typeFilter}
              onChange={handleTypeFilterChange}
              placeholder="Filter by type..."
              allLabel="All Types"
              className="min-w-[160px]"
            />
            <div className={`flex items-center gap-2 md:gap-3 px-4 py-2 ${theme.border} ${theme.borderWidth} rounded-xl ${theme.cardBackground}`}>
              <label className="flex items-center gap-1 md:gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currencyDisplay === 'eur' || currencyDisplay === 'both'}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setCurrencyDisplay(currencyDisplay === 'cad' ? 'both' : 'eur')
                    } else {
                      setCurrencyDisplay('cad')
                    }
                  }}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className={`text-xs md:text-sm font-medium ${theme.textPrimary}`}>EUR</span>
              </label>
              <label className="flex items-center gap-1 md:gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currencyDisplay === 'cad' || currencyDisplay === 'both'}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setCurrencyDisplay(currencyDisplay === 'eur' ? 'both' : 'cad')
                    } else {
                      setCurrencyDisplay('eur')
                    }
                  }}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className={`text-xs md:text-sm font-medium ${theme.textPrimary}`}>USD</span>
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              className={`flex items-center justify-center gap-2 px-3 md:px-4 py-2 ${theme.secondaryButton} rounded-xl text-sm font-medium ${theme.secondaryButtonHover} transition-colors min-w-[44px]`}
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={handleAddVendor}
              className={`flex items-center justify-center gap-2 px-3 md:px-4 py-2 ${theme.secondaryButton} rounded-xl text-sm font-medium ${theme.secondaryButtonHover} transition-colors min-w-[44px]`}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Manually</span>
            </button>
            <button
              id="tour-ask-ksmt-vendors-couples"
              onClick={() => setShowBulkImport(true)}
              className="flex items-center justify-center gap-2 px-3 md:px-4 py-[5px] bg-ksmt-crimson hover:bg-[#7a2520] text-white rounded-xl text-sm font-medium transition-colors min-w-[44px]"
            >
              <img src="/ksmt-logo.svg" alt="ksmt" className="w-[26px] h-[26px] object-contain" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Budget Progress Visualization */}
      {stats && (
        <div className={`${theme.cardBackground} rounded-2xl shadow-md p-4 md:p-6 mb-4 md:mb-6 border ${theme.border}`}>
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h3 className={`${theme.typeSectionHeading} ${theme.textPrimary}`}>Budget Progress</h3>
            <span className={theme.typeStatValue} style={{ color: theme.primaryColor }}>
              {((stats.totalPaid / stats.totalCost) * 100).toFixed(1)}% Paid
            </span>
          </div>
          <div className="space-y-3">
            <div className="relative w-full h-8 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="absolute h-full transition-all duration-500 ease-out"
                style={{
                  width: `${Math.min((stats.totalPaid / stats.totalCost) * 100, 100)}%`,
                  backgroundColor: theme.primaryColor
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                {(() => {
                  const eurTotalCost = vendors.reduce((sum, v) => {
                    return sum + (v.payments || [])
                      .filter(p => !p.refundable)
                      .reduce((pSum, p) => pSum + (p.amount || 0), 0)
                  }, 0)
                  const eurTotalPaid = vendors.reduce((sum, v) => {
                    return sum + (v.payments || [])
                      .filter(p => !p.refundable && p.paid)
                      .reduce((pSum, p) => pSum + (p.amount || 0), 0)
                  }, 0)

                  if (currencyDisplay === 'eur') {
                    return (
                      <span className={`text-xs font-semibold ${theme.textPrimary} drop-shadow`}>
                        {formatCurrency(eurTotalPaid, 'EUR')} of {formatCurrency(eurTotalCost, 'EUR')} EUR
                      </span>
                    )
                  } else if (currencyDisplay === 'cad') {
                    return (
                      <span className={`text-xs font-semibold ${theme.textPrimary} drop-shadow`}>
                        {formatCurrency(stats.totalPaid)} of {formatCurrency(stats.totalCost)} USD
                      </span>
                    )
                  } else {
                    return (
                      <span className={`text-xs font-semibold ${theme.textPrimary} drop-shadow`}>
                        {formatCurrency(stats.totalPaid)} / {formatCurrency(eurTotalPaid, 'EUR')} of {formatCurrency(stats.totalCost)} / {formatCurrency(eurTotalCost, 'EUR')}
                      </span>
                    )
                  }
                })()}
              </div>
            </div>
            <div className={`flex justify-between ${theme.typeStatSubtitle}`}>
              {(() => {
                const eurTotalCost = vendors.reduce((sum, v) => {
                  return sum + (v.payments || [])
                    .filter(p => !p.refundable)
                    .reduce((pSum, p) => pSum + (p.amount || 0), 0)
                }, 0)
                const eurTotalPaid = vendors.reduce((sum, v) => {
                  return sum + (v.payments || [])
                    .filter(p => !p.refundable && p.paid)
                    .reduce((pSum, p) => pSum + (p.amount || 0), 0)
                }, 0)
                const eurTotalOutstanding = eurTotalCost - eurTotalPaid

                return (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
                      {currencyDisplay === 'eur' ? (
                        <span className={theme.textSecondary}>Paid: {formatCurrency(eurTotalPaid, 'EUR')} EUR</span>
                      ) : currencyDisplay === 'cad' ? (
                        <span className={theme.textSecondary}>Paid: {formatCurrency(stats.totalPaid)} USD</span>
                      ) : (
                        <span className={theme.textSecondary}>Paid: {formatCurrency(stats.totalPaid)} USD / {formatCurrency(eurTotalPaid, 'EUR')} EUR</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-200 rounded-full" />
                      {currencyDisplay === 'eur' ? (
                        <span className={theme.textSecondary}>Outstanding: {formatCurrency(eurTotalOutstanding, 'EUR')} EUR</span>
                      ) : currencyDisplay === 'cad' ? (
                        <span className={theme.textSecondary}>Outstanding: {formatCurrency(stats.totalOutstanding)} USD</span>
                      ) : (
                        <span className={theme.textSecondary}>Outstanding: {formatCurrency(stats.totalOutstanding)} USD / {formatCurrency(eurTotalOutstanding, 'EUR')} EUR</span>
                      )}
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Payment Timeline */}
      {(() => {
        // Get all unpaid payments with due dates from all vendors
        const upcomingPayments = vendors
          .flatMap(vendor =>
            (vendor.payments || [])
              .filter(p => !p.paid && !p.refundable && p.due_date)
              .map(payment => {
                // When EUR or both currencies selected, show EUR amounts
                const showEur = currencyDisplay === 'eur' || currencyDisplay === 'both'
                return {
                  vendor_id: vendor.id,
                  vendor_name: vendor.vendor_name || vendor.vendor_type,
                  vendor_type: vendor.vendor_type,
                  payment_description: payment.description,
                  payment_type: payment.payment_type,
                  payment_amount: showEur ? payment.amount : (payment.amount_converted || payment.amount),
                  payment_currency: showEur ? (payment.amount_currency || vendor.vendor_currency || 'EUR') : (payment.amount_converted_currency || payment.amount_currency || vendor.vendor_currency || 'EUR'),
                  due_date: payment.due_date!,
                  days_until_due: Math.ceil((new Date(payment.due_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                }
              })
          )
          .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
          .slice(0, 5) // Show next 5 payments

        return upcomingPayments.length > 0 ? (
          <div className={`${theme.cardBackground} rounded-2xl shadow-md p-3 md:p-6 mb-4 md:mb-6 border ${theme.border}`}>
            {/* Mobile: Title and Settings on same row */}
            <div className="flex sm:hidden items-center justify-between gap-2 mb-3">
              <h3 className={`font-display text-xl ${theme.textPrimary}`}>Upcoming Payments</h3>
              <button
                onClick={() => setShowReminderSettings(true)}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${theme.secondaryButton} ${theme.textPrimary} ${theme.secondaryButtonHover} flex-shrink-0`}
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
            </div>

            {/* Desktop: Original stacked layout */}
            <div className="hidden sm:flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-3 md:mb-4">
              <h3 className={`${theme.typeSectionHeading} ${theme.textPrimary}`}>Upcoming Payments</h3>
              <button
                onClick={() => setShowReminderSettings(true)}
                className={`flex items-center gap-2 px-3 md:px-4 py-2 text-sm font-medium rounded-lg transition-colors ${theme.secondaryButton} ${theme.textPrimary} ${theme.secondaryButtonHover} self-start sm:self-auto`}
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Reminder Settings</span>
                <span className="sm:hidden">Settings</span>
              </button>
            </div>
            <div className="space-y-2 md:space-y-3">
              {upcomingPayments.map((payment, index) => {
                const isOverdue = payment.days_until_due < 0
                const isDueToday = payment.days_until_due === 0
                const isDueSoon = payment.days_until_due > 0 && payment.days_until_due <= 7

                return (
                  <div key={index}>
                    {/* Mobile: New compact layout */}
                    <div
                      className={`sm:hidden p-3 rounded-lg border ${
                        isOverdue
                          ? 'bg-red-50 border-red-200'
                          : isDueToday
                          ? 'bg-orange-50 border-orange-200'
                          : isDueSoon
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className={`font-medium text-sm ${theme.textPrimary}`}>{payment.vendor_name}</span>
                          <div className="flex items-center gap-1.5 text-right flex-shrink-0">
                            <span className={`text-xs ${theme.textSecondary}`}>{payment.payment_description}</span>
                            {payment.payment_type && (
                              <>
                                <span className={`text-xs ${theme.textMuted}`}>•</span>
                                <span className={`text-xs ${theme.textMuted} whitespace-nowrap`}>
                                  {payment.payment_type === 'bank_transfer' ? 'Bank Transfer' : 'Cash'}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3 pt-1">
                          <span className={`${theme.typeStatValue} ${theme.textPrimary} whitespace-nowrap`}>
                            {formatCurrency(payment.payment_amount)} {payment.payment_currency}
                          </span>
                          <span className={`text-xs font-medium text-right whitespace-nowrap ${
                            isOverdue ? 'text-red-700' : isDueToday ? 'text-orange-700' : isDueSoon ? 'text-yellow-700' : 'text-gray-600'
                          }`}>
                            {(() => {
                              const [year, month, day] = payment.due_date.split('-')
                              const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                              const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                              if (isOverdue) return `Overdue by ${Math.abs(payment.days_until_due)} ${Math.abs(payment.days_until_due) === 1 ? 'day' : 'days'} on ${dateStr}`
                              else if (isDueToday) return `Due today on ${dateStr}`
                              else return `Due in ${payment.days_until_due} ${payment.days_until_due === 1 ? 'day' : 'days'} on ${dateStr}`
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Desktop: Original layout - horizontal with left/right alignment */}
                    <div
                      className={`hidden sm:flex items-center gap-4 p-3 rounded-lg border ${
                        isOverdue
                          ? 'bg-red-50 border-red-200'
                          : isDueToday
                          ? 'bg-orange-50 border-orange-200'
                          : isDueSoon
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium text-base ${theme.textPrimary} truncate`}>{payment.vendor_name}</span>
                          <span className={`text-xs ${theme.textMuted}`}>•</span>
                          <span className={`text-sm ${theme.textSecondary} truncate`}>{payment.payment_description}</span>
                          {payment.payment_type && (
                            <>
                              <span className={`text-xs ${theme.textMuted}`}>•</span>
                              <span className={`text-xs ${theme.textMuted}`}>
                                {payment.payment_type === 'bank_transfer' ? 'Bank Transfer' : 'Cash'}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`${theme.typeStatValue} ${theme.textPrimary} whitespace-nowrap`}>
                          {formatCurrency(payment.payment_amount)} {payment.payment_currency}
                        </span>
                        <span className={`text-xs font-medium whitespace-nowrap ${
                          isOverdue ? 'text-red-700' : isDueToday ? 'text-orange-700' : isDueSoon ? 'text-yellow-700' : 'text-gray-600'
                        }`}>
                          {(() => {
                            const [year, month, day] = payment.due_date.split('-')
                            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            if (isOverdue) return `${dateStr} overdue by ${Math.abs(payment.days_until_due)} ${Math.abs(payment.days_until_due) === 1 ? 'day' : 'days'}`
                            else if (isDueToday) return `${dateStr} due today`
                            else return `${dateStr} due in ${payment.days_until_due} ${payment.days_until_due === 1 ? 'day' : 'days'}`
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : null
      })()}

      {/* Missing Details Banner */}
      {vendorsNeedingDetails.length > 0 && (
        <div className={`${theme.warning.bg} border ${theme.border} rounded-2xl p-4 mb-4 md:mb-6 flex items-start justify-between gap-4`}>
          <div className="flex items-start gap-3">
            <AlertCircle className={`w-5 h-5 ${theme.warning.text} flex-shrink-0 mt-0.5`} />
            <div>
              <p className={`text-sm font-medium ${theme.textPrimary}`}>
                {vendorsNeedingDetails.length} {vendorsNeedingDetails.length === 1 ? 'vendor needs' : 'vendors need'} more details: {vendorsNeedingDetails.map(v => v.vendor_name || v.vendor_type).join(', ')}
              </p>
              <p className={`text-xs ${theme.textSecondary} mt-1`}>
                Complete missing information like vendor names, contact details, and phone numbers.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCompleteDetails(true)}
            className={`px-4 py-2 ${theme.primaryButton} ${theme.primaryButtonHover} ${theme.textOnPrimary} rounded-lg text-sm font-semibold transition-colors flex-shrink-0`}
          >
            Complete Details
          </button>
        </div>
      )}

      {/* Vendors Table */}
      <div className={`${theme.cardBackground} rounded-2xl border ${theme.border} ${theme.borderWidth} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                {/* Expand icon column */}
                <th className="px-4 py-3 text-left w-10"></th>
                <th className={`px-4 py-3 text-left text-xs font-semibold ${theme.textSecondary} uppercase`}>Type</th>
                <th className={`px-4 py-3 text-left text-xs font-semibold ${theme.textSecondary} uppercase`}>Email</th>
                <th className={`px-4 py-3 text-left text-xs font-semibold ${theme.textSecondary} uppercase`}>Contract</th>
                <th className={`px-4 py-3 text-left text-xs font-semibold ${theme.textSecondary} uppercase`}>Deposit</th>
                <th className={`px-4 py-3 text-left text-xs font-semibold ${theme.textSecondary} uppercase`}>Cost</th>
                <th className={`px-4 py-3 text-left text-xs font-semibold ${theme.textSecondary} uppercase`}>Paid</th>
                <th className={`px-4 py-3 text-left text-xs font-semibold ${theme.textSecondary} uppercase`}>Outstanding</th>
                <th className={`px-4 py-3 text-left text-xs font-semibold ${theme.textSecondary} uppercase`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8">
                    <div className={`${theme.error.bg} border ${theme.border} rounded-2xl p-8`}>
                      <div className="flex items-start gap-4">
                        <AlertCircle className={`${theme.error.text} flex-shrink-0`} size={24} />
                        <div>
                          <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-1`}>Unable to Load</h3>
                          <p className={`text-sm ${theme.error.text}`}>{error}</p>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : vendors.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    No vendors found
                  </td>
                </tr>
              ) : (
                vendors.map((vendor) => (
                  <Fragment key={vendor.id}>
                    <tr
                      id={`vendor-${vendor.id}`}
                      className="hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-200 last:border-b-0"
                      onClick={() => setExpandedVendor(expandedVendor === vendor.id ? null : vendor.id)}
                    >
                    {/* Expand icon */}
                    <td className="px-2 py-3 text-sm text-gray-500">
                      {expandedVendor === vendor.id ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </td>
                    <td className="px-2 py-3 text-sm text-gray-600 truncate">
                      {vendor.vendor_type}
                    </td>
                    <td className="px-2 py-3 text-sm text-gray-600">
                      {vendor.email ? (
                        <div className="flex items-center gap-2 group">
                          <span className="truncate">{vendor.email}</span>
                          <button
                            onClick={(e) => handleCopyEmail(vendor.email!, e)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded flex-shrink-0"
                            title="Copy email"
                          >
                            {copiedEmail === vendor.email ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">(no email)</span>
                      )}
                    </td>
                    <td className="px-2 py-3">
                      <div className={`inline-flex items-center justify-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold w-full ${
                        vendor.contract_signed
                          ? 'bg-emerald-50 text-emerald-700'
                          : !vendor.contract_required
                          ? 'bg-stone-100 text-stone-600'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {vendor.contract_signed ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            <span>Signed</span>
                          </>
                        ) : !vendor.contract_required ? (
                          <span>Not Required</span>
                        ) : (
                          <span>Unsigned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      {(() => {
                        // Check if first deposit payment is paid
                        // Look for payment with description containing "1st", "first", or just "deposit"
                        const firstDepositPayment = vendor.payments?.find(p =>
                          p.description.toLowerCase().match(/1st|first|^deposit$/i)
                        ) || vendor.payments?.[0] // Fall back to first payment if no explicit first deposit found

                        const isDepositPaid = firstDepositPayment?.paid || false

                        return (
                          <div className={`inline-flex items-center justify-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold w-full ${
                            isDepositPaid
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                            {isDepositPaid ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                <span>Paid</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3 h-3" />
                                <span>Pending</span>
                              </>
                            )}
                          </div>
                        )
                      })()}
                    </td>
                    <td className="px-2 py-3 text-sm">
                      <div>
                        {(() => {
                          // Check if any payment has estimated conversion
                          const hasEstimatedConversion = vendor.payments
                            ?.filter(p => !p.refundable)
                            .some(p => !p.amount_converted && p.amount > 0) || false

                          // Calculate total from payments in converted currency (excluding refundable)
                          const totalConverted = vendor.payments
                            ?.filter(p => !p.refundable)
                            .reduce((sum, p) => {
                              if (p.amount_converted) {
                                return sum + p.amount_converted
                              } else if (vendor.vendor_cost && vendor.cost_converted) {
                                return sum + (p.amount * (vendor.cost_converted / vendor.vendor_cost))
                              }
                              return sum + (p.amount || 0)
                            }, 0) || 0

                          // Calculate total in vendor currency (excluding refundable)
                          const totalVendorCurrency = vendor.payments
                            ?.filter(p => !p.refundable)
                            .reduce((sum, p) => sum + (p.amount || 0), 0) || 0

                          return (
                            <>
                              {(currencyDisplay === 'cad' || currencyDisplay === 'both') && (
                                <div className="font-medium text-gray-900 whitespace-nowrap">
                                  {hasEstimatedConversion ? '≈ ' : ''}{formatCurrency(totalConverted, vendor.cost_converted_currency || 'USD')} USD
                                </div>
                              )}
                              {(currencyDisplay === 'eur' || currencyDisplay === 'both') && vendor.vendor_currency && vendor.vendor_currency !== (vendor.cost_converted_currency || 'USD') && totalVendorCurrency > 0 && (
                                <div className={`text-xs whitespace-nowrap ${currencyDisplay === 'eur' ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                                  {formatCurrency(totalVendorCurrency, vendor.vendor_currency)} {vendor.vendor_currency}
                                </div>
                              )}
                            </>
                          )
                        })()}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-sm">
                      <div>
                        {(() => {
                          // Calculate total paid (excluding refundable)
                          const hasPaidEstimate = vendor.payments
                            ?.filter(p => !p.refundable && p.paid)
                            .some(p => !p.amount_converted && p.amount > 0) || false

                          const totalPaidConverted = vendor.payments
                            ?.filter(p => !p.refundable && p.paid)
                            .reduce((sum, p) => {
                              if (p.amount_converted) {
                                return sum + p.amount_converted
                              } else if (vendor.vendor_cost && vendor.cost_converted) {
                                return sum + (p.amount * (vendor.cost_converted / vendor.vendor_cost))
                              }
                              return sum + (p.amount || 0)
                            }, 0) || 0

                          const totalPaidVendorCurrency = vendor.payments
                            ?.filter(p => !p.refundable && p.paid)
                            .reduce((sum, p) => sum + (p.amount || 0), 0) || 0

                          return (
                            <>
                              {(currencyDisplay === 'cad' || currencyDisplay === 'both') && (
                                <div className="font-medium text-emerald-700 whitespace-nowrap">
                                  {hasPaidEstimate ? '≈ ' : ''}{formatCurrency(totalPaidConverted, vendor.cost_converted_currency || 'USD')} USD
                                </div>
                              )}
                              {(currencyDisplay === 'eur' || currencyDisplay === 'both') && vendor.vendor_currency && vendor.vendor_currency !== (vendor.cost_converted_currency || 'USD') && totalPaidVendorCurrency > 0 && (
                                <div className={`text-xs whitespace-nowrap ${currencyDisplay === 'eur' ? 'font-medium text-emerald-700' : 'text-gray-500'}`}>
                                  {formatCurrency(totalPaidVendorCurrency, vendor.vendor_currency)} {vendor.vendor_currency}
                                </div>
                              )}
                            </>
                          )
                        })()}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-sm">
                      <div>
                        {(() => {
                          // Calculate total remaining (unpaid, excluding refundable)
                          const hasRemainingEstimate = vendor.payments
                            ?.filter(p => !p.refundable && !p.paid)
                            .some(p => !p.amount_converted && p.amount > 0) || false

                          const totalRemainingConverted = vendor.payments
                            ?.filter(p => !p.refundable && !p.paid)
                            .reduce((sum, p) => {
                              if (p.amount_converted) {
                                return sum + p.amount_converted
                              } else if (vendor.vendor_cost && vendor.cost_converted) {
                                return sum + (p.amount * (vendor.cost_converted / vendor.vendor_cost))
                              }
                              return sum + (p.amount || 0)
                            }, 0) || 0

                          const totalRemainingVendorCurrency = vendor.payments
                            ?.filter(p => !p.refundable && !p.paid)
                            .reduce((sum, p) => sum + (p.amount || 0), 0) || 0

                          return (
                            <>
                              {(currencyDisplay === 'cad' || currencyDisplay === 'both') && (
                                <div className="font-medium text-red-700 whitespace-nowrap">
                                  {hasRemainingEstimate ? '≈ ' : ''}{formatCurrency(totalRemainingConverted, vendor.cost_converted_currency || 'USD')} USD
                                </div>
                              )}
                              {(currencyDisplay === 'eur' || currencyDisplay === 'both') && vendor.vendor_currency && vendor.vendor_currency !== (vendor.cost_converted_currency || 'USD') && totalRemainingVendorCurrency > 0 && (
                                <div className={`text-xs whitespace-nowrap ${currencyDisplay === 'eur' ? 'font-medium text-red-700' : 'text-gray-500'}`}>
                                  {formatCurrency(totalRemainingVendorCurrency, vendor.vendor_currency)} {vendor.vendor_currency}
                                </div>
                              )}
                            </>
                          )
                        })()}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleEditVendor(vendor)}
                          className="p-1 text-gray-600 hover:text-primary-600 transition-colors"
                          title="Edit vendor"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {deleteConfirm === vendor.id ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleDeleteVendor(vendor.id)}
                              className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(vendor.id)}
                            className="p-1 text-gray-600 hover:text-red-600 transition-colors"
                            title="Delete vendor"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Payment Details Row */}
                  {expandedVendor === vendor.id && (
                    <tr key={`${vendor.id}-expanded`}>
                      <td colSpan={9} className="px-2 py-3 bg-gray-50 border-t border-gray-200">
                        <div className="space-y-2 mx-auto" style={{ maxWidth: '95%' }}>
                          <h4 className="font-semibold text-gray-700 text-xs uppercase tracking-wide mb-2">Payment Schedule</h4>
                          {vendor.payments && vendor.payments.length > 0 ? (
                            <table className="w-full bg-white rounded border border-gray-200">
                              <thead>
                                <tr className="text-xs text-gray-600 border-b border-gray-200 bg-gray-100">
                                  <th className="text-left px-3 py-2 font-bold">Description</th>
                                  <th className="text-left px-3 py-2 font-bold">Due Date</th>
                                  <th className="text-left px-3 py-2 font-bold">Paid Date</th>
                                  <th className="text-left px-3 py-2 font-bold">Payment Type</th>
                                  <th className="text-center px-3 py-2 font-bold">Refundable</th>
                                  <th className="text-left px-3 py-2 font-bold">Status</th>
                                  {(currencyDisplay === 'eur' || currencyDisplay === 'both') && vendor.vendor_currency && vendor.vendor_currency !== (vendor.cost_converted_currency || 'USD') && (
                                    <th className="text-right px-3 py-2 font-bold">Amount ({vendor.vendor_currency})</th>
                                  )}
                                  {(currencyDisplay === 'cad' || currencyDisplay === 'both') && (
                                    <th className="text-right px-3 py-2 font-bold">Amount ({vendor.cost_converted_currency || 'USD'})</th>
                                  )}
                                </tr>
                              </thead>
                              <tbody>
                                {[...vendor.payments].sort((a, b) => {
                                  if (!a.due_date && !b.due_date) return 0
                                  if (!a.due_date) return 1
                                  if (!b.due_date) return -1
                                  return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
                                }).map((payment, index) => (
                                  <tr key={index} className="text-sm border-b border-gray-100 last:border-0">
                                    <td className="px-3 py-2 text-gray-900">{payment.description}</td>
                                    <td className="px-3 py-2 text-gray-600 text-xs">
                                      {payment.due_date ? (() => {
                                        const [year, month, day] = payment.due_date.split('-')
                                        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                                        return date.toLocaleDateString()
                                      })() : '-'}
                                    </td>
                                    <td className="px-3 py-2 text-gray-600 text-xs">
                                      {payment.paid && payment.paid_date ? new Date(payment.paid_date).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="px-3 py-2 text-gray-600 text-xs">
                                      {payment.payment_type === 'cash' ? 'Cash' : 'Bank Transfer'}
                                    </td>
                                    <td className="px-3 py-2 text-center text-gray-600 text-xs">
                                      {payment.refundable ? 'Yes' : '-'}
                                    </td>
                                    <td className="px-3 py-2">
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold ${
                                        payment.paid
                                          ? 'bg-emerald-50 text-emerald-700'
                                          : 'bg-amber-50 text-amber-700'
                                      }`}>
                                        {payment.paid ? (
                                          <>
                                            <CheckCircle className="w-3 h-3" />
                                            Paid
                                          </>
                                        ) : (
                                          <>
                                            <AlertCircle className="w-3 h-3" />
                                            Pending
                                          </>
                                        )}
                                      </span>
                                    </td>
                                    {(currencyDisplay === 'eur' || currencyDisplay === 'both') && vendor.vendor_currency && vendor.vendor_currency !== (vendor.cost_converted_currency || 'USD') && (
                                      <td className="px-3 py-2 text-right font-medium text-gray-900">
                                        {formatCurrency(payment.amount, vendor.vendor_currency)}
                                      </td>
                                    )}
                                    {(currencyDisplay === 'cad' || currencyDisplay === 'both') && (
                                      <td className="px-3 py-2 text-right font-medium text-gray-900">
                                        {payment.amount_converted
                                          ? formatCurrency(payment.amount_converted, vendor.cost_converted_currency || 'USD')
                                          : vendor.vendor_cost && vendor.cost_converted
                                            ? `${!payment.paid ? '≈ ' : ''}${formatCurrency(payment.amount * (vendor.cost_converted / vendor.vendor_cost), vendor.cost_converted_currency || 'USD')}`
                                            : formatCurrency(payment.amount, vendor.cost_converted_currency || 'USD')
                                        }
                                      </td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="bg-gray-100 border-t-2 border-gray-300">
                                  <td colSpan={6} className="px-3 py-3 text-sm font-bold text-gray-900">
                                    Total
                                  </td>
                                  {(currencyDisplay === 'eur' || currencyDisplay === 'both') && vendor.vendor_currency && vendor.vendor_currency !== (vendor.cost_converted_currency || 'USD') && (
                                    <td className="px-3 py-3 text-right text-sm font-bold text-gray-900">
                                      {formatCurrency(
                                        vendor.payments.filter(p => !p.refundable).reduce((sum, p) => sum + (p.amount || 0), 0),
                                        vendor.vendor_currency
                                      )}
                                    </td>
                                  )}
                                  {(currencyDisplay === 'cad' || currencyDisplay === 'both') && (
                                    <td className="px-3 py-3 text-right text-sm font-bold text-gray-900">
                                    {(() => {
                                      const hasEstimatedConversion = vendor.payments
                                        .filter(p => !p.refundable)
                                        .some(p => !p.amount_converted && p.amount > 0)
                                      const total = vendor.payments.filter(p => !p.refundable).reduce((sum, p) => {
                                        if (p.amount_converted) {
                                          return sum + p.amount_converted
                                        } else if (vendor.vendor_cost && vendor.cost_converted) {
                                          return sum + (p.amount * (vendor.cost_converted / vendor.vendor_cost))
                                        }
                                        return sum + (p.amount || 0)
                                      }, 0)
                                      return `${hasEstimatedConversion ? '≈ ' : ''}${formatCurrency(total, vendor.cost_converted_currency || 'USD')}`
                                    })()}
                                    </td>
                                  )}
                                </tr>
                              </tfoot>
                            </table>
                          ) : (
                            <p className="text-sm text-gray-500 italic">No payments scheduled</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vendor Form Modal */}
      {showForm && (
        <VendorForm
          vendor={editingVendor}
          onClose={handleFormClose}
          onSave={handleFormSave}
        />
      )}

      {/* AI Import Modal */}
      {showBulkImport && (
        <CoupleAskAIVendorModal
          onClose={() => setShowBulkImport(false)}
          onImport={handleBulkImport}
        />
      )}

      {/* Complete Details Modal */}
      {showCompleteDetails && vendorsNeedingDetails.length > 0 && (
        <CompleteDetailsModal
          vendors={vendorsNeedingDetails}
          onClose={() => setShowCompleteDetails(false)}
          onComplete={handleCompleteDetails}
        />
      )}

      {/* Payment Reminder Settings Modal */}
      <PaymentReminderSettingsModal
        isOpen={showReminderSettings}
        onClose={() => setShowReminderSettings(false)}
        onSave={() => {
          // Settings saved successfully - could refetch reminders if needed
        }}
      />
    </>
  )
}
