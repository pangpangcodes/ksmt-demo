'use client'

import { useState, useEffect } from 'react'
import { Lock } from 'lucide-react'
import AnimatedHearts from './AnimatedHearts'

interface PasswordGateProps {
  children: React.ReactNode
}

export default function PasswordGate({ children }: PasswordGateProps) {
  const [password, setPassword] = useState('')
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [error, setError] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return
    const unlocked = localStorage.getItem('wedding-site-unlocked')
    if (unlocked === 'true') setIsUnlocked(true)
  }, [isClient])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === '2026') {
      setIsUnlocked(true)
      setError(false)
      localStorage.setItem('wedding-site-unlocked', 'true')
      // Scroll to top when unlocking
      window.scrollTo(0, 0)
    } else {
      setError(true)
      setPassword('')
    }
  }

  // Don't render anything on server
  if (!isClient) {
    return null
  }

  if (isUnlocked) {
    return <>{children}</>
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-green-50 via-green-100/50 to-green-50 flex items-center justify-center p-4 overflow-hidden">
      <AnimatedHearts />
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">
            Monica & Kevin's Wedding
          </h1>
          <p className="text-gray-600">
            Enter the password to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError(false)
              }}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter password"
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">
                Incorrect password. Please try again.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  )
}
