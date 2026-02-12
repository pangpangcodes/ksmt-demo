'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Calendar,
  MapPin,
  Mail,
  Phone,
  Eye,
  Edit2,
  Lock,
  Wallet,
  Sparkles,
  CheckCircle2,
  Clock,
  Heart,
  List,
  Plus,
  ChevronRight,
  Send,
  Link as LinkIcon,
  Copy,
  Check,
  Layers,
  Search
} from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import { useTheme } from '@/contexts/ThemeContext'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { StatCard } from '@/components/ui/StatCard'
import VendorCard from '../VendorCard'
import SearchableMultiSelect from '../SearchableMultiSelect'
import SelectVendorsModal from './SelectVendorsModal'
import EmailPreviewModal from './EmailPreviewModal'
import AskBridezillaVendorModal from './AskBridezillaVendorModal'
import InviteCoupleModal from './InviteCoupleModal'
import Notification from './Notification'
import type { PlannerCouple, SharedVendor, VendorStatus, VendorLibrary } from '@/types/planner'

interface CoupleDetailProps {
  coupleId: string
}

export default function CoupleDetail({ coupleId }: CoupleDetailProps) {
  const router = useRouter()
  const { theme: currentTheme } = useTheme()
  const theme = useThemeStyles()
  const [couple, setCouple] = useState<PlannerCouple | null>(null)
  const [vendors, setVendors] = useState<SharedVendor[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'vendors'>('overview')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string[]>([])
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null)

  // Share vendors state
  const [showShareModal, setShowShareModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [vendorLibrary, setVendorLibrary] = useState<VendorLibrary[]>([])
  const [alreadySharedVendors, setAlreadySharedVendors] = useState<SharedVendor[]>([])
  const [selectedVendors, setSelectedVendors] = useState<{vendorIds: string[], customMessage: string}>({vendorIds: [], customMessage: ''})
  const [loadingVendors, setLoadingVendors] = useState(false)
  const [notification, setNotification] = useState<{type: 'success' | 'error' | 'warning', title: string, message: string} | null>(null)
  const [showAskBridezillaModal, setShowAskBridezillaModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [aiInsight, setAiInsight] = useState<string | null>(null)
  const [aiInsightLoading, setAiInsightLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [coupleId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const token = sessionStorage.getItem('planner_auth')

      // Fetch couple
      const coupleResponse = await fetch(`/api/planner/couples/${coupleId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const coupleData = await coupleResponse.json()
      if (coupleData.success) {
        setCouple(coupleData.data)
        document.title = `${coupleData.data.couple_names} | Bridezilla`

        // Fetch vendors with library vendor details using the couple's UUID
        const { data: vendorsData, error: vendorsError } = await supabase
          .from('shared_vendors')
          .select('*, vendor_library:planner_vendor_library!vendor_library_id(*)')
          .eq('planner_couple_id', coupleData.data.id)
          .order('vendor_type', { ascending: true })

        if (vendorsError) {
          console.error('Vendors fetch error:', vendorsError)
        } else {
          const vList = vendorsData || []
          setVendors(vList)
          fetchInsight(coupleData.data, vList)
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const computeInsightHash = (coupleData: PlannerCouple, vendorList: SharedVendor[]) => {
    const signature = vendorList
      .map(v => `${v.id}:${v.vendor_type}:${v.vendor_name}:${v.couple_status || ''}`)
      .sort()
      .join('|')
    return `${coupleData.id}:${vendorList.length}:${signature}`
  }

  const fetchInsight = async (coupleData: PlannerCouple, vendorList: SharedVendor[]) => {
    const cacheKey = `bridezilla-insight-${coupleData.id}`
    const hash = computeInsightHash(coupleData, vendorList)

    // Check cache (production only)
    const isDev = process.env.NODE_ENV === 'development'
    if (!isDev) {
      try {
        const cached = localStorage.getItem(cacheKey)
        if (cached) {
          const { hash: cachedHash, insight } = JSON.parse(cached)
          if (cachedHash === hash) {
            setAiInsight(insight)
            return
          }
        }
      } catch {}
    }

    // Data changed or no cache, fetch new insight
    try {
      setAiInsightLoading(true)
      const token = sessionStorage.getItem('planner_auth')
      const vendorStats = {
        vendorTypes: new Set(vendorList.map(v => v.vendor_type)).size,
        booked: vendorList.filter(v => v.couple_status === 'booked').length,
        approved: vendorList.filter(v => v.couple_status === 'interested').length,
        inReview: (() => {
          const byType = vendorList.reduce((acc, v) => {
            if (!acc[v.vendor_type]) acc[v.vendor_type] = []
            acc[v.vendor_type].push(v)
            return acc
          }, {} as Record<string, SharedVendor[]>)
          return Object.values(byType).filter(tvs =>
            !tvs.some(v => v.couple_status === 'booked' || v.couple_status === 'interested') &&
            tvs.some(v => !v.couple_status)
          ).length
        })(),
      }
      const res = await fetch(`/api/planner/couples/${coupleData.id}/insight`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ couple: coupleData, vendors: vendorList, stats: vendorStats }),
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

  const handleStatusChange = async (vendorId: string, status: VendorStatus) => {
    try {
      // Update vendor status in database
      const { error: updateError } = await supabase
        .from('shared_vendors')
        .update({ couple_status: status })
        .eq('id', vendorId)

      if (updateError) {
        console.error('Status update error:', updateError)
        return
      }

      // Update local state
      setVendors(prev => prev.map(v =>
        v.id === vendorId ? { ...v, couple_status: status } : v
      ))

      // Log activity
      if (couple) {
        await supabase.from('vendor_activity').insert({
          planner_couple_id: couple.id,
          shared_vendor_id: vendorId,
          action: 'status_changed',
          actor: 'planner',
          new_value: status
        })
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handleCopyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email)
      setCopiedEmail(email)
      setTimeout(() => setCopiedEmail(null), 2000)
    } catch (error) {
      console.error('Failed to copy email:', error)
    }
  }

  const handleCopyLink = () => {
    if (couple) {
      const link = `${window.location.origin}/s/${couple.share_link_id}`
      navigator.clipboard.writeText(link)
    }
  }

  const handleShareVendors = async () => {
    if (!couple) return

    // Validate email
    if (!couple.couple_email) {
      setNotification({
        type: 'error',
        title: 'Email Required',
        message: `Please add an email address for ${couple.couple_names} before sharing vendors.`
      })
      return
    }

    // Fetch data
    setLoadingVendors(true)
    try {
      const token = sessionStorage.getItem('planner_auth')

      // Parallel fetch
      const [libraryRes, sharedRes] = await Promise.all([
        fetch('/api/planner/vendor-library', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/planner/couples/${couple.id}/vendors`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      // Check for non-200 responses
      if (!libraryRes.ok) {
        setNotification({
          type: 'error',
          title: 'Failed to Load Vendors',
          message: libraryRes.status === 401 ? 'Authentication failed. Please log in again.' : 'Could not load vendors.'
        })
        return
      }

      if (!sharedRes.ok) {
        setNotification({
          type: 'error',
          title: 'Failed to Load Shared Vendors',
          message: sharedRes.status === 401 ? 'Authentication failed. Please log in again.' : 'Could not load shared vendors.'
        })
        return
      }

      const libraryData = await libraryRes.json()
      const sharedData = await sharedRes.json()

      if (libraryData.success && sharedData.success) {
        setVendorLibrary(libraryData.data || [])
        setAlreadySharedVendors(sharedData.data || [])
        setShowShareModal(true)
      } else {
        setNotification({
          type: 'error',
          title: 'Failed to Load Vendors',
          message: libraryData.error || sharedData.error || 'Could not fetch vendor data.'
        })
      }
    } catch (error) {
      console.error('Error in handleShareVendors:', error)
      setNotification({
        type: 'error',
        title: 'Failed to Load Vendors',
        message: 'Could not fetch vendor data. Please try again.'
      })
    } finally {
      setLoadingVendors(false)
    }
  }

  const handleVendorSelectionComplete = (selections: {vendorIds: string[], customMessage: string}) => {
    setSelectedVendors(selections)
    setShowShareModal(false)
    setShowConfirmModal(true)
  }

  const handleConfirmAndSend = async () => {
    if (!couple) return

    try {
      const token = sessionStorage.getItem('planner_auth')

      // Step 1: Share vendors
      const shareResponse = await fetch(`/api/planner/couples/${couple.id}/vendors/bulk-share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          vendor_ids: selectedVendors.vendorIds,
          custom_message: selectedVendors.customMessage
        })
      })

      const shareData = await shareResponse.json()

      if (!shareData.success) {
        throw new Error(shareData.error || 'Failed to share vendors')
      }

      // Step 2: Send email
      const emailResponse = await fetch(`/api/planner/couples/${couple.id}/invite`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const emailData = await emailResponse.json()

      setShowConfirmModal(false)

      if (emailData.success) {
        setNotification({
          type: 'success',
          title: 'Vendors Shared & Email Sent!',
          message: `Successfully shared ${shareData.data.shared} vendors with ${couple.couple_names} and sent invitation to ${couple.couple_email}`
        })
      } else {
        setNotification({
          type: 'warning',
          title: 'Partially Complete',
          message: `Shared ${shareData.data.shared} vendors, but failed to send email. You can resend from the couple detail page.`
        })
      }

      // Refresh vendor data
      fetchData()

    } catch (error: any) {
      setShowConfirmModal(false)
      setNotification({
        type: 'error',
        title: 'Failed to Share Vendors',
        message: error.message || 'Please try again.'
      })
    }
  }

  if (loading || !couple) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  // Sort categories by status priority: Approved first, Review Needed second, Booked last
  const categories = Array.from(new Set(vendors.map(v => v.vendor_type))).sort((a, b) => {
    const aVendors = vendors.filter(v => v.vendor_type === a)
    const bVendors = vendors.filter(v => v.vendor_type === b)

    // Determine priority for each category
    const getPriority = (categoryVendors: SharedVendor[]) => {
      const hasBooked = categoryVendors.some(v => v.couple_status === 'booked')
      const hasApproved = categoryVendors.some(v => v.couple_status === 'interested')

      if (hasApproved) return 1 // Approved - show first (needs to be booked)
      if (!hasBooked && !hasApproved) return 2 // Review Needed - show second
      return 3 // Booked & Confirmed - show last (already done)
    }

    const aPriority = getPriority(aVendors)
    const bPriority = getPriority(bVendors)

    // Sort by priority first, then alphabetically within same priority
    if (aPriority !== bPriority) {
      return aPriority - bPriority
    }
    return a.localeCompare(b)
  })

  // Sync handlers for filters and pills
  const handleTypeFilterChange = (types: string[]) => {
    setSelectedTypeFilter(types)
    // Sync with category pills
    if (types.length === 0) {
      setSelectedCategory('All')
    } else if (types.length === 1) {
      setSelectedCategory(types[0])
    } else {
      setSelectedCategory('All')
    }
  }

  const handleCategoryPillClick = (category: string) => {
    setSelectedCategory(category)
    // Sync with dropdown
    if (category === 'All') {
      setSelectedTypeFilter([])
    } else {
      setSelectedTypeFilter([category])
    }
  }

  // Apply filters
  let filteredVendors = [...vendors]

  // Search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase()
    filteredVendors = filteredVendors.filter(v =>
      v.vendor_name.toLowerCase().includes(query) ||
      v.vendor_library?.contact_name?.toLowerCase().includes(query) ||
      v.vendor_library?.email?.toLowerCase().includes(query) ||
      v.vendor_library?.location?.toLowerCase().includes(query) ||
      v.vendor_type.toLowerCase().includes(query)
    )
  }

  // Type filter (works for both dropdown and pills since they're synced)
  if (selectedCategory !== 'All') {
    filteredVendors = filteredVendors.filter(v => v.vendor_type === selectedCategory)
  } else if (selectedTypeFilter.length > 0) {
    filteredVendors = filteredVendors.filter(v => selectedTypeFilter.includes(v.vendor_type))
  }

  // Status filter
  if (selectedStatusFilter.length > 0) {
    filteredVendors = filteredVendors.filter(v => {
      const status = v.couple_status || 'in_review'
      return selectedStatusFilter.includes(status)
    })
  }

  const vendorsByCategory = categories.reduce((acc, cat) => {
    const categoryVendors = vendors.filter(v => v.vendor_type === cat)
    // Sort vendors: declined (pass) vendors go last
    acc[cat] = categoryVendors.sort((a, b) => {
      if (a.couple_status === 'pass' && b.couple_status !== 'pass') return 1
      if (a.couple_status !== 'pass' && b.couple_status === 'pass') return -1
      return 0
    })
    return acc
  }, {} as Record<string, SharedVendor[]>)

  const stats = {
    vendorTypes: new Set(vendors.map(v => v.vendor_type)).size,
    booked: vendors.filter(v => v.couple_status === 'booked').length,
    approved: vendors.filter(v => v.couple_status === 'interested').length,
    inReview: (() => {
      // Count categories that are "in review" (no booked or approved vendors)
      const categoriesInReview = new Set<string>()
      const vendorsByType = vendors.reduce((acc, vendor) => {
        if (!acc[vendor.vendor_type]) acc[vendor.vendor_type] = []
        acc[vendor.vendor_type].push(vendor)
        return acc
      }, {} as Record<string, SharedVendor[]>)

      Object.entries(vendorsByType).forEach(([type, typeVendors]) => {
        const hasBookedOrApproved = typeVendors.some(v =>
          v.couple_status === 'booked' || v.couple_status === 'interested'
        )
        const hasInReview = typeVendors.some(v => !v.couple_status)

        if (!hasBookedOrApproved && hasInReview) {
          categoriesInReview.add(type)
        }
      })

      return categoriesInReview.size
    })(),
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Date TBD'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Breadcrumb */}
        <div className={`flex items-center gap-2 ${theme.typeSectionHeading} mb-6`}>
          <button
            onClick={() => router.push('/planners?view=couples')}
            className={`${theme.textOnPageMuted} hover:text-white transition-colors`}
          >
            Couples
          </button>
          <ChevronRight size={14} className={theme.textOnPageMuted} />
          <span className={`font-medium ${theme.textOnPagePrimary}`}>{couple.couple_names}</span>
        </div>

        {/* Tabs */}
        <div className={`border-b border-white/20 mb-8`}>
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? `border-current ${theme.textOnPagePrimary}`
                  : `border-transparent ${theme.textOnPageSecondary} hover:text-white`
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('vendors')}
              className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'vendors'
                  ? `border-current ${theme.textOnPagePrimary}`
                  : `border-transparent ${theme.textOnPageSecondary} hover:text-white`
              }`}
            >
              Vendor Team
            </button>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Left: Couple Profile Card */}
            <div className={`${theme.cardBackground} rounded-2xl p-5 lg:p-8 ${theme.border} ${theme.borderWidth} shadow-sm flex flex-col lg:items-center lg:text-center h-full`}>
              <div className="flex items-center gap-4 lg:flex-col lg:gap-0 lg:mb-0">
                <div className="relative mb-0 lg:mb-6">
                  <div className={`w-16 h-16 lg:w-32 lg:h-32 rounded-full ${theme.secondaryButton} flex items-center justify-center text-2xl lg:text-4xl font-serif ${theme.textMuted}`}>
                    {couple.couple_names.charAt(0)}
                  </div>
                  <button
                    onClick={() => setShowEditModal(true)}
                    className={`absolute bottom-0 right-0 p-1.5 lg:p-2 ${theme.cardBackground} rounded-full ${theme.border} ${theme.borderWidth} shadow-sm ${theme.secondaryButtonHover} ${theme.textSecondary}`}
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
                <div>
                  <h2 className={`font-display text-xl lg:text-2xl ${theme.textPrimary} mb-0.5 lg:mb-1`}>{couple.couple_names}</h2>
                  <p className={`${theme.textMuted} text-sm`}>{couple.wedding_location || 'Location TBD'}</p>
                </div>
              </div>

              <div className={`w-full space-y-3 border-t ${theme.border} pt-4 mt-4 lg:pt-6 lg:mt-6`}>
                <div className="flex items-center justify-between text-sm">
                  <span className={`${theme.textMuted} flex items-center gap-2 flex-shrink-0`}>
                    <Calendar size={14} /> Date
                  </span>
                  <span className={`${theme.textPrimary} font-medium text-right`}>{formatDate(couple.wedding_date)}</span>
                </div>
                {couple.couple_email && (
                  <div className="flex items-center justify-between text-sm group">
                    <span className={`${theme.textMuted} flex items-center gap-2 flex-shrink-0`}>
                      <Mail size={14} /> Email
                    </span>
                    <div className="relative ml-auto">
                      <span className={`${theme.textPrimary} font-medium text-right`}>{couple.couple_email}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (couple.couple_email) handleCopyEmail(couple.couple_email)
                        }}
                        className={`absolute -right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-stone-100 rounded`}
                        title="Copy email"
                      >
                        {copiedEmail === couple.couple_email ? (
                          <Check className="w-3.5 h-3.5 text-green-600" />
                        ) : (
                          <Copy className={`w-3.5 h-3.5 ${theme.textMuted}`} />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-auto pt-4 lg:pt-8 w-full space-y-2 lg:space-y-3">
                <button
                  onClick={() => window.open(`/s/${couple.share_link_id}`, '_blank')}
                  className={`w-full py-2.5 ${theme.primaryButton} ${theme.textOnPrimary} rounded-lg text-sm font-medium ${theme.primaryButtonHover} flex items-center justify-center gap-2 shadow-sm transition-all`}
                >
                  <Eye size={16} /> Preview Shared Portal
                </button>
                <button
                  onClick={handleCopyLink}
                  className={`w-full py-2 ${theme.secondaryButton} rounded-lg text-sm font-medium ${theme.textSecondary} ${theme.secondaryButtonHover} flex items-center justify-center gap-2`}
                >
                  <Copy size={16} /> Copy Share Link
                </button>
              </div>
            </div>

            {/* Right: Notes & Stats */}
            <div className="lg:col-span-2 space-y-6">

              {/* AI Insight Banner */}
              <div className={`${theme.cardBackground} rounded-2xl p-5 ${theme.border} ${theme.borderWidth} shadow-sm relative overflow-hidden`}>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <Image
                      src={currentTheme === 'pop' ? '/images/bridezilla-logo-circle.svg' : '/bridezilla-logo-circle-green.svg'}
                      alt="Bridezilla"
                      width={28}
                      height={28}
                      className="object-contain"
                    />
                    <span className={`text-sm font-semibold ${theme.textPrimary}`}>Bridezilla Assistance</span>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${currentTheme === 'pop' ? 'bg-pink-50 text-pink-500' : 'bg-emerald-50 text-emerald-600'}`}>
                      AI Insight
                    </span>
                  </div>
                  {aiInsightLoading ? (
                    <div className="flex items-center gap-2">
                      <div className={`h-3 rounded w-3/4 ${currentTheme === 'pop' ? 'bg-pink-50' : 'bg-emerald-50'} animate-pulse`} />
                    </div>
                  ) : aiInsight ? (
                    <p className={`text-sm ${theme.textSecondary} leading-relaxed`}>&ldquo;{aiInsight.split(/\*\*/).map((part, i) =>
                      i % 2 === 1 ? <strong key={i} className={`font-semibold ${theme.textPrimary}`}>{part}</strong> : part
                    )}&rdquo;</p>
                  ) : (
                    <p className={`text-sm ${theme.textMuted} italic`}>Generating insight...</p>
                  )}
                </div>
                {/* Decorative faded logo */}
                <div className="absolute -right-4 -bottom-4 opacity-[0.06]">
                  <Image
                    src={currentTheme === 'pop' ? '/images/bridezilla-logo-circle.svg' : '/bridezilla-logo-circle-green.svg'}
                    alt=""
                    width={120}
                    height={120}
                    className="object-contain"
                  />
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-4 md:gap-6">
                <StatCard
                  icon={<Wallet className={`w-4 h-4 ${theme.textSecondary}`} />}
                  label="Vendors Needed"
                  value={stats.vendorTypes}
                  theme={theme}
                />

                <StatCard
                  icon={<Sparkles className="w-4 h-4 text-emerald-600" />}
                  iconBg="bg-emerald-50"
                  label="Booked & Confirmed"
                  value={stats.booked}
                  theme={theme}
                />
              </div>

              {/* Private Notes */}
              <div className={`${theme.cardBackground} rounded-2xl p-5 ${theme.border} ${theme.borderWidth} shadow-sm relative overflow-hidden group`}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className={`text-sm font-bold ${theme.textMuted} uppercase tracking-widest flex items-center gap-2`}>
                    <Lock size={14} /> Private Planner Notes
                  </h3>
                  <span className={`text-xs ${theme.textMuted} italic`}>Visible only to you</span>
                </div>
                <textarea
                  className={`w-full p-3 ${theme.secondaryButton} rounded-xl border-none focus:ring-2 focus:ring-offset-0 resize-none ${theme.textPrimary} text-sm leading-relaxed overflow-hidden`}
                  rows={2}
                  style={{ fieldSizing: 'content' } as React.CSSProperties}
                  defaultValue={couple.notes || ''}
                  placeholder="Add internal notes about this couple..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Vendor Team Tab */}
        {activeTab === 'vendors' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">

            {/* Status Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <StatCard
                icon={<Layers className={`w-4 h-4 ${theme.textSecondary}`} />}
                label="Vendors Needed"
                value={stats.vendorTypes}
                theme={theme}
              />

              <StatCard
                icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                iconBg="bg-emerald-50"
                label="Booked & Confirmed"
                value={stats.booked}
                theme={theme}
              />

              <StatCard
                icon={<Heart className="w-4 h-4 text-emerald-600" />}
                iconBg="bg-emerald-50"
                label="Approved"
                value={stats.approved}
                theme={theme}
              />

              <StatCard
                icon={<Clock className={`w-4 h-4 ${theme.textSecondary}`} />}
                label="In Review"
                value={stats.inReview}
                theme={theme}
              />
            </div>

            {/* Filter Bar */}

              <div className={`${theme.cardBackground} rounded-2xl ${theme.border} ${theme.borderWidth} p-6 mb-6`}>
                {/* Desktop Layout - unchanged */}
                <div className="hidden lg:flex flex-wrap gap-2 lg:gap-4 items-center justify-between">
                  <div className="flex gap-2 flex-wrap flex-1">
                    {/* Search */}
                    <div className="min-w-[200px]">
                      <div className="relative">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${theme.textMuted}`} />
                        <input
                          type="text"
                          placeholder="Search vendors..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className={`w-full pl-10 pr-10 py-2 ${theme.border} ${theme.borderWidth} rounded-xl text-sm font-medium ${theme.textPrimary} focus:outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all`}
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className={`absolute right-3 top-1/2 -translate-y-1/2 ${theme.textMuted} hover:${theme.textSecondary}`}
                            title="Clear search"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      {searchQuery && (
                        <div className={`text-xs ${theme.textSecondary} mt-1`}>
                          Showing {filteredVendors.length} of {vendors.length} vendors
                        </div>
                      )}
                    </div>

                    {/* Type Filter */}
                    <SearchableMultiSelect
                      options={categories.map(type => ({
                        value: type,
                        label: type,
                        count: vendors.filter(v => v.vendor_type === type).length
                      }))}
                      selectedValues={selectedTypeFilter}
                      onChange={handleTypeFilterChange}
                      placeholder="Filter by type..."
                      allLabel="All Types"
                      className="min-w-[160px]"
                    />

                    {/* Status Filter */}
                    <SearchableMultiSelect
                      options={[
                        { value: 'interested', label: 'Approved', count: vendors.filter(v => v.couple_status === 'interested').length },
                        { value: 'booked', label: 'Booked & Confirmed', count: vendors.filter(v => v.couple_status === 'booked').length },
                        { value: 'in_review', label: 'In Review', count: vendors.filter(v => !v.couple_status).length },
                        { value: 'pass', label: 'Declined', count: vendors.filter(v => v.couple_status === 'pass').length }
                      ].filter(opt => opt.count > 0)}
                      selectedValues={selectedStatusFilter}
                      onChange={setSelectedStatusFilter}
                      placeholder="Filter by status..."
                      allLabel="All Statuses"
                      className="min-w-[160px]"
                    />
                  </div>

                  {/* Share Vendors Button */}
                  <button
                    onClick={handleShareVendors}
                    disabled={loadingVendors}
                    className={`flex items-center gap-2 px-6 py-2.5 ${theme.secondaryButton} rounded-xl text-sm font-medium ${theme.secondaryButtonHover} transition-colors disabled:opacity-50`}
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Share Manually</span>
                  </button>

                  {/* Ask Bridezilla Button */}
                  <button
                    onClick={() => setShowAskBridezillaModal(true)}
                    className={`flex items-center gap-2 px-6 py-2.5 ${theme.primaryButton} ${theme.primaryButtonHover} ${theme.textOnPrimary} rounded-xl text-sm font-medium transition-colors`}
                  >
                    <Image
                      src="/images/bridezilla-logo-green.png"
                      alt="Bridezilla"
                      width={20}
                      height={20}
                      className="object-contain"
                    />
                    <span className="hidden sm:inline">Ask Bridezilla</span>
                  </button>
                </div>

                {/* Mobile/Tablet Layout - dropdowns at top, then controls */}
                <div className="lg:hidden">
                  <div className="flex flex-col gap-2">
                    {/* Type Filter - full width */}
                    <SearchableMultiSelect
                      options={categories.map(type => ({
                        value: type,
                        label: type,
                        count: vendors.filter(v => v.vendor_type === type).length
                      }))}
                      selectedValues={selectedTypeFilter}
                      onChange={handleTypeFilterChange}
                      placeholder="Filter by type..."
                      allLabel="All Types"
                      className="w-full"
                      inlineOnMobile={true}
                    />

                    {/* Status Filter - full width */}
                    <SearchableMultiSelect
                      options={[
                        { value: 'interested', label: 'Approved', count: vendors.filter(v => v.couple_status === 'interested').length },
                        { value: 'booked', label: 'Booked & Confirmed', count: vendors.filter(v => v.couple_status === 'booked').length },
                        { value: 'in_review', label: 'In Review', count: vendors.filter(v => !v.couple_status).length },
                        { value: 'pass', label: 'Declined', count: vendors.filter(v => v.couple_status === 'pass').length }
                      ].filter(opt => opt.count > 0)}
                      selectedValues={selectedStatusFilter}
                      onChange={setSelectedStatusFilter}
                      placeholder="Filter by status..."
                      allLabel="All Statuses"
                      className="w-full"
                      inlineOnMobile={true}
                    />

                    {/* Search */}
                    <div className="w-full">
                      <div className="relative">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${theme.textMuted}`} />
                        <input
                          type="text"
                          placeholder="Search vendors..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className={`w-full pl-10 pr-10 py-2 ${theme.border} ${theme.borderWidth} rounded-xl text-sm font-medium ${theme.textPrimary} focus:outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all`}
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className={`absolute right-3 top-1/2 -translate-y-1/2 ${theme.textMuted} hover:${theme.textSecondary}`}
                            title="Clear search"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      {searchQuery && (
                        <div className={`text-xs ${theme.textSecondary} mt-1`}>
                          Showing {filteredVendors.length} of {vendors.length} vendors
                        </div>
                      )}
                    </div>

                    {/* Buttons row */}
                    <div className="flex gap-2">
                      <button
                        onClick={handleShareVendors}
                        disabled={loadingVendors}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 ${theme.secondaryButton} rounded-xl text-sm font-medium ${theme.secondaryButtonHover} transition-colors disabled:opacity-50`}
                      >
                        <Plus className="w-4 h-4" />
                        <span>Share Manually</span>
                      </button>

                      <button
                        onClick={() => setShowAskBridezillaModal(true)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 ${theme.primaryButton} ${theme.primaryButtonHover} ${theme.textOnPrimary} rounded-xl text-sm font-medium transition-colors`}
                      >
                        <Image
                          src="/images/bridezilla-logo-green.png"
                          alt="Bridezilla"
                          width={20}
                          height={20}
                          className="object-contain"
                        />
                        <span>Ask Bridezilla</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>


            {/* Category Filters */}
            {vendors.length > 0 && (
              <div className={`sticky top-20 z-30 ${theme.pageBackground} backdrop-blur py-4 -mx-4 px-4 border-b border-transparent`}>
                <div className="flex justify-center space-x-2 overflow-x-auto no-scrollbar pb-1">
                  <button
                    onClick={() => handleCategoryPillClick('All')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                      selectedCategory === 'All'
                        ? `${theme.primaryButton} ${theme.textOnPrimary} ${theme.primaryButtonHover}`
                        : `${theme.secondaryButton} ${theme.textSecondary} ${theme.secondaryButtonHover}`
                    }`}
                  >
                    All ({vendors.length})
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => handleCategoryPillClick(cat)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                        selectedCategory === cat
                          ? `${theme.primaryButton} ${theme.textOnPrimary} ${theme.primaryButtonHover}`
                          : `${theme.secondaryButton} ${theme.textSecondary} ${theme.secondaryButtonHover}`
                      }`}
                    >
                      {cat} ({vendorsByCategory[cat].length})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Vendor Grid */}
            {vendors.length === 0 ? (
              <div className={`${theme.cardBackground} rounded-2xl p-12 text-center border ${theme.border}`}>
                <p className={`${theme.textSecondary} `}>No vendors shared with this couple yet.</p>
              </div>
            ) : selectedCategory === 'All' ? (
              <div className="space-y-8">
                {categories.map(category => {
                  const categoryVendors = vendorsByCategory[category]
                  const inReview = categoryVendors.filter(v => !v.couple_status).length
                  const approved = categoryVendors.filter(v => v.couple_status === 'interested').length
                  const booked = categoryVendors.filter(v => v.couple_status === 'booked').length
                  const declined = categoryVendors.filter(v => v.couple_status === 'pass').length

                  // Build status text - if there's at least one approved or booked, only show that
                  let statusText
                  if (booked > 0) {
                    statusText = `${booked} Booking Confirmed`
                  } else if (approved > 0) {
                    statusText = `${approved} Approved`
                  } else {
                    const statusParts = []
                    if (inReview > 0) statusParts.push(`${inReview} In Review`)
                    if (declined > 0) statusParts.push(`${declined} Declined`)
                    statusText = statusParts.length > 0 ? statusParts.join(' • ') : `${categoryVendors.length} Vendors`
                  }

                  // Check if any vendor in this category is approved or booked
                  const hasApprovedVendor = approved > 0 || booked > 0

                  // Sort vendors: booked first, then approved, then in review, then declined
                  const sortedVendors = [...categoryVendors].sort((a, b) => {
                    const statusOrder: Record<string, number> = {
                      'booked': 0,
                      'interested': 1,
                      'contacted': 2,
                      'quoted': 3,
                      'null': 4,
                      'pass': 5
                    }
                    const aStatus = a.couple_status || 'null'
                    const bStatus = b.couple_status || 'null'
                    return statusOrder[aStatus] - statusOrder[bStatus]
                  })

                  return (
                    <div key={category}>
                      <div className="flex items-center gap-4 mb-6">
                        <h3 className={`text-xl font-display ${theme.textOnPagePrimary}`}>{category}</h3>
                        <div className={`h-px bg-white/20 flex-1`}></div>
                        <span className={`text-xs ${theme.textOnPageMuted} uppercase tracking-widest`}>
                          {statusText}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sortedVendors.map(vendor => {
                          // Vendor is superseded if:
                          // 1. There's a booked vendor and this one is not booked, OR
                          // 2. There's an approved vendor (and no booked) and this one is in review
                          const isSuperseded = (booked > 0 && vendor.couple_status !== 'booked') ||
                                               (booked === 0 && approved > 0 && !vendor.couple_status)
                          return (
                            <VendorCard
                              key={vendor.id}
                              vendor={vendor}
                              mode="planner"
                              isSuperseded={isSuperseded}
                              onStatusChange={handleStatusChange}
                            />
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...filteredVendors].sort((a, b) => {
                  const statusOrder: Record<string, number> = {
                    'booked': 0,
                    'interested': 1,
                    'contacted': 2,
                    'quoted': 3,
                    'null': 4,
                    'pass': 5
                  }
                  const aStatus = a.couple_status || 'null'
                  const bStatus = b.couple_status || 'null'
                  return statusOrder[aStatus] - statusOrder[bStatus]
                }).map(vendor => {
                  // Check if any vendor in the filtered category is booked or approved
                  const hasBookedInCategory = filteredVendors.some(v => v.couple_status === 'booked')
                  const hasApprovedInCategory = filteredVendors.some(v => v.couple_status === 'interested')
                  // Vendor is superseded if:
                  // 1. There's a booked vendor and this one is not booked, OR
                  // 2. There's an approved vendor (and no booked) and this one is in review
                  const isSuperseded = (hasBookedInCategory && vendor.couple_status !== 'booked') ||
                                       (!hasBookedInCategory && hasApprovedInCategory && !vendor.couple_status)
                  return (
                    <VendorCard
                      key={vendor.id}
                      vendor={vendor}
                      mode="planner"
                      isSuperseded={isSuperseded}
                      onStatusChange={handleStatusChange}
                    />
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showShareModal && couple && (
        <SelectVendorsModal
          coupleId={couple.id}
          coupleName={couple.couple_names}
          vendorLibrary={vendorLibrary}
          alreadySharedVendors={alreadySharedVendors}
          initialSelectedVendorIds={selectedVendors.vendorIds}
          initialCustomMessage={selectedVendors.customMessage}
          onClose={() => {
            setShowShareModal(false)
            setSelectedVendors({vendorIds: [], customMessage: ''})
          }}
          onContinue={handleVendorSelectionComplete}
        />
      )}

      {showConfirmModal && couple && (() => {
        const selectedVendorDetails = vendorLibrary.filter(v =>
          selectedVendors.vendorIds.includes(v.id)
        )

        const categoryMap = new Map<string, number>()
        selectedVendorDetails.forEach(vendor => {
          const count = categoryMap.get(vendor.vendor_type) || 0
          categoryMap.set(vendor.vendor_type, count + 1)
        })

        const vendorCategories = Array.from(categoryMap.entries()).map(([type, count]) => ({
          type,
          count
        }))

        return (
          <EmailPreviewModal
            couple={couple}
            vendorCount={selectedVendors.vendorIds.length}
            vendorCategories={vendorCategories}
            customMessage={selectedVendors.customMessage}
            onBack={() => {
              setShowConfirmModal(false)
              setShowShareModal(true)
            }}
            onConfirm={handleConfirmAndSend}
            onClose={() => {
              setShowConfirmModal(false)
              setSelectedVendors({vendorIds: [], customMessage: ''})
            }}
          />
        )
      })()}

      {/* Ask Bridezilla Modal */}
      {showAskBridezillaModal && (
        <AskBridezillaVendorModal
          existingVendors={vendorLibrary}
          onClose={() => setShowAskBridezillaModal(false)}
          onSuccess={() => {
            setShowAskBridezillaModal(false)
            fetchData() // Refresh vendor data
            setNotification({
              type: 'success',
              title: 'Vendors Added!',
              message: 'New vendors have been added to your library and are ready to share with couples.'
            })
          }}
        />
      )}

      {/* Edit Couple Modal */}
      {couple && (
        <InviteCoupleModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false)
            fetchData() // Refresh couple data
          }}
          coupleToEdit={couple}
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
    </div>
  )
}
