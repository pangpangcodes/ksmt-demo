import React from 'react'
import Image from 'next/image'

const LandingFooter: React.FC = () => {
  return (
    <footer className="py-8 px-6 border-t border-ksmt-slate/8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 items-center gap-4 text-center md:text-left">

        <div className="flex items-center gap-2.5">
          <div className="relative w-7 h-7 flex-shrink-0">
            <Image
              src="/ksmt-logo.svg"
              alt="ksmt"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
          <span className="font-bodoni text-base text-ksmt-slate">
            ksmt
          </span>
        </div>

        <div className="flex gap-6 font-montserrat text-[9px] tracking-widest uppercase text-ksmt-slate/70 justify-center">
          <a href="#" className="hover:text-ksmt-slate transition-colors">Privacy</a>
          <a href="#" className="hover:text-ksmt-slate transition-colors">Terms</a>
          <a href="#" className="hover:text-ksmt-slate transition-colors">Contact</a>
        </div>

        <div className="font-montserrat text-[9px] tracking-widest uppercase text-ksmt-slate/60 md:text-right">
          © 2026 ksmt All Rights Reserved
        </div>

      </div>
    </footer>
  )
}

export default LandingFooter
