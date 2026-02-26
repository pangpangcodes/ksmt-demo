'use client'

import { useState, useEffect, useCallback, useMemo, MutableRefObject } from 'react'
import { Calendar as BigCalendar, dateFnsLocalizer, View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, addMonths, subMonths } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Search, Calendar as CalendarIcon, Users, Clock, Package, List, Grid, AlertCircle, Bot } from 'lucide-react'
import { PlannerCouple, ParsedCoupleOperation } from '@/types/planner'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { StatCard } from '@/components/ui/StatCard'
import PlannerAskAICoupleModal from './PlannerAskAICoupleModal'
import InviteCoupleModal from './InviteCoupleModal'
import CoupleTableRow from './CoupleTableRow'
import SearchableMultiSelect from '../SearchableMultiSelect'
import 'react-big-calendar/lib/css/react-big-calendar.css'

// Setup localizer for react-big-calendar
const locales = {
  'en-US': enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: PlannerCouple
}

interface CouplesCalendarViewProps {
  setDisplayModeRef?: MutableRefObject<((mode: 'calendar' | 'list') => void) | null>
}

export default function CouplesCalendarView({ setDisplayModeRef }: CouplesCalendarViewProps) {
  const router = useRouter()
  const { theme: currentTheme } = useTheme()
  const theme = useThemeStyles()

  const [couples, setCouples] = useState<PlannerCouple[]>([])
  const [filteredCouples, setFilteredCouples] = useState<PlannerCouple[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<View>('month')
  const [displayMode, setDisplayMode] = useState<'calendar' | 'list'>('calendar')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedVenue, setSelectedVenue] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [initialNavigationDone, setInitialNavigationDone] = useState(false)

  // Expose setDisplayMode to parent via ref
  useEffect(() => {
    if (setDisplayModeRef) {
      setDisplayModeRef.current = setDisplayMode
    }
    return () => {
      if (setDisplayModeRef) {
        setDisplayModeRef.current = null
      }
    }
  }, [setDisplayModeRef])

  // Listen for chat actions (open_couple_modal only - navigation handled by PlannerDashboard)
  const handleChatAction = useCallback((e: Event) => {
    const { type, data } = (e as CustomEvent).detail
    if (type === 'open_couple_modal') {
      setChatInitialOperation(data as ParsedCoupleOperation)
      setShowAddModal(true)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('ksmt:chat-action', handleChatAction)
    return () => window.removeEventListener('ksmt:chat-action', handleChatAction)
  }, [handleChatAction])

  // Load saved view preference from localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768

      if (isMobile) {
        // On mobile, always default to list view (ignore cached preferences)
        setDisplayMode('list')
      } else {
        // On desktop, respect cached preference or default to calendar
        const saved = localStorage.getItem('couplesViewMode')
        if (saved === 'list' || saved === 'calendar') {
          setDisplayMode(saved)
        } else {
          setDisplayMode('calendar')
        }
      }
    }
  }, [])

  // Auto-navigate to last viewed date or first couple's wedding date (calendar view only)
  useEffect(() => {
    if (couples.length > 0 && !initialNavigationDone && displayMode === 'calendar') {
      setInitialNavigationDone(true)

      if (typeof window !== 'undefined') {
        // Try to load last viewed date
        const savedDate = localStorage.getItem('couplesCalendarLastDate')
        if (savedDate) {
          const parsedDate = new Date(savedDate)
          if (!isNaN(parsedDate.getTime())) {
            setCurrentDate(parsedDate)
            setSelectedYear(parsedDate.getFullYear())
            return
          }
        }

        // If no saved date, navigate to first couple with a wedding date
        const couplesWithDates = couples.filter(c => c.wedding_date).sort((a, b) =>
          new Date(a.wedding_date!).getTime() - new Date(b.wedding_date!).getTime()
        )

        if (couplesWithDates.length > 0) {
          const firstDate = new Date(couplesWithDates[0].wedding_date!)
          setCurrentDate(firstDate)
          setSelectedYear(firstDate.getFullYear())
        }
      }
    }
  }, [couples, initialNavigationDone, displayMode])

  // Preserve scroll position when filters change
  const preserveScrollPosition = () => {
    const scrollY = window.scrollY
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY)
    })
  }

  // Filter handler with scroll preservation
  const handleVenueChange = (values: string[]) => {
    preserveScrollPosition()
    setSelectedVenue(values)
  }

  // Handle display mode change (persistence handled by useEffect)
  const handleDisplayModeChange = (mode: 'calendar' | 'list') => {
    setDisplayMode(mode)
  }

  const [showAddModal, setShowAddModal] = useState(false)
  const [chatInitialOperation, setChatInitialOperation] = useState<ParsedCoupleOperation | undefined>(undefined)
  const [showManualInvite, setShowManualInvite] = useState(false)
  const [vendorCounts, setVendorCounts] = useState<Record<string, {total: number, bookedCategories: number, totalCategories: number}>>({})
  const [editingCouple, setEditingCouple] = useState<PlannerCouple | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    activeThisWeek: 0,
    upcomingThreeMonths: 0,
    withVendors: 0
  })

  useEffect(() => {
    // Ensure planner auth token is set (since password gate was removed)
    if (typeof window !== 'undefined' && !sessionStorage.getItem('planner_auth')) {
      sessionStorage.setItem('planner_auth', 'planner')
    }
    fetchCouples()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [couples, searchQuery, selectedVenue, selectedYear])

  // Auto-navigate to first couple's wedding date when searching
  useEffect(() => {
    if (searchQuery && filteredCouples.length > 0 && filteredCouples[0].wedding_date) {
      const weddingDate = new Date(filteredCouples[0].wedding_date)
      setCurrentDate(weddingDate)
      setSelectedYear(weddingDate.getFullYear())
    }
  }, [filteredCouples, searchQuery])

  useEffect(() => {
    calculateStats()
  }, [couples, vendorCounts])

  // Persist display mode to localStorage (desktop only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768
      // Only save preferences on desktop
      if (!isMobile) {
        localStorage.setItem('couplesViewMode', displayMode)
      }
    }
  }, [displayMode])

  const fetchCouples = async () => {
    setError(null)
    setLoading(true)
    try {
      const token = sessionStorage.getItem('planner_auth')
      const response = await fetch('/api/planners/couples', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (!data.success) {
        setError('Could not load your couples. Please try refreshing the page.')
        return
      }

      setCouples(data.data)

      // Fetch vendor counts for each couple
      const counts: Record<string, {total: number, bookedCategories: number, totalCategories: number}> = {}
      for (const couple of data.data) {
        const vendorResponse = await fetch(`/api/planners/couples/${couple.id}/vendors`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const vendorData = await vendorResponse.json()
        const vendors = vendorData.data || []

        // Calculate unique categories and booked categories
        const categoriesMap = new Map<string, boolean>()
        vendors.forEach((vendor: any) => {
          const category = vendor.vendor_type
          const isBooked = vendor.couple_status === 'booked'
          if (!categoriesMap.has(category)) {
            categoriesMap.set(category, isBooked)
          } else if (isBooked) {
            // If any vendor in the category is booked, mark category as booked
            categoriesMap.set(category, true)
          }
        })

        const totalCategories = categoriesMap.size
        const bookedCategories = Array.from(categoriesMap.values()).filter(booked => booked).length

        counts[couple.id] = {
          total: vendors.length,
          bookedCategories,
          totalCategories
        }
      }
      setVendorCounts(counts)
    } catch (error) {
      console.error('Failed to fetch couples:', error)
      setError('Could not load your couples. Please try refreshing the page.')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = () => {
    const now = new Date()
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const threeMonthsFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

    const activeThisWeek = couples.filter(c => {
      if (!c.wedding_date) return false
      const weddingDate = new Date(c.wedding_date)
      return weddingDate >= now && weddingDate <= oneWeekFromNow
    }).length

    const upcomingThreeMonths = couples.filter(c => {
      if (!c.wedding_date) return false
      const weddingDate = new Date(c.wedding_date)
      return weddingDate >= now && weddingDate <= threeMonthsFromNow
    }).length

    setStats({
      total: couples.length,
      activeThisWeek,
      upcomingThreeMonths,
      withVendors: Object.values(vendorCounts).filter(count => count.total > 0).length
    })
  }

  const applyFilters = () => {
    let filtered = [...couples]

    // Search filter (apply first for better UX)
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase()
      filtered = filtered.filter(c => {
        const coupleName = c.couple_names?.toLowerCase() || ''
        const coupleEmail = c.couple_email?.toLowerCase() || ''
        const venueName = c.venue_name?.toLowerCase() || ''
        const location = c.wedding_location?.toLowerCase() || ''

        const matches = coupleName.includes(query) ||
                       coupleEmail.includes(query) ||
                       venueName.includes(query) ||
                       location.includes(query)

        // Debug logging
        if (query.length > 2) {
          console.log('Search:', query, '| Couple:', coupleName, '| Email:', coupleEmail, '| Matches:', matches)
        }

        return matches
      })
    }

    // Year filter (only if no search query, or after search)
    if (selectedYear && !searchQuery) {
      filtered = filtered.filter(c => {
        if (!c.wedding_date) return false
        const year = new Date(c.wedding_date).getFullYear()
        return year === selectedYear
      })
    }

    // Venue filter
    if (selectedVenue.length > 0) {
      filtered = filtered.filter(c =>
        c.venue_name && selectedVenue.includes(c.venue_name)
      )
    }

    // Sort by wedding date (earliest to latest)
    // Couples with dates come first (sorted), couples without dates come last
    filtered.sort((a, b) => {
      if (!a.wedding_date && !b.wedding_date) return 0
      if (!a.wedding_date) return 1 // a goes to end
      if (!b.wedding_date) return -1 // b goes to end

      // Both have dates - parse without timezone to avoid date shifting
      const [yearA, monthA, dayA] = a.wedding_date.split('-').map(Number)
      const [yearB, monthB, dayB] = b.wedding_date.split('-').map(Number)
      const dateA = new Date(yearA, monthA - 1, dayA)
      const dateB = new Date(yearB, monthB - 1, dayB)

      return dateA.getTime() - dateB.getTime() // Earliest first
    })

    console.log('Filter results:', filtered.length, 'couples out of', couples.length)
    setFilteredCouples(filtered)
  }

  const handleEdit = (couple: PlannerCouple) => {
    setEditingCouple(couple)
    setShowEditModal(true)
  }

  const handleDelete = (coupleId: string) => {
    setCouples(prev => prev.filter(c => c.id !== coupleId))
  }

  // Convert couples to calendar events
  const events: CalendarEvent[] = useMemo(() => {
    return filteredCouples
      .filter(c => c.wedding_date) // Only couples with wedding dates
      .map(couple => {
        // Parse date parts directly to avoid UTC-to-local timezone shift
        const [year, month, day] = couple.wedding_date!.split('-').map(Number)
        const weddingDate = new Date(year, month - 1, day)
        return {
          id: couple.share_link_id,
          title: couple.couple_names,
          start: weddingDate,
          end: weddingDate,
          resource: couple
        }
      })
  }, [filteredCouples])

  // Get unique venues for filter
  const venues = Array.from(new Set(couples.map(c => c.venue_name).filter(Boolean))) as string[]

  // Get years with weddings
  const years = Array.from(new Set(
    couples
      .filter(c => c.wedding_date)
      .map(c => new Date(c.wedding_date!).getFullYear())
  )).sort()

  // Add current year and next 2 years if not present
  const currentYear = new Date().getFullYear()
  for (let i = 0; i < 3; i++) {
    const year = currentYear + i
    if (!years.includes(year)) {
      years.push(year)
    }
  }
  years.sort()

  const handleNavigate = (newDate: Date) => {
    setCurrentDate(newDate)
    setSelectedYear(newDate.getFullYear())

    // Save to localStorage for next visit
    if (typeof window !== 'undefined') {
      localStorage.setItem('couplesCalendarLastDate', newDate.toISOString())
    }
  }

  const handleSelectEvent = (event: CalendarEvent) => {
    router.push(`/planners/couples/${event.id}`)
  }

  // Custom toolbar with month/year dropdowns
  const CustomToolbar = ({ label, onNavigate, onView, view }: any) => {
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()

    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]

    const handleMonthChange = (monthIndex: number) => {
      const newDate = new Date(currentYear, monthIndex, 1)
      setCurrentDate(newDate)
      onNavigate('DATE', newDate)
    }

    const handleYearChange = (year: number) => {
      const newDate = new Date(year, currentMonth, 1)
      setCurrentDate(newDate)
      setSelectedYear(year)
      onNavigate('DATE', newDate)
    }

    return (
      <>
        {/* Mobile: Compact 3-Row Layout */}
        <div className="lg:hidden space-y-2 mb-3">
          {/* Row 1: Navigation Buttons */}
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => onNavigate('TODAY')} className="px-3 py-1.5 bg-stone-50 hover:bg-stone-100 rounded-lg font-semibold text-xs transition-colors">
              Today
            </button>
            <button onClick={() => onNavigate('PREV')} className="px-3 py-1.5 bg-stone-50 hover:bg-stone-100 rounded-lg font-semibold text-xs transition-colors">
              Back
            </button>
            <button onClick={() => onNavigate('NEXT')} className="px-3 py-1.5 bg-stone-50 hover:bg-stone-100 rounded-lg font-semibold text-xs transition-colors">
              Next
            </button>
          </div>

          {/* Row 2: Month/Year Dropdowns */}
          <div className="flex items-center justify-center gap-2">
            <select value={currentMonth} onChange={(e) => handleMonthChange(parseInt(e.target.value))} className={`px-3 py-1.5 border rounded-lg text-xs font-medium focus:outline-none focus:ring-1 transition-all ${theme.border} ${theme.cardBackground} ${theme.textPrimary}`}>
              {months.map((month, index) => (<option key={month} value={index}>{month}</option>))}
            </select>
            <select value={currentYear} onChange={(e) => handleYearChange(parseInt(e.target.value))} className={`px-3 py-1.5 border rounded-lg text-xs font-medium focus:outline-none focus:ring-1 transition-all ${theme.border} ${theme.cardBackground} ${theme.textPrimary}`}>
              {years.map(year => (<option key={year} value={year}>{year}</option>))}
            </select>
          </div>

          {/* Row 3: View Buttons */}
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => onView('month')} className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${view === 'month' ? `${theme.primaryButton} text-white` : 'bg-stone-50 hover:bg-stone-100'}`}>
              Month
            </button>
            <button onClick={() => onView('week')} className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${view === 'week' ? `${theme.primaryButton} text-white` : 'bg-stone-50 hover:bg-stone-100'}`}>
              Week
            </button>
            <button onClick={() => onView('day')} className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${view === 'day' ? `${theme.primaryButton} text-white` : 'bg-stone-50 hover:bg-stone-100'}`}>
              Day
            </button>
          </div>
        </div>

        {/* Desktop: Original Layout */}
        <div className="hidden lg:flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => onNavigate('TODAY')} className="px-4 py-2 bg-stone-50 hover:bg-stone-100 rounded-lg font-semibold text-sm transition-colors">Today</button>
            <button onClick={() => onNavigate('PREV')} className="px-4 py-2 bg-stone-50 hover:bg-stone-100 rounded-lg font-semibold text-sm transition-colors">Back</button>
            <button onClick={() => onNavigate('NEXT')} className="px-4 py-2 bg-stone-50 hover:bg-stone-100 rounded-lg font-semibold text-sm transition-colors">Next</button>
          </div>
          <div className="flex items-center gap-2">
            <select value={currentMonth} onChange={(e) => handleMonthChange(parseInt(e.target.value))} className={`px-4 py-2 border rounded-xl text-sm font-medium focus:outline-none focus:ring-1 transition-all ${theme.border} ${theme.cardBackground} ${theme.textPrimary}`}>
              {months.map((month, index) => (<option key={month} value={index}>{month}</option>))}
            </select>
            <select value={currentYear} onChange={(e) => handleYearChange(parseInt(e.target.value))} className={`px-4 py-2 border rounded-xl text-sm font-medium focus:outline-none focus:ring-1 transition-all ${theme.border} ${theme.cardBackground} ${theme.textPrimary}`}>
              {years.map(year => (<option key={year} value={year}>{year}</option>))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onView('month')} className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${view === 'month' ? `${theme.primaryButton} text-white` : 'bg-stone-50 hover:bg-stone-100'}`}>Month</button>
            <button onClick={() => onView('week')} className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${view === 'week' ? `${theme.primaryButton} text-white` : 'bg-stone-50 hover:bg-stone-100'}`}>Week</button>
            <button onClick={() => onView('day')} className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${view === 'day' ? `${theme.primaryButton} text-white` : 'bg-stone-50 hover:bg-stone-100'}`}>Day</button>
          </div>
        </div>
      </>
    )
  }

  const eventStyleGetter = (event: CalendarEvent) => {
    return {
      style: {
        backgroundColor: '#1c1917',
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        border: 'none',
        display: 'block',
        fontSize: '0.875rem',
        fontWeight: '600',
        padding: '2px 6px'
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards - Theme Aware */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          icon={<Users className={`w-4 h-4 ${theme.textSecondary}`} />}
          label="Total Couples"
          value={stats.total}
          theme={theme}
        />

        <StatCard
          icon={<CalendarIcon className="w-4 h-4 text-emerald-600" />}
          iconBg="bg-emerald-50"
          label="Active This Week"
          value={stats.activeThisWeek}
          theme={theme}
        />

        <StatCard
          icon={<Clock className={`w-4 h-4 ${theme.textSecondary}`} />}
          label="Next 3 Months"
          value={stats.upcomingThreeMonths}
          theme={theme}
        />

        <StatCard
          icon={<Package className="w-4 h-4 text-emerald-600" />}
          iconBg="bg-emerald-50"
          label="With Vendors"
          value={stats.withVendors}
          theme={theme}
        />
      </div>

      {/* Filters and Controls */}
      <div className={`${theme.cardBackground} border ${theme.border} rounded-2xl p-4 md:p-6`}>
        {/* Mobile: Stacked Layout */}
        <div className="lg:hidden space-y-4">
          {/* Row 1: View Toggle + Search */}
          <div className="flex items-center gap-3">
            <div className="flex gap-1 bg-stone-50 rounded-lg p-1 flex-shrink-0">
              <button
                onClick={() => handleDisplayModeChange('calendar')}
                className={`flex items-center justify-center p-2 rounded-md transition-all ${
                  displayMode === 'calendar'
                    ? `${theme.cardBackground} ${theme.textPrimary} shadow-sm`
                    : `${theme.textSecondary} hover:${theme.textPrimary}`
                }`}
                title="Calendar view"
                aria-label="Calendar view"
              >
                <CalendarIcon size={18} />
              </button>
              <button
                onClick={() => handleDisplayModeChange('list')}
                className={`flex items-center justify-center p-2 rounded-md transition-all ${
                  displayMode === 'list'
                    ? `${theme.cardBackground} ${theme.textPrimary} shadow-sm`
                    : `${theme.textSecondary} hover:${theme.textPrimary}`
                }`}
                title="List view"
                aria-label="List view"
              >
                <List size={18} />
              </button>
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Search couples..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full pl-10 pr-10 py-2 border rounded-xl text-sm font-medium focus:outline-none focus:ring-1 transition-all ${theme.border} ${theme.textPrimary}`} />
              {searchQuery && (<button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" title="Clear search">✕</button>)}
            </div>
          </div>
          {searchQuery && (<div className="text-xs text-gray-600 -mt-2">Showing {filteredCouples.length} of {couples.length} couples</div>)}
          {/* Row 2: Year Filter */}
          <select value={selectedYear} onChange={(e) => { const year = parseInt(e.target.value); const newDate = new Date(year, currentDate.getMonth(), 1); setSelectedYear(year); setCurrentDate(newDate); if (typeof window !== 'undefined') localStorage.setItem('couplesCalendarLastDate', newDate.toISOString()); }} className={`w-full px-4 py-2 border rounded-xl text-sm font-medium ${theme.cardBackground} hover:bg-stone-50 transition-colors ${theme.border} ${theme.textPrimary}`}>
            {years.map(year => (<option key={year} value={year}>{year}</option>))}
          </select>
          {/* Row 3: Venue Filter */}
          {venues.length > 0 && (
            <SearchableMultiSelect options={venues.map(venue => ({ value: venue, label: venue }))} selectedValues={selectedVenue} onChange={handleVenueChange} placeholder="Filter by venue..." allLabel="All Venues" className="w-full" inlineOnMobile={true} />
          )}
          {/* Row 4: Add + Ask AI */}
          <div className="flex items-center gap-2">
            <button onClick={() => setShowManualInvite(true)} className={`flex items-center justify-center gap-2 px-3 py-2.5 ${theme.cardBackground} border ${theme.border} rounded-xl text-sm font-medium hover:bg-stone-50 transition-colors flex-1`}>
              <Plus className="w-4 h-4" /> Add
            </button>
            <button id="tour-ask-ksmt-couples-mobile" onClick={() => setShowAddModal(true)} className="flex items-center justify-center gap-2 px-3 py-2.5 bg-ksmt-crimson hover:bg-[#7a2520] text-white rounded-xl text-sm font-medium transition-colors flex-1">
              <Bot className="w-5 h-5" /> Ask AI
            </button>
          </div>
        </div>

        {/* Desktop: Original Horizontal Layout */}
        <div className="hidden lg:flex flex-wrap gap-2 lg:gap-4 items-center justify-between">
          {/* View Toggle */}
          <div className="flex gap-1 bg-stone-50 rounded-lg p-1">
            <button
              onClick={() => handleDisplayModeChange('calendar')}
              className={`flex items-center justify-center p-2 rounded-md transition-all ${
                displayMode === 'calendar'
                  ? `${theme.cardBackground} ${theme.textPrimary} shadow-sm`
                  : `${theme.textSecondary} hover:${theme.textPrimary}`
              }`}
              title="Calendar view"
              aria-label="Calendar view"
            >
              <CalendarIcon size={18} />
            </button>
            <button
              onClick={() => handleDisplayModeChange('list')}
              className={`flex items-center justify-center p-2 rounded-md transition-all ${
                displayMode === 'list'
                  ? `${theme.cardBackground} ${theme.textPrimary} shadow-sm`
                  : `${theme.textSecondary} hover:${theme.textPrimary}`
              }`}
              title="List view"
              aria-label="List view"
            >
              <List size={18} />
            </button>
          </div>

          <div className="flex gap-2 flex-wrap flex-1">
            <div className="min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" placeholder="Search couples..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full pl-10 pr-10 py-2 border rounded-xl text-sm font-medium focus:outline-none focus:ring-1 transition-all ${theme.border} ${theme.textPrimary}`} />
                {searchQuery && (<button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" title="Clear search">✕</button>)}
              </div>
              {searchQuery && (<div className="text-xs text-gray-600 mt-1">Showing {filteredCouples.length} of {couples.length} couples</div>)}
            </div>
            <select value={selectedYear} onChange={(e) => { const year = parseInt(e.target.value); const newDate = new Date(year, currentDate.getMonth(), 1); setSelectedYear(year); setCurrentDate(newDate); if (typeof window !== 'undefined') localStorage.setItem('couplesCalendarLastDate', newDate.toISOString()); }} className={`px-4 py-2 border rounded-xl text-sm font-medium ${theme.cardBackground} hover:bg-stone-50 transition-colors ${theme.border} ${theme.textPrimary}`}>
              {years.map(year => (<option key={year} value={year}>{year}</option>))}
            </select>
            {venues.length > 0 && (
              <SearchableMultiSelect options={venues.map(venue => ({ value: venue, label: venue }))} selectedValues={selectedVenue} onChange={handleVenueChange} placeholder="Filter by venue..." allLabel="All Venues" className="min-w-[160px]" />
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowManualInvite(true)} className={`flex items-center gap-2 px-6 py-2.5 ${theme.cardBackground} border ${theme.border} rounded-xl text-sm font-medium hover:bg-stone-50 transition-colors`}>
              <Plus className="w-4 h-4" />
              <span>Add Manually</span>
            </button>
            <button id="tour-ask-ksmt-couples" onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-6 py-2.5 bg-ksmt-crimson hover:bg-[#7a2520] text-white rounded-xl text-sm font-medium transition-colors">
              <Bot className="w-5 h-5" />
              <span>Ask AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Calendar or List View */}
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
        <div className={`${theme.cardBackground} p-12 rounded-xl border ${theme.border} text-center text-gray-500`}>
          Loading...
        </div>
      ) : displayMode === 'list' ? (
        /* List View */
        filteredCouples.length === 0 ? (
          <div className={`${theme.cardBackground} p-12 rounded-xl border ${theme.border}`}>
            <List className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                {couples.length === 0
                  ? "No couples added yet"
                  : "No couples match your filters"}
              </p>
            </div>
          </div>
        ) : (
          <div className={`${theme.cardBackground} rounded-2xl ${theme.border} ${theme.borderWidth} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr>
                    <th className={`px-4 py-3 text-left text-xs font-semibold ${theme.textSecondary} uppercase`}>
                      Couple Names
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold ${theme.textSecondary} uppercase`}>
                      Contact
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold ${theme.textSecondary} uppercase`}>
                      Wedding Date
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold ${theme.textSecondary} uppercase`}>
                      Venue
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold ${theme.textSecondary} uppercase`}>
                      Last Activity
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold ${theme.textSecondary} uppercase`}>
                      Vendors
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold ${theme.textSecondary} uppercase`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {filteredCouples.map((couple) => (
                    <CoupleTableRow
                      key={couple.id}
                      couple={couple}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onRefresh={fetchCouples}
                      sharedVendorsCounts={vendorCounts}
                      tourId={
                        couple.couple_names?.toLowerCase().includes('bella') &&
                        couple.couple_names?.toLowerCase().includes('edward')
                          ? 'tour-couple-bella'
                          : undefined
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : events.length === 0 ? (
        <div className={`${theme.cardBackground} p-12 rounded-xl border ${theme.border}`}>
          <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              {couples.length === 0
                ? "No couples added yet"
                : filteredCouples.length > 0
                ? `Found ${filteredCouples.length} couple(s) ${filteredCouples.every(c => !c.wedding_date) ? "but they don't have wedding dates set" : "in other months"}`
                : "No couples match your filters"}
            </p>
            {filteredCouples.length > 0 && (
              <div className="mt-6 text-left max-w-md mx-auto">
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  {filteredCouples.every(c => !c.wedding_date) ? "Couples without wedding dates:" : "Found couples:"}
                </p>
                <div className="space-y-2">
                  {filteredCouples.map(couple => (
                    <div
                      key={couple.id}
                      className={`p-3 bg-gray-50 rounded-lg border border-gray-200 hover:${theme.border} cursor-pointer transition-colors`}
                      onClick={() => {
                        if (couple.wedding_date) {
                          const weddingDate = new Date(couple.wedding_date)
                          setCurrentDate(weddingDate)
                          setSelectedYear(weddingDate.getFullYear())
                        } else {
                          router.push(`/planners/couples/${couple.share_link_id}`)
                        }
                      }}
                    >
                      <div className="font-medium text-gray-900">{couple.couple_names}</div>
                      {couple.couple_email && (
                        <div className="text-sm text-gray-600">{couple.couple_email}</div>
                      )}
                      {couple.wedding_date ? (
                        <div className={`text-xs ${theme.textPrimary} mt-1`}>
                          {(([y,m,d]) => format(new Date(y, m-1, d), 'MMMM d, yyyy'))(couple.wedding_date.split('-').map(Number))} - Click to view
                        </div>
                      ) : (
                        <div className={`text-xs ${theme.textPrimary} mt-1`}>Click to add wedding date</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className={`${theme.cardBackground} p-4 rounded-xl border ${theme.border}`}>
          <style jsx global>{`
            .rbc-calendar {
              font-family: inherit;
            }
            .rbc-header {
              padding: 12px 4px;
              font-weight: 600;
              color: #374151;
              border-bottom: 1px solid #e5e7eb;
              font-size: 0.875rem;
            }
            .rbc-date-cell {
              font-size: 0.875rem;
              font-family: Inter, system-ui, -apple-system, sans-serif;
              font-weight: 400;
            }
            .rbc-button-link {
              font-size: 0.875rem;
              font-family: Inter, system-ui, -apple-system, sans-serif;
              font-weight: 400;
            }
            @media (max-width: 768px) {
              .rbc-month-view .rbc-day-bg {
                min-height: 100px;
              }
              .rbc-header {
                padding: 14px 6px;
              }
              .rbc-date-cell {
                padding: 10px 6px;
              }
            }
            .rbc-today {
              background-color: #fef2f2;
            }
            .rbc-off-range-bg {
              background-color: #f9fafb;
            }
            .rbc-event {
              padding: 2px 6px;
              font-size: 0.875rem;
            }
            .rbc-toolbar {
              padding: 12px 0;
              margin-bottom: 16px;
              flex-wrap: wrap;
              gap: 12px;
            }
            .rbc-toolbar button {
              padding: 8px 16px;
              border-radius: 8px;
              border: 1px solid #e5e7eb;
              background: white;
              font-weight: 600;
              color: #374151;
            }
            .rbc-toolbar button:hover {
              border-color: #1c1917;
              background-color: #f5f5f4;
            }
            .rbc-toolbar button.rbc-active {
              background-color: #1c1917;
              border-color: #1c1917;
              color: white;
            }
            .rbc-month-view {
              border: 1px solid #e5e7eb;
              border-radius: 12px;
              overflow: visible;
            }
            .rbc-day-bg {
              border-left: 1px solid #e5e7eb;
            }
            .rbc-month-row {
              border-top: 1px solid #e5e7eb;
            }
            /* Hide time gutter in week/day views */
            .rbc-time-gutter {
              display: none;
            }
            .rbc-time-content {
              border-left: none !important;
            }
            .rbc-time-header-gutter {
              display: none;
            }
            /* Make week/day view events full width */
            .rbc-time-slot {
              min-height: 40px;
            }
            .rbc-day-slot .rbc-events-container {
              margin: 0;
            }
            .rbc-time-column {
              padding-left: 0 !important;
            }
            /* Adjust week/day header */
            .rbc-time-header-content {
              border-left: none;
            }
            /* Ensure overflow popup renders above calendar */
            .rbc-overlay {
              z-index: 10;
              position: absolute;
              background: white;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
              padding: 8px;
            }
            .rbc-overlay-header {
              font-size: 0.75rem;
              font-weight: 600;
              color: #6b7280;
              margin-bottom: 6px;
            }
            .rbc-event {
              cursor: pointer;
            }
          `}</style>

          <BigCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 600 }}
            view={view}
            onView={setView}
            date={currentDate}
            onNavigate={handleNavigate}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            views={['month', 'week', 'day']}
            components={{
              toolbar: CustomToolbar
            }}
            formats={{
              timeGutterFormat: () => '',
              eventTimeRangeFormat: () => '',
              agendaTimeRangeFormat: () => '',
              dayHeaderFormat: (date) => format(date, 'EEEE, MMM d'),
              dayRangeHeaderFormat: ({ start, end }) =>
                `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
            }}
            popup
          />
        </div>
      )}

      {/* Manual Invite Modal */}
      {showManualInvite && (
        <InviteCoupleModal
          isOpen={showManualInvite}
          onClose={() => setShowManualInvite(false)}
          onSuccess={() => {
            setShowManualInvite(false)
            fetchCouples()
          }}
        />
      )}

      {/* Edit Couple Modal */}
      {showEditModal && editingCouple && (
        <InviteCoupleModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setEditingCouple(null)
          }}
          onSuccess={() => {
            setShowEditModal(false)
            setEditingCouple(null)
            fetchCouples()
          }}
          coupleToEdit={editingCouple}
        />
      )}

      {/* Ask AI Modal */}
      {showAddModal && (
        <PlannerAskAICoupleModal
          existingCouples={couples}
          onClose={() => { setShowAddModal(false); setChatInitialOperation(undefined) }}
          onSuccess={() => { setShowAddModal(false); setChatInitialOperation(undefined); fetchCouples() }}
          initialOperation={chatInitialOperation}
        />
      )}
    </div>
  )
}
