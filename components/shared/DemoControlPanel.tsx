'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, ArrowRight, ArrowLeft, ArrowDown, ArrowUp, CheckCircle2, ChevronLeft } from 'lucide-react'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import type { DemoStep } from '@/lib/demo-tour-steps'

interface DemoControlPanelProps {
  steps: DemoStep[]
  storageKey: string
  isOpen: boolean
  currentStep: number
  onAdvance: () => void
  onBack: () => void
  onDismiss: () => void
  onStepActivate?: (stepIndex: number) => void
}

/* ── Arrow pill badge ── */
function TourArrow({ direction }: { direction: 'left' | 'right' | 'up' | 'down' }) {
  const theme = useThemeStyles()
  const animClass =
    direction === 'up'
      ? 'animate-nudge-up'
      : direction === 'down'
        ? 'animate-nudge-down'
        : direction === 'left'
          ? 'animate-nudge-left'
          : 'animate-nudge-right'

  const Icon =
    direction === 'up' ? ArrowUp : direction === 'down' ? ArrowDown : direction === 'left' ? ArrowLeft : ArrowRight

  return (
    <div className={animClass}>
      <div className={`${theme.primaryButton} ${theme.textOnPrimary} rounded-full p-2.5 shadow-lg border-2 border-white/90`}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
    </div>
  )
}

/* ── Spotlight overlay with cutout ── */
function TourSpotlight({
  targetRect,
  arrowDirection,
}: {
  targetRect: DOMRect
  arrowDirection: 'left' | 'right' | 'up' | 'down'
}) {
  const padding = 8
  const radius = 10

  const cutoutTop = targetRect.top - padding
  const cutoutLeft = targetRect.left - padding
  const cutoutWidth = targetRect.width + padding * 2
  const cutoutHeight = targetRect.height + padding * 2

  // Position the arrow relative to the cutout (viewport-relative, since fixed)
  let arrowStyle: React.CSSProperties = {}
  if (arrowDirection === 'right') {
    arrowStyle = {
      position: 'fixed',
      top: cutoutTop + cutoutHeight / 2 - 22,
      left: cutoutLeft - 56,
    }
  } else if (arrowDirection === 'left') {
    arrowStyle = {
      position: 'fixed',
      top: cutoutTop + cutoutHeight / 2 - 22,
      left: cutoutLeft + cutoutWidth + 12,
    }
  } else if (arrowDirection === 'up') {
    // Arrow sits below the element, pointing up
    arrowStyle = {
      position: 'fixed',
      top: cutoutTop + cutoutHeight + 12,
      left: cutoutLeft + cutoutWidth / 2 - 22,
    }
  } else {
    // down - arrow sits above the element
    arrowStyle = {
      position: 'fixed',
      top: cutoutTop - 56,
      left: cutoutLeft + cutoutWidth / 2 - 22,
    }
  }

  return (
    <>
      {/* Single overlay with box-shadow cutout - no seams */}
      <div
        className="fixed inset-0 z-[90] pointer-events-none"
        style={{
          borderRadius: radius,
        }}
      >
        <div
          style={{
            position: 'fixed',
            top: cutoutTop,
            left: cutoutLeft,
            width: cutoutWidth,
            height: cutoutHeight,
            borderRadius: radius,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
            border: '2px solid rgba(255, 255, 255, 0.7)',
          }}
        />
      </div>

      {/* Arrow */}
      <div className="z-[91] pointer-events-none" style={arrowStyle}>
        <TourArrow direction={arrowDirection} />
      </div>
    </>
  )
}

