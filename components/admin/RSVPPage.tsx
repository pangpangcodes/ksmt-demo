'use client'

import { useState, useEffect, Fragment } from 'react'
import { Users, CheckCircle, XCircle, Download, Eye, EyeOff, Copy, Check, ChevronDown, ChevronRight, AlertCircle, Search } from 'lucide-react'
import { formatDate, maskEmail, maskPhone, exportToCSV } from '@/lib/format'
import { supabase } from '@/lib/supabase'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { StatCard, StatCardSkeleton } from '@/components/ui/StatCard'

interface Guest {
  name: string
  order: number
}

interface RSVP {
  id: string
  name: string
  email: string
  phone: string
  attending: boolean
  created_at: string
  guests: Guest[]
}

interface Stats {
  total: number
  attending: number
  notAttending: number
  totalGuests: number
}

export default function RSVPPage() {
  const theme = useThemeStyles()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rsvps, setRsvps] = useState<RSVP[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [filter, setFilter] = useState<'all' | 'true' | 'false'>('all')
  const [showContactInfo, setShowContactInfo] = useState(true)
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null)
  const [expandedRsvp, setExpandedRsvp] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchRSVPs('all')
  }, [])

  const fetchRSVPs = async (attendingFilter: 'all' | 'true' | 'false') => {
    setError(null)
    setLoading(true)
    try {
      const { data: allRsvps, error: supabaseError } = await supabase.from('rsvps').select('*')

      if (supabaseError || !allRsvps) {
        setError('Could not load RSVPs. Please try refreshing the page.')
        return
      }

      // Filter based on attending status
      let filteredRsvps = allRsvps || []
      if (attendingFilter === 'true') {
        filteredRsvps = filteredRsvps.filter((r: RSVP) => r.attending)
      } else if (attendingFilter === 'false') {
        filteredRsvps = filteredRsvps.filter((r: RSVP) => !r.attending)
      }

      // Calculate stats
      const stats = {
        total: allRsvps?.length || 0,
        attending: allRsvps?.filter((r: RSVP) => r.attending).length || 0,
        notAttending: allRsvps?.filter((r: RSVP) => !r.attending).length || 0,
        totalGuests: allRsvps?.reduce((sum: number, r: RSVP) => sum + (r.guests?.length || 1), 0) || 0
      }

      // Format RSVPs to match expected structure
      const formattedRsvps = filteredRsvps.map((rsvp: RSVP) => ({
        ...rsvp,
        guests: rsvp.guests || [] // Use actual guest data from mock
      }))

      setRsvps(formattedRsvps)
      setStats(stats)
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Could not load RSVPs. Please try refreshing the page.')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (newFilter: 'all' | 'true' | 'false') => {
    setFilter(newFilter)
    fetchRSVPs(newFilter)
  }

  const handleExportCSV = async () => {
    try {
      // Use the exportToCSV function from lib/format
      const csvContent = exportToCSV(rsvps)
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `rsvps-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
    } catch (err) {
      console.error('Export error:', err)
    }
  }

  const handleCopyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email)
      setCopiedEmail(email)
      setTimeout(() => setCopiedEmail(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Client-side search filtering
  const displayedRsvps = searchQuery.trim()
    ? rsvps.filter(r => {
        const q = searchQuery.trim().toLowerCase()
        return (
          r.name?.toLowerCase().includes(q) ||
          r.email?.toLowerCase().includes(q) ||
          r.guests?.some(g => g.name?.toLowerCase().includes(q))
        )
      })
    : rsvps

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
              label="Total RSVPs"
              value={stats.total}
              theme={theme}
            />

            <StatCard
              icon={<CheckCircle className={`w-4 h-4 ${theme.success.text}`} />}
              iconBg={theme.success.bg}
              label="Attending"
              value={stats.attending}
              theme={theme}
            />

            <StatCard
              icon={<Users className={`w-4 h-4 ${theme.success.text}`} />}
              iconBg={theme.success.bg}
              label="Total Guests"
              value={stats.totalGuests}
              theme={theme}
            />

            <StatCard
              icon={<XCircle className="w-4 h-4 text-gray-400" />}
              label="Not Attending"
              value={stats.notAttending}
              theme={theme}
            />
          </>
        )}
      </div>

      {/* Controls */}
      <div className={`${theme.cardBackground} rounded-xl shadow p-3 md:p-4 mb-4 md:mb-6`}>
        <div className="flex flex-wrap gap-2 md:gap-4 items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-3 md:px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === 'all'
                  ? `${theme.primaryButton} ${theme.primaryButtonHover} ${theme.textOnPrimary}`
                  : `${theme.secondaryButton} ${theme.secondaryButtonHover}`
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleFilterChange('true')}
              className={`px-3 md:px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === 'true'
                  ? `${theme.primaryButton} ${theme.primaryButtonHover} ${theme.textOnPrimary}`
                  : `${theme.secondaryButton} ${theme.secondaryButtonHover}`
              }`}
            >
              Attending
            </button>
            <button
              onClick={() => handleFilterChange('false')}
              className={`px-3 md:px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === 'false'
                  ? `${theme.primaryButton} ${theme.primaryButtonHover} ${theme.textOnPrimary}`
                  : `${theme.secondaryButton} ${theme.secondaryButtonHover}`
              }`}
            >
              Not Attending
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-9 py-2 border rounded-xl text-sm font-medium focus:outline-none focus:ring-1 transition-all ${theme.border} ${theme.textPrimary}`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowContactInfo(!showContactInfo)}
              className={`flex items-center gap-2 px-3 md:px-4 py-2 ${theme.secondaryButton} rounded-xl text-sm font-medium ${theme.secondaryButtonHover} transition-colors`}
            >
              {showContactInfo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span className="hidden sm:inline">{showContactInfo ? 'Hide' : 'Show'} Contact Info</span>
            </button>
            <button
              onClick={handleExportCSV}
              className={`flex items-center gap-2 px-3 md:px-4 py-2 ${theme.secondaryButton} rounded-xl text-sm font-medium ${theme.secondaryButtonHover} transition-colors`}
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* RSVPs Table */}
      <div className={`${theme.cardBackground} rounded-2xl ${theme.border} ${theme.borderWidth} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                {/* Expand icon - visible on all screen sizes */}
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-12"></th>
                <th className={`px-4 py-3 text-left text-xs font-semibold ${theme.textSecondary} uppercase`}>Name</th>
                {/* Desktop columns */}
                <th className={`hidden md:table-cell px-4 py-3 text-left text-xs font-semibold ${theme.textSecondary} uppercase`}>Email</th>
                <th className={`hidden md:table-cell px-4 py-3 text-left text-xs font-semibold ${theme.textSecondary} uppercase`}>Phone</th>
                <th className={`px-4 py-3 text-left text-xs font-semibold ${theme.textSecondary} uppercase`}>Status</th>
                <th className={`px-4 py-3 text-left text-xs font-semibold ${theme.textSecondary} uppercase`}>Plus Ones</th>
                <th className={`hidden md:table-cell px-4 py-3 text-left text-xs font-semibold ${theme.textSecondary} uppercase`}>Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8">
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
              ) : displayedRsvps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    {searchQuery ? `No results for "${searchQuery}"` : 'No RSVPs found'}
                  </td>
                </tr>
              ) : (
                displayedRsvps.map((rsvp) => (
                  <Fragment key={rsvp.id}>
                    <tr
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setExpandedRsvp(expandedRsvp === rsvp.id ? null : rsvp.id)}
                    >
                      {/* Expand icon - visible on all screen sizes */}
                      <td className="px-2 py-3 text-sm text-gray-500">
                        {expandedRsvp === rsvp.id ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </td>

                      <td className="px-2 py-3 text-sm font-medium text-gray-900">
                        {rsvp.name}
                      </td>

                      {/* Desktop Email column */}
                      <td className="hidden md:table-cell px-2 py-3 text-sm text-gray-600">
                        {showContactInfo ? (
                          <div className="flex items-center gap-2 group">
                            <span>{rsvp.email}</span>
                            <button
                              onClick={() => handleCopyEmail(rsvp.email)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                              title="Copy email"
                            >
                              {copiedEmail === rsvp.email ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4 text-gray-500" />
                              )}
                            </button>
                          </div>
                        ) : (
                          maskEmail(rsvp.email)
                        )}
                      </td>

                      {/* Desktop Phone column */}
                      <td className="hidden md:table-cell px-2 py-3 text-sm text-gray-600">
                        {showContactInfo ? rsvp.phone : maskPhone(rsvp.phone)}
                      </td>

                      <td className="px-2 py-3">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold ${
                          rsvp.attending
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-stone-100 text-stone-600'
                        }`}>
                          {rsvp.attending ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Attending
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              Not Attending
                            </>
                          )}
                        </span>
                      </td>

                      <td className="px-2 py-3 text-sm text-gray-600">
                        {rsvp.guests.length > 0 ? (
                          <>
                            {/* Mobile: just number */}
                            <span className="md:hidden font-medium text-bridezilla-pink">{rsvp.guests.length}</span>
                            {/* Desktop: full list */}
                            <ul className="hidden md:block space-y-1">
                              {rsvp.guests.map((guest, idx) => (
                                <li key={idx}>{guest.name}</li>
                              ))}
                            </ul>
                          </>
                        ) : (
                          <span className="text-gray-400">None</span>
                        )}
                      </td>

                      {/* Desktop Submitted column */}
                      <td className="hidden md:table-cell px-2 py-3 text-sm text-gray-600">
                        {formatDate(rsvp.created_at)}
                      </td>
                    </tr>

                    {/* Expanded Details Row */}
                    {expandedRsvp === rsvp.id && (
                      <tr key={`${rsvp.id}-expanded`}>
                        <td colSpan={7} className="px-4 py-4 bg-gray-50 border-t border-gray-100">
                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Email</p>
                              {showContactInfo ? (
                                <div className="flex items-center gap-2 group">
                                  <span className="text-sm text-gray-900">{rsvp.email}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleCopyEmail(rsvp.email)
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                                    title="Copy email"
                                  >
                                    {copiedEmail === rsvp.email ? (
                                      <Check className="w-4 h-4 text-green-600" />
                                    ) : (
                                      <Copy className="w-4 h-4 text-gray-500" />
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-900">{maskEmail(rsvp.email)}</span>
                              )}
                            </div>

                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Phone</p>
                              <span className="text-sm text-gray-900">
                                {showContactInfo ? rsvp.phone : maskPhone(rsvp.phone)}
                              </span>
                            </div>

                            {rsvp.guests.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Guest Names</p>
                                <ul className="space-y-1">
                                  {rsvp.guests.map((guest, idx) => (
                                    <li key={idx} className="text-sm text-gray-900">• {guest.name}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Submitted</p>
                              <span className="text-sm text-gray-900">{formatDate(rsvp.created_at)}</span>
                            </div>
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
    </>
  )
}
