'use client'

import { useState } from 'react'
import { useThemeStyles } from '@/hooks/useThemeStyles'

interface PlannerAuthProps {
  onAuthenticate: (password: string) => void
  loading: boolean
  error: string
}

export default function PlannerAuth({ onAuthenticate, loading, error }: PlannerAuthProps) {
  const theme = useThemeStyles()
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAuthenticate(password)
  }

  return (
    <section className="py-12 font-body">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-heading text-3xl md:text-4xl text-white mb-4 uppercase tracking-wide">
              Planner Workspace
            </h2>
            <p className="text-white">
              Enter your planner password to manage couples and share vendor recommendations
            </p>
          </div>

          <div className={`${theme.cardBackground} rounded-2xl shadow-lg p-6 md:p-8 ${theme.border} ${theme.borderWidth}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className={`block text-sm font-semibold ${theme.textSecondary} mb-2`}>
                  Planner Password *
                </label>
                <input
                  type="password"
                  id="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-3 ${theme.border} ${theme.borderWidth} rounded-lg focus:ring-2 focus:ring-stone-900 focus:border-stone-900 transition-all`}
                  placeholder="Enter planner password"
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className={`${theme.error.bg} border ${theme.error.text} px-4 py-3 rounded-lg text-sm`}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full ${theme.primaryButton} ${theme.primaryButtonHover} ${theme.textOnPrimary} py-4 rounded-full font-heading uppercase tracking-wide hover:scale-105 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed`}
              >
                {loading ? 'Authenticating...' : 'Login'}
              </button>

              <div className={`text-xs ${theme.textMuted} text-center mt-4`}>
                For wedding planners only. If you're planning your own wedding, visit{' '}
                <a href="/couples" className={`${theme.navActive} underline hover:opacity-80`}>
                  /couples
                </a>
                {' '}instead.
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
