'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

const LandingHero: React.FC = () => {
  return (
    <section className="relative h-screen flex flex-col items-center justify-center py-8 md:py-32 px-4 overflow-hidden text-[#2B2D42]">
      {/* Subtle background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] opacity-[0.02] pointer-events-none">
        <div className="absolute inset-0 border-[40px] border-[#8D99AE] rounded-full"></div>
      </div>

      <div className="relative z-10 text-center max-w-5xl mx-auto">
        <div className="flex flex-col items-center gap-4 mb-8 sm:mb-12 md:mb-16">
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-56 md:h-56 animate-bounce-slow">
            <Image
              src="/bridezilla-logo-circle-green.svg?v=8"
              alt="Bridezilla Logo"
              fill
              className="object-contain"
              priority
              unoptimized
            />
          </div>
        </div>

        <div className="relative mt-8 sm:mt-12 md:mt-16">
          <h1 className="font-vintage text-5xl sm:text-6xl md:text-[10rem] leading-none italic transform -rotate-3 text-[#B76E79] drop-shadow-lg">
            Bridezilla
          </h1>
        </div>

        <div className="mt-6 sm:mt-12 md:mt-24">
          <p className="font-heading text-xl sm:text-2xl md:text-5xl uppercase tracking-wide sm:tracking-widest mb-6 sm:mb-10 text-[#2B2D42] max-w-4xl mx-auto leading-tight px-4">
            The AI powered workspace for modern wedding planning.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Link
              href="/planners"
              className="bg-[#2F5249] text-white px-8 sm:px-12 py-3 sm:py-5 rounded-full font-heading text-lg sm:text-2xl hover:bg-[#3d6960] transition-all shadow-lg tracking-wide sm:tracking-widest uppercase inline-block text-center"
            >
              For Planners
            </Link>
            <Link
              href="/couples"
              className="border-2 border-[#2F5249] text-[#2F5249] px-8 sm:px-12 py-3 sm:py-5 rounded-full font-heading text-lg sm:text-2xl hover:bg-[#2F5249] hover:text-white transition-all tracking-wide sm:tracking-widest uppercase"
            >
              For Couples
            </Link>
          </div>
        </div>

        <div className="mt-6 sm:mt-12 opacity-60 font-heading tracking-[0.2em] sm:tracking-[0.4em] text-xs sm:text-sm uppercase px-4">
          DIGITAL PLANNING • VENDOR AI • BUDGET BOSS
        </div>
      </div>
    </section>
  )
}

export default LandingHero
