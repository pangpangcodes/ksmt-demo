'use client'

import { useRef, useState, useEffect, useLayoutEffect, useCallback } from 'react'

/**
 * Determines whether a modal is "large" (taller than the viewport minus the nav).
 *
 * Both short and large modals use a full-page overlay (fixed inset-0, bg-black/60, no blur).
 * The nav always stays crisp and visible. isLargeModal is available for any future distinction.
 *
 * Usage:
 *   const { headerRef, contentRef, footerRef, isLargeModal } = useModalSize(mounted)
 *   - Add ref={headerRef} to the modal header div
 *   - Add ref={contentRef} to an unconstrained inner wrapper inside the scrollable div
 *   - Add ref={footerRef} to the sticky footer div (if any)
 */
export function useModalSize(active: boolean) {
  const headerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)
  const [isLargeModal, setIsLargeModal] = useState(true)

  const checkSize = useCallback(() => {
    if (!headerRef.current || !contentRef.current) return
    const navHeight = window.innerWidth >= 768 ? 80 : 64 // md:h-20 = 80px, h-16 = 64px
    const padding = 32 // p-4 overlay = 16px top + 16px bottom
    const headerH = headerRef.current.clientHeight
    // Use clientHeight (not scrollHeight) on an unconstrained inner wrapper —
    // scrollHeight of a flex-1 div just reflects its flex-assigned height, not content height
    const contentH = contentRef.current.clientHeight
    const footerH = footerRef.current?.clientHeight ?? 0
    const naturalHeight = headerH + contentH + footerH
    setIsLargeModal(naturalHeight > window.innerHeight - navHeight - padding)
  }, [])

  // Measure before first paint to avoid flash
  useLayoutEffect(() => {
    if (!active) return
    checkSize()
  }, [active, checkSize])

  // Watch for content size changes (e.g. parse results expanding the modal)
  useEffect(() => {
    if (!active || !contentRef.current) return
    const el = contentRef.current
    const observer = new ResizeObserver(checkSize)
    observer.observe(el)
    window.addEventListener('resize', checkSize)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', checkSize)
    }
  }, [active, checkSize])

  return { headerRef, contentRef, footerRef, isLargeModal }
}

/**
 * Returns Tailwind classes for the modal overlay and modal box based on isLargeModal.
 */
export function getModalClasses(isLargeModal: boolean) {
  return {
    overlay: 'fixed inset-0',
    maxH: 'max-h-[95vh]',
  }
}
