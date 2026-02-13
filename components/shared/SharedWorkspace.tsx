'use client'

import { useState, useEffect, useMemo } from 'react'
import { AlertCircle, Calendar, MapPin, Sparkles, ChevronDown, Menu, Lock, MessageCircle, Heart } from 'lucide-react'
import Image from 'next/image'
import { format } from 'date-fns'
import SharedVendorList from './SharedVendorList'
import AnimatedHearts from '@/components/AnimatedHearts'
import { supabase } from '@/lib/supabase-client'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import type { PlannerCouple, SharedVendor } from '@/types/planner'

interface SharedWorkspaceProps {
  shareLinkId: string
}

export default function SharedWorkspace({ shareLinkId }: SharedWorkspaceProps) {
  const theme = useThemeStyles()
  const [couple, setCouple] = useState<PlannerCouple | null>(null)
  const [vendors, setVendors] = useState<SharedVendor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'vendors' | 'guestlist' | 'budget'>('vendors')
  const [aiInsight, setAiInsight] = useState<string | null>(null)
  const [aiInsightLoading, setAiInsightLoading] = useState(false)

  // Calculate categories and stats (MUST be before conditional returns)
  const categories = useMemo(() => {
    const cats = Array.from(new Set(vendors.map(v => v.vendor_type)))
    return ['All', ...cats.sort()]
  }, [vendors])

  const stats = useMemo(() => {
    const uniqueCategories = new Set(vendors.map(v => v.vendor_type))

    // Count total vendors with 'booked' status (Booked & Confirmed)
    const bookedCount = vendors.filter(v => v.couple_status === 'booked').length

    // Count categories that have at least one booked vendor
    const categoriesWithBooking = new Set(
      vendors.filter(v => v.couple_status === 'booked').map(v => v.vendor_type)
    )
    const toHireCount = uniqueCategories.size - categoriesWithBooking.size

    return {
      totalCategories: uniqueCategories.size,
      bookedCount,
      toHireCount
    }
  }, [vendors])

  const filteredVendors = useMemo(() => {
    if (activeCategory === 'All') return vendors
    return vendors.filter(v => v.vendor_type === activeCategory)
  }, [vendors, activeCategory])

  useEffect(() => {
    fetchWorkspaceData()
  }, [shareLinkId])

  const fetchWorkspaceData = async () => {
    try {
      setLoading(true)

      // Fetch couple by share link ID
      const { data: coupleData, error: coupleError } = await supabase
        .from('planner_couples')
        .select('*')
        .eq('share_link_id', shareLinkId)
        .eq('is_active', true)
        .single()

      if (coupleError) {
        // PGRST116 = "not found" from .single() — means the link truly doesn't exist
        if (coupleError.code === 'PGRST116') {
          setError('This link is invalid or has expired.')
        } else {
          setError('Could not load this page. Please try refreshing.')
        }
        return
      }
      if (!coupleData) {
        setError('This link is invalid or has expired.')
        return
      }

      setCouple(coupleData)
      document.title = `${coupleData.couple_names} | Bridezilla Shared Workspace`

      // Fetch vendors for this couple with library vendor details
      const { data: vendorsData, error: vendorsError } = await supabase
        .from('shared_vendors')
        .select('*, vendor_library:planner_vendor_library!vendor_library_id(*)')
        .eq('planner_couple_id', coupleData.id)
        .order('vendor_type', { ascending: true })
        .order('vendor_name', { ascending: true })

      if (!vendorsError) {
        const vList = vendorsData || []
        setVendors(vList)
        fetchInsight(shareLinkId, vList)
      }
    } catch (err) {
      console.error('Failed to fetch workspace:', err)
      setError('Could not load this page. Please try refreshing.')
    } finally {
      setLoading(false)
    }
  }

  const fetchInsight = async (linkId: string, vendorList: SharedVendor[]) => {
    const cacheKey = `bridezilla-couple-insight-${linkId}`
    const hash = vendorList
      .map(v => `${v.id}:${v.vendor_type}:${v.vendor_name}:${v.couple_status || ''}`)
      .sort()
      .join('|')

    // Check cache (production only)
    const isDev = process.env.NODE_ENV === 'development'
    if (!isDev) {
      try {
        const cached = localStorage.getItem(cacheKey)
        if (cached) {
          const parsed = JSON.parse(cached)
          if (parsed.hash === hash) {
            setAiInsight(parsed.insight)
            return
          }
        }
      } catch {}
    }

    try {
      setAiInsightLoading(true)
      const res = await fetch(`/api/shared/${linkId}/insight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (data.success) {
        setAiInsight(data.insight)
        localStorage.setItem(cacheKey, JSON.stringify({ hash, insight: data.insight }))
      }
    } catch (error) {
      console.error('Failed to fetch AI insight:', error)
    } finally {
      setAiInsightLoading(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <main className={`${theme.pageBackground} relative min-h-screen`}>
        <AnimatedHearts />
        <div className="py-12 relative z-10">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className={`${theme.cardBackground} rounded-2xl p-12 text-center`}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-900 mx-auto mb-4"></div>
                <p className={theme.textSecondary}>Loading your vendors...</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // Error state
  if (error || !couple) {
    return (
      <main className={`${theme.pageBackground} relative min-h-screen`}>
        <AnimatedHearts />
        <div className="py-12 relative z-10">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className={`${theme.error.bg} border ${theme.border} rounded-2xl p-8`}>
                <div className="flex items-start gap-4">
                  <AlertCircle className={`${theme.error.text} flex-shrink-0`} size={24} />
                  <div>
                    <h3 className={`text-xl font-semibold ${theme.textPrimary} mb-2`}>Unable to Load</h3>
                    <p className={theme.error.text}>{error || 'This link is invalid or has expired.'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // Success state
  return (
    <div className={`min-h-screen ${theme.pageBackground}`}>
      <AnimatedHearts />

      {/* Hero Header */}
      <header className={`relative ${theme.cardBackground} pt-8 pb-0`}>
        <div className="max-w-3xl mx-auto px-4 relative z-10 text-center">
          {/* Date and Location Metadata */}
          <div className={`mb-3 text-xs ${theme.textMuted} font-medium uppercase tracking-widest flex items-center justify-center gap-2 flex-wrap`}>
            {couple.wedding_date && (
              <>
                <Calendar size={12} /> {format(new Date(couple.wedding_date), 'MMM d, yyyy')}
              </>
            )}
            {couple.wedding_location && couple.wedding_date && (
              <span className="text-stone-300">•</span>
            )}
            {couple.wedding_location && (
              <>
                <MapPin size={12} /> {couple.wedding_location}
              </>
            )}
          </div>

          {/* Couple Names */}
          <h1 className={`text-5xl font-display ${theme.textPrimary} mb-6`}>
            {couple.couple_names}
          </h1>

          {/* Bridezilla Assistance Card */}
          <div className={`relative ${theme.cardBackground} p-6 rounded-2xl shadow-sm ${theme.border} ${theme.borderWidth} mb-8`}>
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white px-2">
              <Image
                src="/bridezilla-logo-circle-green.svg"
                alt="Bridezilla"
                width={28}
                height={28}
                className="object-contain"
              />
            </div>
            {aiInsightLoading ? (
              <div className="flex justify-center">
                <div className="h-3 rounded w-3/4 bg-emerald-50 animate-pulse" />
              </div>
            ) : aiInsight ? (
              <p className={`italic ${theme.textPrimary} leading-relaxed`}>
                &ldquo;{aiInsight.split(/\*\*/).map((part, i) =>
                  i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
                )}&rdquo;
              </p>
            ) : (
              <p className={`italic ${theme.textPrimary} leading-relaxed`}>
                &ldquo;I&apos;ve curated these vendor recommendations based on your vision. Review each one and let me know your thoughts!&rdquo;
              </p>
            )}
            <div className={`mt-3 text-[10px] font-bold ${theme.textMuted} uppercase tracking-widest`}>
              Bridezilla Assistance
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 md:gap-16 pb-6 max-w-2xl mx-auto">
            <div className="text-center">
              <div className={`text-2xl md:text-4xl font-semibold ${theme.textPrimary} mb-2`}>{stats.totalCategories}</div>
              <div className={`text-[9px] md:text-[11px] font-semibold ${theme.textMuted} uppercase tracking-[0.12em] md:tracking-[0.15em]`}>Vendors Needed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-4xl font-semibold mb-2" style={{ color: theme.primaryColor }}>{stats.bookedCount}</div>
              <div className={`text-[9px] md:text-[11px] font-semibold ${theme.textMuted} uppercase tracking-[0.12em] md:tracking-[0.15em]`}>Booked & Confirmed</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl md:text-4xl font-semibold ${theme.textPrimary} mb-2`}>{stats.toHireCount}</div>
              <div className={`text-[9px] md:text-[11px] font-semibold ${theme.textMuted} uppercase tracking-[0.12em] md:tracking-[0.15em]`}>To Hire</div>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation Section */}
      <div className="sticky top-0 z-40 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          {/* Module Tabs */}
          <div className="flex justify-center space-x-8 border-b border-stone-200">
            <button
              onClick={() => setActiveTab('vendors')}
              className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'vendors'
                  ? `border-current ${theme.textPrimary}`
                  : `border-transparent ${theme.textSecondary} hover:${theme.textPrimary}`
              }`}
            >
              Vendor Team
            </button>
            <button
              onClick={() => setActiveTab('guestlist')}
              className={`pb-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'guestlist'
                  ? `border-current ${theme.textPrimary}`
                  : `border-transparent ${theme.textMuted} hover:${theme.textSecondary}`
              }`}
            >
              <Lock size={12} /> Guest List
            </button>
            <button
              onClick={() => setActiveTab('budget')}
              className={`pb-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'budget'
                  ? `border-current ${theme.textPrimary}`
                  : `border-transparent ${theme.textMuted} hover:${theme.textSecondary}`
              }`}
            >
              <Lock size={12} /> Budget
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-0">
        {/* Vendor Team Tab Content */}
        {activeTab === 'vendors' && (
          <>
            {/* Category Filters */}
            {vendors.length > 0 && (
              <div className={`sticky top-[57px] md:top-[65px] z-30 ${theme.pageBackground} border-b border-stone-200 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 mb-8`}>
                <div className="flex justify-center space-x-2 overflow-x-auto no-scrollbar pb-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                        activeCategory === cat
                          ? `${theme.primaryButton} ${theme.textOnPrimary} ${theme.primaryButtonHover}`
                          : `${theme.secondaryButton} ${theme.textSecondary} ${theme.secondaryButtonHover}`
                      }`}
                    >
                      {cat} ({cat === 'All' ? vendors.length : vendors.filter(v => v.vendor_type === cat).length})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Vendor List */}
            {filteredVendors.length === 0 ? (
              <div className={`${theme.cardBackground} rounded-2xl p-12 text-center`}>
                <p className={theme.textSecondary}>No vendor recommendations in this category yet.</p>
              </div>
            ) : (
              <SharedVendorList
                vendors={filteredVendors}
                coupleId={couple.id}
                onUpdate={fetchWorkspaceData}
                activeCategory={activeCategory}
              />
            )}
          </>
        )}

        {/* Upsell / Locked State for Guest List & Budget */}
        {(activeTab === 'guestlist' || activeTab === 'budget') && (
          <div className={`${theme.cardBackground} rounded-2xl ${theme.border} ${theme.borderWidth} shadow-sm p-12 text-center max-w-2xl mx-auto`}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: `${theme.primaryColor}15`, color: theme.primaryColor }}>
              <Lock size={32} />
            </div>
            <h2 className={`font-display text-3xl ${theme.textPrimary} mb-4`}>Unlock Full Planning Suite</h2>
            <p className={`${theme.textSecondary} max-w-md mx-auto mb-8`}>
              Get access to advanced tools like the Guest List Manager, Budget Tracker, and collaborative planning by creating your free account.
            </p>
            <button
              className={`${theme.primaryButton} ${theme.textOnPrimary} px-8 py-3 rounded-lg font-medium ${theme.primaryButtonHover} transition-colors shadow-lg`}
            >
              Create Free Account
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className={`${theme.cardBackground} border-t ${theme.border} mt-20 py-8 relative z-10`}>
        <div className="max-w-7xl mx-auto px-4 text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Heart className="w-4 h-4" style={{ color: theme.primaryColor }} fill="currentColor" />
            <p className={`font-display ${theme.textPrimary}`}>{couple.couple_names}</p>
          </div>
          <p className={`text-xs ${theme.textMuted}`}>
            The perfect wedding planned with{' '}
            <a
              href="https://bridezilla-demo.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
              style={{ color: theme.primaryColor }}
            >
              Bridezilla
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
