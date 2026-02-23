'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import WaitlistModal from '../WaitlistModal'
import { useTheme } from '@/contexts/ThemeContext'
import { themes } from '@/lib/themes'

const LandingNavbar: React.FC = () => {
  const [showWaitlist, setShowWaitlist] = useState(false)
  const { theme } = useTheme()
  const t = themes[theme]

  return (
    <>
    <nav className="px-4 sm:px-6 py-4 sm:py-8 flex justify-between items-center max-w-7xl mx-auto w-full absolute top-0 left-0 right-0 z-50">
      <div className="flex items-center gap-2 sm:gap-3">
        <Link href="/" className="flex-shrink-0">
          <div className="relative w-8 h-8 sm:w-12 sm:h-12">
            <Image
              src="/ksmt-logo.svg"
              alt="ksmt"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        </Link>

        <div className="flex items-baseline gap-2 sm:gap-3 md:gap-4">
          <Link href="/" className="font-bodoni text-lg sm:text-2xl md:text-3xl text-ksmt-slate">
            ksmt
          </Link>
          <span className="text-ksmt-slate opacity-30">|</span>
          <Link
            href="/planners"
            className="font-montserrat text-[7px] sm:text-[9px] md:text-[10px] tracking-[0.2em] uppercase text-ksmt-slate hover:opacity-100 transition-opacity opacity-50"
          >
            Planners
          </Link>
          <span className="text-ksmt-slate opacity-30">|</span>
          <Link
            href="/couples"
            className="font-montserrat text-[7px] sm:text-[9px] md:text-[10px] tracking-[0.2em] uppercase text-ksmt-slate hover:opacity-100 transition-opacity opacity-50"
          >
            Couples
          </Link>
        </div>
      </div>

      <button
        onClick={() => setShowWaitlist(true)}
        className="text-white px-4 py-2 sm:px-7 sm:py-3.5 rounded-full font-montserrat font-medium tracking-wide transition-colors whitespace-nowrap text-xs sm:text-sm selection:bg-ksmt-mist selection:text-white"
        style={{ backgroundColor: t.primaryColor }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = t.primaryColorHover)}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = t.primaryColor)}
      >
        Join Waitlist
      </button>
    </nav>

    <WaitlistModal isOpen={showWaitlist} onClose={() => setShowWaitlist(false)} />
    </>
  )
}

export default LandingNavbar
