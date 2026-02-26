'use client'

import { useState, useEffect } from 'react'
import { Plus, Users, Package, Clock, Search, AlertCircle, Bot } from 'lucide-react'
import { VendorLibrary, TagWithCount } from '@/types/planner'
import { VENDOR_TYPES } from '@/lib/vendorTypes'
import VendorLibraryCard from './VendorLibraryCard'
import PlannerAskAIVendorModal from './PlannerAskAIVendorModal'
import AddVendorModal from './AddVendorModal'
import Notification from './Notification'
import SearchableMultiSelect from '../SearchableMultiSelect'
import { useTheme } from '@/contexts/ThemeContext'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { StatCard, StatCardSkeleton } from '@/components/ui/StatCard'

export default function VendorLibraryPage() {
  const { theme: currentTheme } = useTheme()
  const theme = useThemeStyles()
  const [vendors, setVendors] = useState<VendorLibrary[]>([])
  const [expandedVendorId, setExpandedVendorId] = useState<string | null>(null)

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('vendor')
    if (id) setExpandedVendorId(id)
  }, [])
  const [filteredVendors, setFilteredVendors] = useState<VendorLibrary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showManualAdd, setShowManualAdd] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string[]>([])
  const [selectedTag, setSelectedTag] = useState<string[]>([])

  // Preserve scroll position when filters change
  const preserveScrollPosition = () => {
    const scrollY = window.scrollY
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY)
    })
  }

  // Tags
  const [allTags, setAllTags] = useState<TagWithCount[]>([])

  // Notification
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info'
    title: string
    message?: string
  } | null>(null)

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    byType: {} as Record<string, number>,
    recentlyAdded: 0
  })

  useEffect(() => {
    // Ensure planner auth token is set (since password gate was removed)
    if (typeof window !== 'undefined' && !sessionStorage.getItem('planner_auth')) {
      sessionStorage.setItem('planner_auth', 'planner')
    }
    fetchVendors()
    fetchTags()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [vendors, searchQuery, selectedType, selectedTag])

  const fetchVendors = async () => {
    setError(null)
    setLoading(true)
    try {
      const token = sessionStorage.getItem('planner_auth')
      if (!token) return

      const response = await fetch('/api/planners/vendor-library', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        setVendors(data.data)
        calculateStats(data.data)
      } else {
        setError('Could not load your vendor library. Please try refreshing the page.')
      }
    } catch (error) {
      console.error('Failed to fetch vendors:', error)
      setError('Could not load your vendor library. Please try refreshing the page.')
    } finally {
      setLoading(false)
    }
  }

  const fetchTags = async () => {
    try {
      const token = sessionStorage.getItem('planner_auth')
      if (!token) return

      const response = await fetch('/api/planners/vendor-library/tags', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        setAllTags(data.data.tags)
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error)
    }
  }

  const calculateStats = (vendorList: VendorLibrary[]) => {
    const byType: Record<string, number> = {}
    VENDOR_TYPES.forEach(type => {
      byType[type] = 0
    })

    vendorList.forEach(vendor => {
      if (byType[vendor.vendor_type] !== undefined) {
        byType[vendor.vendor_type]++
      }
    })

    // Count vendors added in last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentlyAdded = vendorList.filter(v =>
      new Date(v.created_at) > sevenDaysAgo
    ).length

    setStats({
      total: vendorList.length,
      byType,
      recentlyAdded
    })
  }

  const applyFilters = () => {
    let filtered = [...vendors]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(v =>
        v.vendor_name.toLowerCase().includes(query) ||
        v.contact_name?.toLowerCase().includes(query) ||
        v.email?.toLowerCase().includes(query) ||
        v.location?.toLowerCase().includes(query)
      )
    }

    // Type filter
    if (selectedType.length > 0) {
      filtered = filtered.filter(v => selectedType.includes(v.vendor_type))
    }

    // Tag filter
    if (selectedTag.length > 0) {
      filtered = filtered.filter(v =>
        v.tags && v.tags.some(tag => selectedTag.includes(tag))
      )
    }

    setFilteredVendors(filtered)
  }

  const handleVendorUpdated = () => {
    fetchVendors()
    fetchTags()
  }

  const handleVendorDeleted = (vendorId: string) => {
    setVendors(vendors.filter(v => v.id !== vendorId))
  }

  // Filter handlers with scroll preservation
  const handleTypeChange = (values: string[]) => {
    preserveScrollPosition()
    setSelectedType(values)
  }

  const handleTagChange = (values: string[]) => {
    preserveScrollPosition()
    setSelectedTag(values)
  }

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
        ) : (
          <>
            <StatCard
              icon={<Package className={`w-4 h-4 ${theme.textSecondary}`} />}
              label="Total Vendors"
              value={stats.total}
              theme={theme}
            />

            <StatCard
              icon={<Clock className={`w-4 h-4 ${theme.success.text}`} />}
              iconBg={theme.success.bg}
              label="Recently Added"
              value={stats.recentlyAdded}
              subtitle="Last 7 days"
              theme={theme}
            />

            <StatCard
              icon={<Users className={`w-4 h-4 ${theme.textSecondary}`} />}
              label="Top Type"
              value={(() => {
                const top = Object.entries(stats.byType)
                  .filter(([_, count]) => count > 0)
                  .sort((a, b) => b[1] - a[1])[0]
                return top ? top[0] : '—'
              })()}
              subtitle={(() => {
                const top = Object.entries(stats.byType)
                  .filter(([_, count]) => count > 0)
                  .sort((a, b) => b[1] - a[1])[0]
                return top ? String(top[1]) : undefined
              })()}
              theme={theme}
            />

            <StatCard
              icon={<Users className={`w-4 h-4 ${theme.success.text}`} />}
              iconBg={theme.success.bg}
              label="Total Types"
              value={Object.values(stats.byType).filter(count => count > 0).length}
              theme={theme}
            />
          </>
        )}
      </div>

      {/* Controls */}
      <div className={`${theme.cardBackground} rounded-2xl ${theme.border} ${theme.borderWidth} p-6 mb-6`}>
        {/* Mobile: Stacked Layout */}
        <div className="lg:hidden space-y-3">
          {/* Search */}
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search vendors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-10 py-2 ${theme.border} ${theme.borderWidth} rounded-xl text-sm font-medium focus:outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all`}
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
            {searchQuery && (
              <div className="text-xs text-gray-600 mt-1">
                Showing {filteredVendors.length} of {vendors.length} vendors
              </div>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex flex-col gap-2">
            {/* Type Filter */}
            <SearchableMultiSelect
              options={VENDOR_TYPES.map(type => ({
                value: type,
                label: type,
                count: stats.byType[type] || 0
              })).filter(option => option.count > 0)}
              selectedValues={selectedType}
              onChange={handleTypeChange}
              placeholder="Filter by type..."
              allLabel="All Types"
              className="w-full"
              inlineOnMobile={true}
            />

            {/* Tag Filter */}
            {allTags.length > 0 && (
              <SearchableMultiSelect
                options={allTags.map(({ tag, count }) => ({
                  value: tag,
                  label: tag,
                  count
                }))}
                selectedValues={selectedTag}
                onChange={handleTagChange}
                placeholder="Filter by tags..."
                allLabel="All Tags"
                className="w-full"
                inlineOnMobile={true}
              />
            )}
          </div>

          {/* Buttons Row */}
          <div className="flex gap-2">
            {/* Add Manually Button */}
            <button
              onClick={() => setShowManualAdd(true)}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 ${theme.secondaryButton} rounded-xl text-sm font-medium ${theme.secondaryButtonHover} transition-colors flex-1 min-w-0`}
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              <span>Add</span>
            </button>

            {/* Ask AI Button */}
            <button
              id="tour-ask-ksmt-vendors-mobile"
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-ksmt-crimson hover:bg-[#7a2520] text-white rounded-xl text-sm font-medium transition-colors flex-1 min-w-0"
            >
              <Bot className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">Ask AI</span>
            </button>
          </div>
        </div>

        {/* Desktop: Original Horizontal Layout */}
        <div className="hidden lg:flex flex-wrap gap-2 lg:gap-4 items-center justify-between">
          <div className="flex gap-2 flex-wrap flex-1">
            {/* Search */}
            <div className="min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search vendors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-10 py-2 ${theme.border} ${theme.borderWidth} rounded-xl text-sm font-medium focus:outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all`}
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
              {searchQuery && (
                <div className="text-xs text-gray-600 mt-1">
                  Showing {filteredVendors.length} of {vendors.length} vendors
                </div>
              )}
            </div>

            {/* Type Filter */}
            <SearchableMultiSelect
              options={VENDOR_TYPES.map(type => ({
                value: type,
                label: type,
                count: stats.byType[type] || 0
              })).filter(option => option.count > 0)}
              selectedValues={selectedType}
              onChange={handleTypeChange}
              placeholder="Filter by type..."
              allLabel="All Types"
              className="min-w-[160px]"
            />

            {/* Tag Filter */}
            {allTags.length > 0 && (
              <SearchableMultiSelect
                options={allTags.map(({ tag, count }) => ({
                  value: tag,
                  label: tag,
                  count
                }))}
                selectedValues={selectedTag}
                onChange={handleTagChange}
                placeholder="Filter by tags..."
                allLabel="All Tags"
                className="min-w-[160px]"
              />
            )}
          </div>

          {/* Add Manually Button */}
          <button
            onClick={() => setShowManualAdd(true)}
            className={`flex items-center gap-2 px-6 py-2.5 ${theme.secondaryButton} rounded-xl text-sm font-medium ${theme.secondaryButtonHover} transition-colors`}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Manually</span>
          </button>

          {/* Ask AI Button */}
          <button
            id="tour-ask-ksmt-vendors"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-ksmt-crimson hover:bg-[#7a2520] text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Bot className="w-5 h-5" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        </div>
      </div>

      {/* Vendor Grid */}
      {error && !loading ? (
        <div className={`${theme.error.bg} border ${theme.border} rounded-2xl p-8`}>
          <div className="flex items-start gap-4">
            <AlertCircle className={`${theme.error.text} flex-shrink-0`} size={24} />
            <div>
              <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-1`}>Unable to Load</h3>
              <p className={`text-sm ${theme.error.text}`}>{error}</p>
            </div>
          </div>
        </div>
      ) : loading ? (
        <div className={`flex items-center justify-center py-12 ${theme.textMuted}`}>
          Loading vendors...
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className={`${theme.cardBackground} rounded-xl ${theme.border} ${theme.borderWidth} p-12 text-center`}>
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">
            {vendors.length === 0
              ? "No vendors in your library yet"
              : "No vendors match your filters"}
          </p>
        </div>
      ) : (
        <div className={`${theme.cardBackground} rounded-2xl ${theme.border} ${theme.borderWidth} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="px-2 py-3"></th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold ${theme.textSecondary} uppercase`}>Type</th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold ${theme.textSecondary} uppercase`}>Vendor Name</th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold ${theme.textSecondary} uppercase`}>Contact</th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold ${theme.textSecondary} uppercase`}>Location</th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold ${theme.textSecondary} uppercase`}>Tags</th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold ${theme.textSecondary} uppercase`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredVendors.map(vendor => (
                  <VendorLibraryCard
                    key={vendor.id}
                    vendor={vendor}
                    defaultExpanded={vendor.id === expandedVendorId}
                    onUpdate={handleVendorUpdated}
                    onDelete={handleVendorDeleted}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Add Modal */}
      {showManualAdd && (
        <AddVendorModal
          isOpen={showManualAdd}
          onClose={() => setShowManualAdd(false)}
          onSuccess={() => {
            setShowManualAdd(false)
            fetchVendors()
          }}
        />
      )}

      {/* Ask AI Modal */}
      {showAddModal && (
        <PlannerAskAIVendorModal
          existingVendors={vendors}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            fetchVendors()
          }}
        />
      )}

      {/* Notification */}
      {notification && (
        <Notification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </>
  )
}
