import Navigation from '@/components/Navigation'
import Hero from '@/components/Hero'
import Itinerary from '@/components/Itinerary'
import RSVP from '@/components/RSVP'
import Accommodation from '@/components/Accommodation'
import Travel from '@/components/Travel'
import FAQ from '@/components/FAQ'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Bella & Edward | Bridezilla Wedding Website',
  description: 'Bella and Edward\'s wedding website - powered by Bridezilla.',
}

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 via-green-100/50 to-green-50 relative">
      <Navigation />
      <Hero />
    </main>
  )
}

