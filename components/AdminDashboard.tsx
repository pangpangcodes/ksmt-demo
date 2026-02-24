'use client'

import { useState, useEffect, useCallback } from 'react'
import AnimatedHearts from './AnimatedHearts'
import AdminNavigation from './admin/AdminNavigation'
import DashboardPage from './admin/DashboardPage'
import RSVPPage from './admin/RSVPPage'
import VendorsPage from './admin/VendorsPage'
import SettingsPage from './admin/SettingsPage'
import DemoControlPanel from '@/components/shared/DemoControlPanel'
import { COUPLES_TOUR_STEPS } from '@/lib/demo-tour-steps'
import { useDemoTour } from '@/hooks/useDemoTour'
import { useThemeStyles } from '@/hooks/useThemeStyles'

type AdminView = 'dashboard' | 'rsvp' | 'vendors' | 'settings'

function parseView(search: string): AdminView {
  const view = new URLSearchParams(search).get('view')
  return view === 'vendors' ? 'vendors' :
    view === 'rsvp' ? 'rsvp' :
    view === 'settings' ? 'settings' :
    'dashboard'
}

export default function AdminDashboard() {
  const [currentView, setCurrentView] = useState<AdminView>(() =>
    typeof window !== 'undefined' ? parseView(window.location.search) : 'dashboard'
  )
  const theme = useThemeStyles()

  const {
    isOpen: tourIsOpen,
    currentStep: tourStep,
    advanceStep,
    goBack,
    dismissTour,
    startTour,
  } = useDemoTour('ksmt_demo_tour_couples', COUPLES_TOUR_STEPS.length)

  useEffect(() => {
    const handleUrlChange = () => {
      setCurrentView(parseView(window.location.search))
    }

    window.addEventListener('popstate', handleUrlChange)
    return () => window.removeEventListener('popstate', handleUrlChange)
  }, [])

  const handleLogout = () => {
    // No-op for demo - just redirect to home
    window.location.href = '/'
  }

  const handleViewChange = (view: 'dashboard' | 'rsvp' | 'vendors' | 'settings') => {
    setCurrentView(view)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('view', view)
      window.history.pushState({}, '', url)
    }
  }

  // Ensure the right view for a given tour step
  const ensureStepView = useCallback((stepIndex: number) => {
    switch (stepIndex) {
      case 0: // Welcome
      case 1: // Your Dashboard
        handleViewChange('dashboard')
        break
      case 2: // RSVP Tracking (nav highlight)
        handleViewChange('dashboard')
        break
      case 3: // Your Vendor Team (nav highlight)
        handleViewChange('dashboard')
        break
      case 4: // Add Vendors with AI
        handleViewChange('vendors')
        break
      case 5: // All Set
        handleViewChange('dashboard')
        break
    }
  }, [])

  // Custom back handler with page navigation
  const handleTourBack = useCallback(() => {
    const targetStep = tourStep - 1
    if (targetStep < 0) return
    goBack()
    ensureStepView(targetStep)
  }, [tourStep, goBack, ensureStepView])

  const handleCouplesStepActivate = useCallback((stepIndex: number) => {
    switch (stepIndex) {
      case 1:
        handleViewChange('dashboard')
        break
      case 2:
        // RSVP nav highlight - stay on dashboard so nav is visible
        handleViewChange('dashboard')
        break
      case 3:
        // Vendor nav highlight - stay on dashboard so nav is visible
        handleViewChange('dashboard')
        break
      case 4:
        handleViewChange('vendors')
        break
      case 5:
        handleViewChange('dashboard')
        break
    }
  }, [])

  return (
    <div className={`min-h-screen ${theme.pageBackground} relative`}>
      <AnimatedHearts />
      <AdminNavigation
        currentView={currentView}
        onViewChange={handleViewChange}
        onLogout={handleLogout}
        onStartTour={startTour}
      />

      <div className="relative pb-12">
        <section className="py-12 font-body">
          <div className="mx-auto px-6">
            <div className="max-w-7xl mx-auto space-y-10">
              {/* Page Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h2 className={`text-3xl md:text-4xl font-display mb-2 ${theme.textPrimary}`}>
                    {currentView === 'dashboard' && 'Dashboard'}
                    {currentView === 'rsvp' && 'RSVP Tracking'}
                    {currentView === 'vendors' && 'Vendor Management'}
                    {currentView === 'settings' && 'Settings'}
                  </h2>
                  <p className={`${theme.textSecondary} font-body`}>
                    {currentView === 'dashboard' && 'Overview of your wedding planning progress.'}
                    {currentView === 'rsvp' && 'Manage guest responses and attendance.'}
                    {currentView === 'vendors' && 'Track vendors, contracts, and payments.'}
                    {currentView === 'settings' && 'Configure your budget and currency preferences.'}
                  </p>
                </div>
              </div>

              {/* Content Views */}
              {currentView === 'dashboard' && <DashboardPage />}
              {currentView === 'rsvp' && <RSVPPage />}
              {currentView === 'vendors' && <VendorsPage />}
              {currentView === 'settings' && <SettingsPage />}
            </div>
          </div>
        </section>
      </div>

      <DemoControlPanel
        steps={COUPLES_TOUR_STEPS}
        storageKey="ksmt_demo_tour_couples"
        isOpen={tourIsOpen}
        currentStep={tourStep}
        onAdvance={advanceStep}
        onBack={handleTourBack}
        onDismiss={dismissTour}
        onStepActivate={handleCouplesStepActivate}
      />
    </div>
  )
}
