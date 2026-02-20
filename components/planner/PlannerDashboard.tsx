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
import { useDemoTour } from '@/hooks/useDemoTour'
import { useThemeStyles } from '@/hooks/useThemeStyles'

export default function PlannerDashboard() {
  const theme = useThemeStyles()
  const router = useRouter()
  const [currentView, setCurrentView] = useState<'couples' | 'vendors' | 'settings'>('couples')
  const [firstCoupleId, setFirstCoupleId] = useState<string | null>(null)
  const setDisplayModeRef = useRef<((mode: 'calendar' | 'list') => void) | null>(null)

  // Tour state lifted to dashboard level
  const {
    isOpen: tourIsOpen,
    currentStep: tourStep,
    advanceStep,
    goBack,
    dismissTour,
    startTour,
  } = useDemoTour('bridezilla_demo_tour_planner', PLANNER_TOUR_STEPS.length)

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

  // Fetch Bella & Edward couple ID for tour navigation
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
          const bellaEdward = data.data.find((c: any) =>
            c.couple_names?.toLowerCase().includes('bella') &&
            c.couple_names?.toLowerCase().includes('edward')
          )
          setFirstCoupleId(bellaEdward?.share_link_id || data.data[0].share_link_id)
        }
      } catch {}
    }
    fetchFirstCouple()
  }, [])

  // Ensure the right page/view for a given tour step
  const ensureStepView = useCallback((stepIndex: number) => {
    switch (stepIndex) {
      case 0: // Welcome
      case 1: // Couples Database (calendar view)
        handleViewChange('couples')
        break
      case 2: // Inside a Couple's File (needs list view)
      case 6: // All Set
        handleViewChange('couples')
        setDisplayModeRef.current?.('list')
        break
      case 3: // Shared Portal (couple detail page)
        if (firstCoupleId) {
          router.push(`/planners/couples/${firstCoupleId}`)
        }
        break
      case 4: // Vendor Library
      case 5: // Add Vendors with AI
        handleViewChange('vendors')
        break
    }
  }, [firstCoupleId, router])

  // Custom back handler with page navigation
  const handleTourBack = useCallback(() => {
    const targetStep = tourStep - 1
    if (targetStep < 0) return
    goBack()
    ensureStepView(targetStep)
  }, [tourStep, goBack, ensureStepView])

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
        // Switch to list view for "Your Couples Database"
        handleViewChange('couples')
        setDisplayModeRef.current?.('list')
        break
      case 2:
        // Switch to list view so Bella & Edward row is visible
        handleViewChange('couples')
        setDisplayModeRef.current?.('list')
        break
      case 6:
        handleViewChange('couples')
        break
    }
  }, [])

  // Show dashboard
  return (
    <div className={`min-h-screen ${theme.pageBackground} relative`}>
      <AnimatedHearts />
      <PlannerNavigation
        currentView={currentView}
        onViewChange={handleViewChange}
        onStartTour={startTour}
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
                  </h2>
                  <p className={`${theme.textOnPageSecondary} font-body`}>
                    {currentView === 'couples' && 'Manage your wedding couples and their celebration details.'}
                    {currentView === 'vendors' && 'Your curated collection of trusted wedding vendors.'}
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
        isOpen={tourIsOpen}
        currentStep={tourStep}
        onAdvance={advanceStep}
        onBack={handleTourBack}
        onDismiss={dismissTour}
        onStepActivate={handlePlannerStepActivate}
      />
    </div>
  )
}
