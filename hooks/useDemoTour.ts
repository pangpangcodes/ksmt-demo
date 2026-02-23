'use client'

import { useState, useEffect, useCallback } from 'react'

interface TourState {
  completedUpTo: number   // -1 = never started, 0 = 1 step done, etc.
  allCompleted: boolean
}

const isDev = process.env.NODE_ENV === 'development'

function readState(storageKey: string): TourState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return null
    return JSON.parse(raw) as TourState
  } catch {
    return null
  }
}

function writeState(storageKey: string, state: TourState) {
  if (typeof window === 'undefined') return
  localStorage.setItem(storageKey, JSON.stringify(state))
}

export function useDemoTour(storageKey: string, totalSteps: number) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  // Auto-show logic on mount
  useEffect(() => {
    // Never auto-open on mobile — tour can still be launched manually via the Tour button
    if (typeof window !== 'undefined' && window.innerWidth < 768) return

    const saved = readState(storageKey)

    if (isDev) {
      // Dev mode: always show. Read saved position for cross-page
      // continuity (e.g. PlannerDashboard -> CoupleDetail), but
      // ignore allCompleted so the tour always appears.
      if (saved && saved.completedUpTo >= 0 && !saved.allCompleted) {
        const resumeAt = saved.completedUpTo + 1
        if (resumeAt < totalSteps) {
          setCurrentStep(resumeAt)
        }
      } else {
        setCurrentStep(0)
      }
      setIsOpen(true)
      return
    }

    // Production: full localStorage persistence and resume logic
    if (!saved) {
      // First visit: show at step 0, create key
      writeState(storageKey, { completedUpTo: -1, allCompleted: false })
      setCurrentStep(0)
      setIsOpen(true)
      return
    }

    if (saved.allCompleted) {
      // Tour already completed: don't show
      return
    }

    if (saved.completedUpTo >= 1) {
      // 2+ steps done: resume at next step
      const resumeAt = saved.completedUpTo + 1
      if (resumeAt < totalSteps) {
        setCurrentStep(resumeAt)
        setIsOpen(true)
      }
      return
    }

    // 0-1 steps done (completedUpTo < 1): don't auto-show
  }, [storageKey, totalSteps])

  const advanceStep = useCallback(() => {
    const nextStep = currentStep + 1
    if (nextStep >= totalSteps) {
      // Tour complete
      writeState(storageKey, { completedUpTo: currentStep, allCompleted: true })
      setIsOpen(false)
    } else {
      writeState(storageKey, { completedUpTo: currentStep, allCompleted: false })
      setCurrentStep(nextStep)
    }
  }, [currentStep, totalSteps, storageKey])

  const goBack = useCallback(() => {
    if (currentStep <= 0) return
    const prevStep = currentStep - 1
    writeState(storageKey, { completedUpTo: Math.max(prevStep - 1, -1), allCompleted: false })
    setCurrentStep(prevStep)
  }, [currentStep, storageKey])

  const dismissTour = useCallback(() => {
    setIsOpen(false)
  }, [])

  const startTour = useCallback(() => {
    writeState(storageKey, { completedUpTo: -1, allCompleted: false })
    setCurrentStep(0)
    setIsOpen(true)
  }, [storageKey])

  const resetTour = useCallback(() => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(storageKey)
    setCurrentStep(0)
    setIsOpen(false)
  }, [storageKey])

  return {
    isOpen,
    currentStep,
    advanceStep,
    goBack,
    dismissTour,
    startTour,
    resetTour,
  }
}
