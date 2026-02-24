'use client'

import { useState, useEffect } from 'react'
import { Users, DollarSign, AlertCircle, Calendar, BarChart3, CheckCircle, Clock } from 'lucide-react'
import { formatCurrency, calculateVendorStats } from '@/lib/vendorUtils'
import { supabase } from '@/lib/supabase'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { StatCard } from '@/components/ui/StatCard'

interface DashboardData {
  rsvpStats: {
    total: number
    attending: number
    notAttending: number
    totalGuests: number
  }
  vendorStats: {
    totalVendors: number
    totalCost: number
    totalPaid: number
    totalOutstanding: number
  }
  paymentReminders: Array<{
    vendor_name: string
    vendor_type: string
    payment_description: string
    amount: number
    currency: string
    due_date: string
    reminder_type: 'overdue' | 'due_today' | '7_days'
    days_until_due: number
  }>
}

export default function DashboardPage() {
  const theme = useThemeStyles()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<DashboardData | null>(null)
  const [countedDays, setCountedDays] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const [weddingDateStr, setWeddingDateStr] = useState<string>('')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Animate countdown number
  useEffect(() => {
    if (!hasAnimated && data && !loading && weddingDateStr) {
      const [y, m, d] = weddingDateStr.split('-').map(Number)
      const weddingDate = new Date(y, m - 1, d)
      const today = new Date()
      const daysUntilWedding = Math.ceil((weddingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      if (daysUntilWedding > 0) {
        setHasAnimated(true)
        const duration = 1500 // 1.5 seconds
        const steps = 60
        const increment = daysUntilWedding / steps
        const stepDuration = duration / steps

        let currentStep = 0
        const timer = setInterval(() => {
          currentStep++
          if (currentStep >= steps) {
            setCountedDays(daysUntilWedding)
            clearInterval(timer)
          } else {
            setCountedDays(Math.floor(increment * currentStep))
          }
        }, stepDuration)

        return () => clearInterval(timer)
      }
    }
  }, [data, loading, hasAnimated, weddingDateStr])

  const fetchDashboardData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch data directly from demo supabase
      const [
        { data: rsvps },
        { data: vendors },
        { data: weddingSettings },
      ] = await Promise.all([
        supabase.from('rsvps').select('*'),
        supabase.from('vendors').select('*'),
        supabase.from('wedding_settings').select('wedding_date').single(),
      ])

      setWeddingDateStr(weddingSettings?.wedding_date ?? '2026-09-20')

      // Calculate RSVP stats
      const rsvpStats = {
        total: rsvps?.length || 0,
        attending: rsvps?.filter((r: any) => r.attending).length || 0,
        notAttending: rsvps?.filter((r: any) => !r.attending).length || 0,
        totalGuests: rsvps?.reduce((sum: number, r: any) => sum + (r.number_of_guests || 1), 0) || 0
      }

      // Calculate vendor stats
      const vendorStats = calculateVendorStats(vendors || [])

      // Calculate payment reminders (upcoming payments)
      const paymentReminders: any[] = []
      vendors?.forEach((vendor: any) => {
        vendor.payments?.forEach((payment: any) => {
          if (!payment.paid && payment.due_date) {
            // Parse date components explicitly to avoid timezone conversion
            const [year, month, day] = payment.due_date.split('-')
            const dueDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
            dueDate.setHours(0, 0, 0, 0) // Normalize to midnight
            const today = new Date()
            today.setHours(0, 0, 0, 0) // Normalize to midnight
            const daysUntilDue = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

            let reminderType: 'overdue' | 'due_today' | '7_days' = '7_days'
            if (daysUntilDue < 0) reminderType = 'overdue'
            else if (daysUntilDue === 0) reminderType = 'due_today'

            // Only show payments due in the next 7 days (exclude overdue)
            if (daysUntilDue >= 0 && daysUntilDue <= 7) {
              paymentReminders.push({
                vendor_name: vendor.vendor_name,
                vendor_type: vendor.vendor_type,
                payment_description: payment.description,
                amount: payment.amount,
                currency: payment.amount_currency,
                due_date: payment.due_date,
                reminder_type: reminderType,
                days_until_due: daysUntilDue
              })
            }
          }
        })
      })

      setData({
        rsvpStats,
        vendorStats,
        paymentReminders: paymentReminders.sort((a, b) => a.days_until_due - b.days_until_due)
      })
    } catch (err) {
      setError('Unable to load dashboard. Please refresh.')
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className={theme.textSecondary}>Loading dashboard...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className={`${theme.error.bg} border ${theme.border} rounded-2xl p-8`}>
        <div className="flex items-start gap-4">
          <AlertCircle className={`${theme.error.text} flex-shrink-0`} size={24} />
          <div>
            <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-1`}>Unable to Load</h3>
            <p className={`text-sm ${theme.error.text}`}>{error || 'Failed to load dashboard'}</p>
          </div>
        </div>
      </div>
    )
  }

  // Calculate metrics
  const budgetSpentPercent = data.vendorStats.totalCost > 0
    ? Math.round((data.vendorStats.totalPaid / data.vendorStats.totalCost) * 100)
    : 0

  // Payment alerts
  const overduePayments = data.paymentReminders.filter(r => r.reminder_type === 'overdue')
  const dueTodayPayments = data.paymentReminders.filter(r => r.reminder_type === 'due_today')
  const upcomingPayments = data.paymentReminders.filter(r =>
    r.reminder_type === '7_days' || (r.days_until_due > 0 && r.days_until_due <= 7)
  )

  // Action items count
  const actionItemsCount = overduePayments.length + upcomingPayments.length

  // Calculate days until wedding from settings
  const [wy, wm, wd] = (weddingDateStr || '2026-09-20').split('-').map(Number)
  const weddingDate = new Date(wy, wm - 1, wd)
  const today = new Date()
  const daysUntilWedding = Math.ceil((weddingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const weddingDateFormatted = weddingDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  // Calculate pending RSVPs
  const pendingRsvps = data.rsvpStats.total - data.rsvpStats.attending - data.rsvpStats.notAttending

  return (
    <>
      {/* Welcome Banner */}
      <div className={`${theme.cardBackground} rounded-2xl shadow-md p-4 md:p-6 mb-4 md:mb-6 border ${theme.border} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="animate-in fade-in slide-in-from-left-4 duration-700">
            <h2 className={`font-display text-2xl md:text-3xl ${theme.textPrimary} mb-1`}>
              Welcome back, Bella & Edward
            </h2>
            <p className={theme.textSecondary}>
              Only <span className={`font-semibold ${theme.textPrimary}`}>{daysUntilWedding}</span> days until your wedding on <strong>{weddingDateFormatted}</strong>!
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3 animate-in fade-in zoom-in-50 duration-700 delay-300">
            <div className={`text-center px-6 py-3 bg-stone-50 rounded-xl border ${theme.border} shadow-md hover:shadow-lg transition-all duration-300`}>
              <div className={`text-3xl font-semibold ${theme.textPrimary} tabular-nums`}>
                {countedDays || daysUntilWedding}
              </div>
              <div className={`text-xs font-medium ${theme.textMuted} uppercase tracking-widest mt-1`}>Days</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - 4 Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
        <StatCard
          icon={<DollarSign className={`w-4 h-4 ${theme.textSecondary}`} />}
          label="Budget Spent"
          value={`${budgetSpentPercent}%`}
          subtitle={`${formatCurrency(data.vendorStats.totalPaid)} / ${formatCurrency(data.vendorStats.totalCost)} USD`}
          theme={theme}
        />

        <StatCard
          icon={<Users className={`w-4 h-4 ${theme.success.text}`} />}
          iconBg={theme.success.bg}
          label="Confirmed Guests"
          value={data.rsvpStats.totalGuests}
          subtitle={`${data.rsvpStats.attending} attending \u2022 ${data.rsvpStats.notAttending} declined`}
          theme={theme}
        />

        <StatCard
          icon={<BarChart3 className={`w-4 h-4 ${theme.textSecondary}`} />}
          label="Vendors Booked"
          value={data.vendorStats.totalVendors}
          subtitle={`Total: ${formatCurrency(data.vendorStats.totalCost)} USD`}
          theme={theme}
        />

        <StatCard
          icon={<AlertCircle className={`w-4 h-4 ${theme.textSecondary}`} />}
          label="Action Items"
          value={actionItemsCount}
          subtitle={`${overduePayments.length} overdue \u2022 ${upcomingPayments.length} upcoming`}
          theme={theme}
        />
      </div>

      {/* Two Column Layout - Upcoming Payments & Pending Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Upcoming Payments */}
        {data.paymentReminders.length > 0 && (
          <div className={`${theme.cardBackground} rounded-2xl shadow-md p-4 md:p-6 border ${theme.border} transition-colors`}>
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <Calendar className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" style={{ color: theme.primaryColor }} />
              <h3 className={`${theme.typeSectionHeading} ${theme.textPrimary}`}>
                Upcoming Payments
              </h3>
            </div>

            <div className="space-y-2 md:space-y-3">
              {data.paymentReminders.slice(0, 5).map((reminder, i) => {
                const bgColor =
                  reminder.reminder_type === 'overdue' ? 'bg-red-50 border-red-200' :
                  reminder.reminder_type === 'due_today' ? 'bg-orange-50 border-orange-200' :
                  'bg-yellow-50 border-yellow-200'

                const textColor =
                  reminder.reminder_type === 'overdue' ? 'text-red-900' :
                  reminder.reminder_type === 'due_today' ? 'text-orange-900' :
                  'text-yellow-900'

                const badgeColor =
                  reminder.reminder_type === 'overdue' ? 'bg-red-100 text-red-700' :
                  reminder.reminder_type === 'due_today' ? 'bg-orange-100 text-orange-700' :
                  'bg-amber-50 text-amber-700'

                const statusText =
                  reminder.reminder_type === 'overdue' ? `Overdue ${Math.abs(reminder.days_until_due)}d` :
                  reminder.reminder_type === 'due_today' ? 'Due today' :
                  `Due in ${reminder.days_until_due}d`

                return (
                  <div key={i} className={`flex flex-col gap-1.5 sm:gap-0 p-3 rounded-lg border ${bgColor}`}>
                    {/* Row 1: Date badge + Vendor name */}
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="flex-shrink-0">
                        <div className={`text-xs font-semibold px-2 py-1 rounded ${badgeColor}`}>
                          {(() => {
                            const [year, month, day] = reminder.due_date.split('-')
                            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          })()}
                        </div>
                      </div>
                      <p className={`text-sm font-medium ${textColor} truncate min-w-0 flex-1`}>
                        {reminder.vendor_name || reminder.vendor_type}
                      </p>
                      {/* Desktop: amount + status inline */}
                      <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
                        <span className={`text-sm font-semibold ${textColor}`}>
                          {formatCurrency(reminder.amount, reminder.currency)} {reminder.currency}
                        </span>
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${badgeColor}`}>
                          {statusText}
                        </span>
                      </div>
                    </div>
                    {/* Row 2: Payment description */}
                    <p className={`text-xs ${theme.textSecondary} truncate pl-10 sm:pl-11`}>
                      {reminder.payment_description}
                    </p>
                    {/* Row 3 (mobile only): Amount + status */}
                    <div className="flex sm:hidden items-center justify-between pl-10">
                      <span className={`text-sm font-semibold ${textColor}`}>
                        {formatCurrency(reminder.amount, reminder.currency)} {reminder.currency}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${badgeColor}`}>
                        {statusText}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {data.paymentReminders.length > 5 && (
              <a
                href="/couples?view=vendors"
                className="mt-4 inline-flex items-center text-sm font-semibold transition-colors"
                style={{ color: theme.primaryColor }}
              >
                View All Payments →
              </a>
            )}
          </div>
        )}

        {/* Pending Tasks */}
        <div className={`${theme.cardBackground} rounded-2xl shadow-md p-4 md:p-6 border ${theme.border} transition-colors`}>
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <CheckCircle className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" style={{ color: theme.primaryColor }} />
            <h3 className={`${theme.typeSectionHeading} ${theme.textPrimary}`}>
              Pending Tasks
            </h3>
          </div>

          <div className={`text-center py-6 ${theme.textMuted} text-sm`}>
            All caught up! No pending tasks.
          </div>
        </div>
      </div>
    </>
  )
}
