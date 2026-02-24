'use client'

import Image from 'next/image'
import { useThemeStyles } from '@/hooks/useThemeStyles'

interface CouplesHeaderProps {
  onLogout?: () => void
  currentView?: 'dashboard' | 'rsvp' | 'vendors' | 'settings'
}

export default function CouplesHeader({ onLogout, currentView = 'dashboard' }: CouplesHeaderProps) {
  const theme = useThemeStyles()

  return (
    <div className="sticky top-0 z-50 bg-stone-900 shadow-lg">
      <div className="mx-auto px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 flex-shrink-0">
                <Image
                  src="/images/ksmt-logo-simple.svg"
                  alt="ksmt"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <span className="font-heading text-xl text-white uppercase tracking-wide">Admin</span>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
