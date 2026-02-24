'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Menu, X, ExternalLink, Compass } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useThemeStyles } from '@/hooks/useThemeStyles'

interface CouplesNavigationProps {
  currentView: 'dashboard' | 'rsvp' | 'vendors' | 'settings'
  onViewChange: (view: 'dashboard' | 'rsvp' | 'vendors' | 'settings') => void
  onLogout: () => void
  onStartTour?: () => void
}

export default function CouplesNavigation({ currentView, onViewChange, onLogout, onStartTour }: CouplesNavigationProps) {
  const { theme: currentTheme } = useTheme()
  const theme = useThemeStyles()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleViewChange = (view: 'dashboard' | 'rsvp' | 'vendors' | 'settings') => {
    onViewChange(view)
    setMobileMenuOpen(false)
  }

  const logoSrc = '/ksmt-logo.svg'

  return (
    <nav className="bg-white sticky top-0 z-40 border-b border-stone-200">
      <div className="px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 md:gap-3">
          <Image
            src={logoSrc}
            alt="ksmt"
            width={32}
            height={32}
            className="object-contain md:w-[40px] md:h-[40px]"
          />
          <div className="flex items-baseline gap-2">
            <span className={`font-bodoni text-base sm:text-xl md:text-2xl lg:text-3xl ${theme.textPrimary}`}>
              ksmt
            </span>
            <span className="text-ksmt-slate opacity-30">|</span>
            <span className="font-montserrat text-[7px] sm:text-[9px] md:text-[10px] tracking-[0.2em] uppercase text-ksmt-slate opacity-50">
              Couples
            </span>
          </div>
        </a>

        <div className="flex items-center gap-3 md:gap-5">
          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-5 text-sm font-medium">
            {onStartTour && (
              <button
                onClick={onStartTour}
                className={`flex items-center gap-1.5 transition-colors ${theme.navInactive} ${theme.navHover}`}
              >
                <Compass className="w-4 h-4" />
                Tour
              </button>
            )}
            <a
              href="/couples?view=dashboard"
              onClick={(e) => {
                e.preventDefault()
                onViewChange('dashboard')
              }}
              className={`transition-colors ${
                currentView === 'dashboard'
                  ? theme.navActive
                  : `${theme.navInactive} ${theme.navHover}`
              }`}
            >
              Dashboard
            </a>
            <a
              id="tour-nav-rsvp"
              href="/couples?view=rsvp"
              onClick={(e) => {
                e.preventDefault()
                onViewChange('rsvp')
              }}
              className={`transition-colors ${
                currentView === 'rsvp'
                  ? theme.navActive
                  : `${theme.navInactive} ${theme.navHover}`
              }`}
            >
              RSVP Tracking
            </a>
            <a
              id="tour-nav-vendors-couples"
              href="/couples?view=vendors"
              onClick={(e) => {
                e.preventDefault()
                onViewChange('vendors')
              }}
              className={`transition-colors ${
                currentView === 'vendors'
                  ? theme.navActive
                  : `${theme.navInactive} ${theme.navHover}`
              }`}
            >
              Vendor Management
            </a>
            <a
              href="/couples?view=settings"
              onClick={(e) => {
                e.preventDefault()
                onViewChange('settings')
              }}
              className={`transition-colors ${
                currentView === 'settings'
                  ? theme.navActive
                  : `${theme.navInactive} ${theme.navHover}`
              }`}
            >
              Settings
            </a>
            <a
              id="tour-nav-view-website"
              href="/demo"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1.5 text-sm font-medium ${theme.textSecondary} hover:${theme.textPrimary} transition-colors`}
            >
              View Website
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className={`hidden md:block px-5 py-2.5 rounded-xl ${theme.primaryButton} ${theme.primaryButtonHover} ${theme.textOnPrimary} text-sm font-medium transition-colors`}
          >
            Logout
          </button>

          {/* Mobile Menu Button */}
          <button
            id="tour-mobile-menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden p-2 ${theme.textSecondary} hover:${theme.textPrimary} transition-colors`}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-white">
          <div className="px-4 py-2 space-y-1">
            {onStartTour && (
              <button
                onClick={() => {
                  onStartTour()
                  setMobileMenuOpen(false)
                }}
                className={`flex items-center gap-2 w-full text-left px-4 py-3 rounded-lg text-sm font-medium ${theme.textSecondary} hover:bg-stone-50 transition-colors`}
              >
                <Compass className="w-4 h-4" />
                Tour
              </button>
            )}
            <a
              href="/couples?view=dashboard"
              onClick={(e) => {
                e.preventDefault()
                handleViewChange('dashboard')
              }}
              className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'dashboard'
                  ? `bg-stone-100 ${theme.navActive}`
                  : `${theme.textSecondary} hover:bg-stone-50`
              }`}
            >
              Dashboard
            </a>
            <a
              id="tour-nav-rsvp-mobile"
              href="/couples?view=rsvp"
              onClick={(e) => {
                e.preventDefault()
                handleViewChange('rsvp')
              }}
              className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'rsvp'
                  ? `bg-stone-100 ${theme.navActive}`
                  : `${theme.textSecondary} hover:bg-stone-50`
              }`}
            >
              RSVP Tracking
            </a>
            <a
              id="tour-nav-vendors-couples-mobile"
              href="/couples?view=vendors"
              onClick={(e) => {
                e.preventDefault()
                handleViewChange('vendors')
              }}
              className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'vendors'
                  ? `bg-stone-100 ${theme.navActive}`
                  : `${theme.textSecondary} hover:bg-stone-50`
              }`}
            >
              Vendor Management
            </a>
            <a
              href="/couples?view=settings"
              onClick={(e) => {
                e.preventDefault()
                handleViewChange('settings')
              }}
              className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'settings'
                  ? `bg-stone-100 ${theme.navActive}`
                  : `${theme.textSecondary} hover:bg-stone-50`
              }`}
            >
              Settings
            </a>
            <a
              id="tour-nav-view-website-mobile"
              href="/demo"
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium ${theme.textSecondary} hover:bg-stone-50 transition-colors`}
            >
              View Website
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={() => {
                onLogout()
                setMobileMenuOpen(false)
              }}
              className={`w-full text-left px-4 py-3 rounded-lg ${theme.primaryButton} ${theme.primaryButtonHover} ${theme.textOnPrimary} text-sm font-medium transition-colors`}
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
