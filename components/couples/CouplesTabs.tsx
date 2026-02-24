'use client'

import { Users, Briefcase } from 'lucide-react'
import { useThemeStyles } from '@/hooks/useThemeStyles'

export type CouplesTab = 'rsvp' | 'vendors'

interface CouplesTabsProps {
  activeTab: CouplesTab
  onTabChange: (tab: CouplesTab) => void
}

export default function CouplesTabs({ activeTab, onTabChange }: CouplesTabsProps) {
  const theme = useThemeStyles()

  const tabs = [
    { id: 'rsvp' as CouplesTab, label: 'RSVP Tracking', icon: Users },
    { id: 'vendors' as CouplesTab, label: 'Vendor Management', icon: Briefcase },
  ]

  return (
    <div className={`${theme.cardBackground} rounded-xl shadow mb-6 sticky top-20 z-10 border ${theme.border}`}>
      <div className={`flex border-b ${theme.border}`}>
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-semibold transition-colors ${
                isActive
                  ? `${theme.primaryButton} ${theme.textOnPrimary} border-b-2`
                  : `${theme.cardBackground} ${theme.textSecondary} hover:bg-stone-50`
              }`}
              style={isActive ? { borderBottomColor: theme.primaryColor } : {}}
            >
              <Icon className="w-5 h-5" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
