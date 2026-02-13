import PlannerDashboard from '@/components/planner/PlannerDashboard'
import { ThemeProvider } from '@/contexts/ThemeContext'

export const metadata = {
  title: 'Bridezilla for Planners | The AI Powered Workspace for Modern Wedding Planning',
  description: 'Professional wedding planner workspace - manage couples and share vendor recommendations',
}

export default function PlannerPage() {
  return (
    <ThemeProvider>
      <PlannerDashboard />
    </ThemeProvider>
  )
}
