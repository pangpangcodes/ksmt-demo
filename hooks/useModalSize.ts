'use client'

import { useRef, useState, useEffect, useLayoutEffect, useCallback } from 'react'

/**
 * Determines whether a modal should use a full-page overlay (covering the nav)
 * or a below-nav overlay (leaving the nav visible).
 *
 * - Short modal: overlay starts below the nav, nav stays fully visible
 * - Long modal (taller than the below-nav area): full overlay covers the nav too
 *
 * Usage:
 *   const { headerRef, contentRef, footerRef, isLargeModal } = useModalSize(mounted)
 *   - Add ref={headerRef} to the modal header div
 *   - Add ref={contentRef} to the scrollable content div
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
    const contentH = contentRef.current.scrollHeight
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
    overlay: isLargeModal
      ? 'fixed inset-0'
      : 'fixed top-16 md:top-20 inset-x-0 bottom-0',
    maxH: isLargeModal
      ? 'max-h-[95vh]'
      : 'max-h-[calc(100vh-6rem)] md:max-h-[calc(100vh-7rem)]',
  }
}
