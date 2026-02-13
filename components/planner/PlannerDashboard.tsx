'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import AnimatedHearts from '@/components/AnimatedHearts'
import PlannerNavigation from './PlannerNavigation'
import CouplesCalendarView from './CouplesCalendarView'
import VendorLibraryTab from './VendorLibraryTab'
import SettingsTab from './SettingsTab'
import DemoControlPanel from '@/components/shared/DemoControlPanel'
import { PLANNER_TOUR_STEPS } from '@/lib/demo-tour-steps'
import { useThemeStyles } from '@/hooks/useThemeStyles'

export default function PlannerDashboard() {
  const theme = useThemeStyles()
  const router = useRouter()
  const [currentView, setCurrentView] = useState<'couples' | 'vendors' | 'settings'>('couples')
  const [firstCoupleId, setFirstCoupleId] = useState<string | null>(null)
  const setDisplayModeRef = useRef<((mode: 'calendar' | 'list') => void) | null>(null)

  // Listen for view changes from URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const view = params.get('view')
      if (view === 'vendors') {
        setCurrentView('vendors')
      } else if (view === 'settings') {
        setCurrentView('settings')
      } else {
        setCurrentView('couples')
      }

      const handleUrlChange = () => {
        const params = new URLSearchParams(window.location.search)
        const view = params.get('view')
        if (view === 'vendors') {
          setCurrentView('vendors')
        } else if (view === 'settings') {
          setCurrentView('settings')
        } else {
          setCurrentView('couples')
        }
      }

      window.addEventListener('popstate', handleUrlChange)
      return () => window.removeEventListener('popstate', handleUrlChange)
    }
  }, [])


  // Fetch first couple ID for tour navigation
  useEffect(() => {
    const fetchFirstCouple = async () => {
      try {
        const token = sessionStorage.getItem('planner_auth')
        if (!token) return
        const res = await fetch('/api/planner/couples', {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.success && data.data?.length > 0) {
          // Find Bella & Edward specifically for the tour, fall back to first couple
          const bellaEdward = data.data.find((c: any) =>
            c.couple_names?.toLowerCase().includes('bella') &&
            c.couple_names?.toLowerCase().includes('edward')
          )
          setFirstCoupleId(bellaEdward?.id || data.data[0].id)
        }
      } catch {
        // Silently fail — tour will fall back
      }
    }
    fetchFirstCouple()
  }, [])

  const handleViewChange = (view: 'couples' | 'vendors' | 'settings') => {
    setCurrentView(view)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('view', view)
      window.history.pushState({}, '', url)
    }
  }

  const handlePlannerStepActivate = useCallback((stepIndex: number) => {
    switch (stepIndex) {
      case 1:
        handleViewChange('couples')
        setDisplayModeRef.current?.('calendar')
        setTimeout(() => setDisplayModeRef.current?.('list'), 1500)
        break
      case 2:
        if (firstCoupleId) {
          router.push(`/planners/couples/${firstCoupleId}`)
        } else {
          handleViewChange('couples')
        }
        break
      case 4:
        handleViewChange('vendors')
        break
      case 5:
        handleViewChange('couples')
        break
    }
  }, [firstCoupleId, router])

  // Show dashboard
  return (
    <div className={`min-h-screen ${theme.pageBackground} relative`}>
      <AnimatedHearts />
      <PlannerNavigation
        currentView={currentView}
        onViewChange={handleViewChange}
      />

      <div className="relative z-10 pb-12">
        <section className="py-12 font-body">
          <div className="mx-auto px-6">
            <div className="max-w-7xl mx-auto space-y-10">
              {/* Page Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h2 className={`text-3xl md:text-4xl font-display mb-2 ${theme.textOnPagePrimary}`}>
                    {currentView === 'couples' && 'Couples'}
                    {currentView === 'vendors' && 'Vendors'}
                    {currentView === 'settings' && 'Settings'}
                  </h2>
                  <p className={`${theme.textOnPageSecondary} font-body`}>
                    {currentView === 'couples' && 'Manage your wedding couples and their celebration details.'}
                    {currentView === 'vendors' && 'Your curated collection of trusted wedding vendors.'}
                    {currentView === 'settings' && 'Configure your planner workspace preferences.'}
                  </p>
                </div>
              </div>

              {/* Content Views */}
              {currentView === 'couples' && <CouplesCalendarView setDisplayModeRef={setDisplayModeRef} />}
              {currentView === 'vendors' && <VendorLibraryTab />}
              {currentView === 'settings' && <SettingsTab />}
            </div>
          </div>
        </section>
      </div>

      <DemoControlPanel
        steps={PLANNER_TOUR_STEPS}
        storageKey="bridezilla_demo_tour_planner"
        onStepActivate={handlePlannerStepActivate}
      />
    </div>
  )
}
