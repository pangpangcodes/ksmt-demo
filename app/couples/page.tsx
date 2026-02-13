import AdminDashboard from '@/components/AdminDashboard'
import { ThemeProvider } from '@/contexts/ThemeContext'

export const metadata = {
  title: 'Bridezilla for Couples | The AI Powered Workspace for Modern Wedding Planning',
  description: 'Your wedding planning hub - manage vendors, track RSVPs, and plan your perfect day.',
}

export default function AdminPage() {
  return (
    <ThemeProvider storageKey="bridezilla_admin_theme">
      <AdminDashboard />
    </ThemeProvider>
  )
}
