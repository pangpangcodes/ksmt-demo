'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'
import { themes } from '@/lib/themes'
import { ArrowRight } from 'lucide-react'

const LandingHero: React.FC = () => {
  const { theme } = useTheme()
  const t = themes[theme]

  return (
    <section className="relative h-screen flex flex-col items-center justify-start md:justify-center pt-24 sm:pt-28 md:py-32 px-4 overflow-hidden text-ksmt-slate">
      {/* Subtle background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] opacity-[0.02] pointer-events-none">
        <div className="absolute inset-0 border-[40px] border-ksmt-mist rounded-full"></div>
      </div>

      <div className="relative z-10 text-center max-w-5xl mx-auto">

        {/* Logo */}
        <div className="flex flex-col items-center gap-4 mb-4 sm:mb-8 md:mb-16 md:mt-16">
          <div className="relative w-[125px] h-[125px] sm:w-[166px] sm:h-[166px] md:w-[291px] md:h-[291px] animate-bounce-slow">
            <Image
              src="/ksmt-logo.svg"
              alt="ksmt"
              fill
              className="object-contain"
              priority
              unoptimized
            />
          </div>
        </div>

        {/* Headline */}
        <div className="relative -mt-4 sm:-mt-6 md:-mt-10">
          <h1 className="font-cormorant italic font-light text-5xl sm:text-7xl md:text-[9rem] text-ksmt-slate opacity-90">
            <span className="block leading-none">Meet Your</span>
            <span className="block leading-none -mt-3 sm:-mt-6 md:-mt-12">Kismet.</span>
          </h1>
        </div>

        {/* Subtitle + CTAs */}
        <div className="mt-8 sm:mt-10 md:mt-12">
          <p className="font-montserrat text-sm sm:text-base md:text-lg mb-8 sm:mb-10 md:mb-12 text-ksmt-slate max-w-3xl mx-auto leading-relaxed px-4 opacity-80">
            The AI powered workspace for modern wedding planning.
          </p>

          <div className="flex flex-col md:flex-row gap-4 justify-center px-4">
            <Link
              href="/planners"
              className="text-white px-10 py-5 rounded-full font-montserrat font-medium tracking-wide transition-colors w-full md:w-auto text-center text-base selection:bg-ksmt-mist selection:text-white"
              style={{ backgroundColor: t.primaryColor }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = t.primaryColorHover)}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = t.primaryColor)}
            >
              For Planners
            </Link>
            <Link
              href="/couples"
              className="flex items-center justify-center gap-2 px-10 py-5 rounded-full border font-montserrat font-medium tracking-wide transition-colors w-full md:w-auto text-base selection:bg-ksmt-mist selection:text-white"
              style={{ borderColor: t.primaryColor, color: t.primaryColor }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = t.primaryColor; (e.currentTarget as HTMLElement).style.color = 'white' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; (e.currentTarget as HTMLElement).style.color = t.primaryColor }}
            >
              For Couples
            </Link>
          </div>
        </div>


      </div>
    </section>
  )
}

export default LandingHero
