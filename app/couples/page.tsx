import CouplesDashboard from '@/components/CouplesDashboard'
import { ThemeProvider } from '@/contexts/ThemeContext'

export const metadata = {
  title: 'ksmt for Couples | The AI Powered Workspace for Modern Wedding Planning',
  description: 'Your wedding planning hub - manage vendors, track RSVPs, and plan your perfect day.',
}

export default function CouplesPage() {
  return (
    <ThemeProvider storageKey="ksmt_couples_theme">
      <CouplesDashboard />
    </ThemeProvider>
  )
}
