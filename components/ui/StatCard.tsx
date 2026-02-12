import { ReactNode } from 'react'

interface StatCardTheme {
  cardBackground: string
  border: string
  borderWidth: string
  textPrimary: string
  textMuted: string
}

interface StatCardProps {
  icon: ReactNode
  iconBg?: string
  label: string
  value: ReactNode
  subtitle?: string
  theme: StatCardTheme
}

export function StatCard({
  icon,
  iconBg = 'bg-stone-50',
  label,
  value,
  subtitle,
  theme,
}: StatCardProps) {
  return (
    <div className={`${theme.cardBackground} rounded-2xl px-4 py-3 ${theme.border} ${theme.borderWidth} hover:shadow-sm transition-all`}>
      <div className="flex items-start gap-2">
        <div className={`p-1.5 rounded-lg ${iconBg} flex-shrink-0 mt-0.5`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className={`text-xs font-medium ${theme.textMuted} uppercase tracking-widest mb-1`}>{label}</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-xl font-semibold ${theme.textPrimary}`}>{value}</span>
            {subtitle && <span className={`text-xs ${theme.textMuted} truncate`}>{subtitle}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

export function StatCardSkeleton({ theme }: { theme: Pick<StatCardTheme, 'cardBackground' | 'border' | 'borderWidth'> }) {
  return (
    <div className={`${theme.cardBackground} rounded-2xl ${theme.border} ${theme.borderWidth} px-4 py-3`}>
      <div className="flex items-start gap-2">
        <div className="w-7 h-7 rounded-lg bg-stone-50 flex-shrink-0" />
        <div className="min-w-0">
          <div className="h-3 rounded w-20 bg-stone-50 mb-1" />
          <div className="h-6 rounded w-12 bg-stone-50" />
        </div>
      </div>
    </div>
  )
}
