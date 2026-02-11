'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface WaitlistModalProps {
  isOpen: boolean
  onClose: () => void
}

type UserType = 'bride' | 'planner' | null

export default function WaitlistModal({ isOpen, onClose }: WaitlistModalProps) {
  const [step, setStep] = useState<'type' | 'form'>('type')
  const [userType, setUserType] = useState<UserType>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    businessName: '',
    country: ''
  })

  const handleUserTypeSelect = (type: 'bride' | 'planner') => {
    setUserType(type)
    setStep('form')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userType,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          businessName: userType === 'planner' ? formData.businessName : null,
          country: formData.country || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join waitlist')
      }

      setSuccess(true)
      setTimeout(() => {
        handleClose()
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStep('type')
    setUserType(null)
    setFormData({ firstName: '', lastName: '', email: '', businessName: '', country: '' })
    setSuccess(false)
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4" style={{ WebkitBackdropFilter: 'blur(12px)', backdropFilter: 'blur(12px)' }}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition-colors"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-display text-2xl font-bold text-stone-900 mb-2">Welcome to the waitlist!</h3>
            <p className="text-stone-600">We'll be in touch soon.</p>
          </div>
        ) : step === 'type' ? (
          <>
            <h3 className="font-display text-2xl font-bold text-stone-900 mb-2">Join the Waitlist</h3>
            <p className="text-stone-600 mb-6">Are you a bride or a wedding planner?</p>

            <div className="space-y-3">
              <button
                onClick={() => handleUserTypeSelect('planner')}
                className="w-full py-4 px-6 bg-[#2F5249] text-white rounded-xl font-heading text-lg hover:bg-[#3d6960] transition-all shadow-sm"
              >
                I'm a Wedding Planner
              </button>
              <button
                onClick={() => handleUserTypeSelect('bride')}
                className="w-full py-4 px-6 border-2 border-[#2F5249] text-[#2F5249] rounded-xl font-heading text-lg hover:bg-[#2F5249] hover:text-white transition-all"
              >
                I'm a Bride
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="font-display text-2xl font-bold text-stone-900 mb-2">
              {userType === 'bride' ? "Bride's" : "Planner's"} Information
            </h3>
            <p className="text-stone-600 mb-6">We'll keep you updated on our launch!</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#2F5249] focus:border-transparent transition-all"
                  placeholder="Enter your first name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#2F5249] focus:border-transparent transition-all"
                  placeholder="Enter your last name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#2F5249] focus:border-transparent transition-all"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#2F5249] focus:border-transparent transition-all"
                  placeholder="e.g., Canada, United States"
                />
              </div>

              {userType === 'planner' && (
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#2F5249] focus:border-transparent transition-all"
                    placeholder="Your planning business name"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('type')}
                  className="flex-1 py-3 px-6 border-2 border-stone-300 text-stone-700 rounded-lg font-medium hover:bg-stone-50 transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 px-6 bg-[#2F5249] text-white rounded-lg font-medium hover:bg-[#3d6960] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Joining...' : 'Join Waitlist'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