export default function DemoControlPanel({
  steps,
  storageKey,
  isOpen,
  currentStep,
  onAdvance,
  onBack,
  onDismiss,
  onStepActivate,
}: DemoControlPanelProps) {
  const theme = useThemeStyles()
  const [mounted, setMounted] = useState(false)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [arrowDirection, setArrowDirection] = useState<'left' | 'right' | 'up' | 'down'>('right')
  const spotlightIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // When a highlighted element is clicked, pause spotlight:
  // - actionRequired: hide panel while page navigates (new page takes over)
  // - non-actionRequired: hide spotlight while modal is open, advance on close
  const [spotlightPaused, setSpotlightPaused] = useState(false)
  const [panelHidden, setPanelHidden] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Reset paused/hidden state when step changes
  useEffect(() => {
    setSpotlightPaused(false)
    setPanelHidden(false)
  }, [currentStep])

  // Find and track the highlighted element
  const updateTargetRect = useCallback(() => {
    const step = steps[currentStep]
    if (!step?.highlightId || !isOpen) {
      setTargetRect(null)
      return
    }
    const el = document.getElementById(step.highlightId)
    if (!el) {
      setTargetRect(null)
      return
    }
    const rect = el.getBoundingClientRect()
    setTargetRect(rect)

    // Determine arrow direction based on element position
    const screenCenter = window.innerWidth / 2
    const elCenter = rect.left + rect.width / 2

    // If element is in nav bar (near top), arrow below pointing up
    if (rect.top < 80) {
      setArrowDirection('up')
    } else if (elCenter < screenCenter) {
      setArrowDirection('right')
    } else {
      setArrowDirection('left')
    }
  }, [currentStep, steps, isOpen])

  useEffect(() => {
    updateTargetRect()
    spotlightIntervalRef.current = setInterval(updateTargetRect, 300)
    return () => {
      if (spotlightIntervalRef.current) clearInterval(spotlightIntervalRef.current)
    }
  }, [updateTargetRect])

  // Also update on scroll / resize
  useEffect(() => {
    if (!isOpen) return
    const handler = () => updateTargetRect()
    window.addEventListener('scroll', handler, true)
    window.addEventListener('resize', handler)
    return () => {
      window.removeEventListener('scroll', handler, true)
      window.removeEventListener('resize', handler)
    }
  }, [isOpen, updateTargetRect])

  // Global click listener: detect clicks on highlighted element and advance tour
  useEffect(() => {
    const step = steps[currentStep]
    if (!step?.highlightId || !isOpen) return

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const highlightEl = document.getElementById(step.highlightId!)
      if (highlightEl && (highlightEl === target || highlightEl.contains(target))) {
        if (step.actionRequired) {
          setPanelHidden(true)
          onAdvance()
        } else {
          // Non-actionRequired: pause spotlight, advance after modal closes
          setSpotlightPaused(true)
        }
      }
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [currentStep, steps, isOpen, onAdvance])

  // When spotlight is paused, poll for modal close then advance
  useEffect(() => {
    if (!spotlightPaused || !isOpen) return

    const checkModalClosed = setInterval(() => {
      const step = steps[currentStep]
      if (!step?.highlightId) return
      const el = document.getElementById(step.highlightId)
      if (!el) return

      // Check if the element is the topmost at its centre point (no modal covering it)
      const rect = el.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const topEl = document.elementFromPoint(centerX, centerY)
      if (topEl && (el === topEl || el.contains(topEl))) {
        setSpotlightPaused(false)
        onAdvance()
      }
    }, 300)

    return () => clearInterval(checkModalClosed)
  }, [spotlightPaused, isOpen, currentStep, steps, onAdvance])

  if (!mounted || !isOpen || panelHidden) return null

  const step = steps[currentStep]
  if (!step) return null

  const isLastStep = currentStep === steps.length - 1
  const progress = ((currentStep + 1) / steps.length) * 100
  // Only treat as an action step if the element actually exists on this page
  const isActionStep = step.actionRequired && step.highlightId && targetRect !== null
  // Show spotlight for any step with a highlight target (actionRequired or not)
  const hasHighlight = step.highlightId && targetRect !== null

  const handleNext = () => {
    if (isActionStep) return
    const nextIndex = currentStep + 1
    onAdvance()
    if (nextIndex < steps.length && onStepActivate) {
      onStepActivate(nextIndex)
    }
  }

  const panel = (
    <>
      {/* Spotlight overlay for highlighted steps */}
      {hasHighlight && !spotlightPaused && targetRect && (
        <TourSpotlight
          targetRect={targetRect}
          arrowDirection={arrowDirection}
        />
      )}

      {/* Control panel */}
      <div className="fixed bottom-0 left-0 right-0 md:bottom-6 md:right-6 md:left-auto w-full md:w-96 z-[100] animate-slide-in-from-bottom">
        <div
          className={`${theme.cardBackground} md:rounded-2xl rounded-t-2xl shadow-2xl ${theme.border} ${theme.borderWidth} p-6`}
        >
          {/* Progress Bar */}
          <div className="w-full h-1 bg-stone-100 rounded-full mb-6 overflow-hidden">
            <div
              className={`h-full ${theme.primaryButton} rounded-full transition-all duration-500 ease-out`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <span
              className={`text-xs uppercase tracking-widest ${theme.textMuted}`}
            >
              Step {currentStep + 1} of {steps.length}
            </span>
            <button
              onClick={onDismiss}
              className={`${theme.textMuted} hover:${theme.textPrimary} transition-colors`}
            >
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <h3
            className={`font-display text-xl ${theme.textPrimary} mb-2`}
          >
            {step.title}
          </h3>
          <p
            className={`text-sm ${theme.textSecondary} leading-relaxed mb-6`}
          >
            {step.description}
          </p>

          {/* Footer */}
          <div className="flex justify-between items-center">
            <button
              onClick={onBack}
              disabled={currentStep <= 0}
              className={`flex items-center gap-1 text-xs uppercase tracking-widest transition-colors ${
                currentStep <= 0
                  ? `${theme.textMuted} opacity-40 cursor-not-allowed`
                  : `${theme.textMuted} hover:${theme.textPrimary}`
              }`}
            >
              <ChevronLeft size={14} />
              Back
            </button>

            {isActionStep ? (
              <span
                className={`text-xs uppercase tracking-widest ${theme.textMuted} animate-pulse`}
              >
                Click highlighted area
              </span>
            ) : (
              <button
                onClick={handleNext}
                className={`${theme.primaryButton} ${theme.textOnPrimary} ${theme.primaryButtonHover} px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2`}
              >
                {isLastStep ? 'Finish' : 'Next Step'}
                {isLastStep ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <ArrowRight size={16} />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )

  return createPortal(panel, document.body)
}
