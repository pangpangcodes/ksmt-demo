'use client'

import { use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import CoupleDetail from '@/components/planner/CoupleDetail'
import PlannerNavigation from '@/components/planner/PlannerNavigation'
import AnimatedHearts from '@/components/AnimatedHearts'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { useThemeStyles } from '@/hooks/useThemeStyles'

function CoupleDetailContent({ id }: { id: string }) {
  const router = useRouter()
  const theme = useThemeStyles()

  useEffect(() => {
    // Disable browser scroll restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    // Scroll to top immediately
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })

    // Also scroll after render to override any browser restoration
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }, 10)

    return () => clearTimeout(timer)
  }, [id])

  const handleViewChange = (view: 'couples' | 'vendors' | 'settings') => {
    router.push(`/planners?view=${view}`)
  }

  return (
    <>
      <PlannerNavigation
        currentView="couples"
        onViewChange={handleViewChange}
      />
      <main className={`${theme.pageBackground} relative min-h-screen overflow-x-hidden`}>
        <AnimatedHearts />
        <div className="relative z-10">
          <CoupleDetail coupleId={id} />
        </div>
      </main>
    </>
  )
}

export default function CoupleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  return (
    <ThemeProvider>
      <CoupleDetailContent id={id} />
    </ThemeProvider>
  )
}
