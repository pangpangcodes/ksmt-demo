import LandingNavbar from '@/components/landing/LandingNavbar'
import LandingHero from '@/components/landing/LandingHero'
import LandingFooter from '@/components/landing/LandingFooter'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col selection:bg-ksmt-crimson selection:text-white bg-ksmt-cream">
      <LandingNavbar />
      <main className="flex-grow flex flex-col justify-center">
        <LandingHero />
      </main>
      <LandingFooter />
    </div>
  )
}
