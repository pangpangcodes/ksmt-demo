'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { themes } from '@/lib/themes'

interface WaitlistModalProps {
  isOpen: boolean
  onClose: () => void
}

type UserType = 'bride' | 'planner' | null

export default function WaitlistModal({ isOpen, onClose }: WaitlistModalProps) {
  const { theme } = useTheme()
  const t = themes[theme]

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
    <div className="fixed inset-0 bg-ksmt-slate/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-ksmt-cream rounded-3xl max-w-md w-full p-8 relative shadow-2xl">

        <button
          onClick={handleClose}
          className="absolute top-5 right-5 text-ksmt-slate/30 hover:text-ksmt-slate/70 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: t.primaryColor }}>
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-cormorant italic font-light text-3xl text-ksmt-slate mb-2">
              You're on the list.
            </h3>
            <p className="font-montserrat text-sm text-ksmt-slate/60">We'll be in touch soon.</p>
          </div>

        ) : step === 'type' ? (
          <>
            <h3 className="font-cormorant italic font-light text-3xl text-ksmt-slate mb-1">
              Join the Waitlist
            </h3>
            <p className="font-montserrat text-sm text-ksmt-slate/60 mb-8">Who are you joining as?</p>

            <div className="space-y-3">
              <button
                onClick={() => handleUserTypeSelect('planner')}
                className="w-full py-4 px-8 rounded-full font-montserrat font-medium tracking-wide text-white transition-colors text-sm"
                style={{ backgroundColor: t.primaryColor }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = t.primaryColorHover)}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = t.primaryColor)}
              >
                I'm a Wedding Planner
              </button>
              <button
                onClick={() => handleUserTypeSelect('bride')}
                className="w-full py-4 px-8 rounded-full border font-montserrat font-medium tracking-wide transition-colors text-sm"
                style={{ borderColor: t.primaryColor, color: t.primaryColor }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = t.primaryColor
                  ;(e.currentTarget as HTMLElement).style.color = 'white'
                }}
                onMouseLeave={e => {
                  ;(e.currentTarget as HTMLElement).style.backgroundColor = ''
                  ;(e.currentTarget as HTMLElement).style.color = t.primaryColor
                }}
              >
                I'm Getting Married
              </button>
            </div>
          </>

        ) : (
          <>
            <h3 className="font-cormorant italic font-light text-3xl text-ksmt-slate mb-1">
              {userType === 'bride' ? "Your Details" : "Planner Details"}
            </h3>
            <p className="font-montserrat text-sm text-ksmt-slate/60 mb-8">
              We'll keep you updated on our launch.
            </p>

            {error && (
              <div className="mb-6 p-3 border border-ksmt-slate/20 rounded-xl font-montserrat text-xs text-ksmt-slate/70">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-montserrat text-[9px] tracking-widest uppercase text-ksmt-slate/50 mb-1.5">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-ksmt-slate/20 rounded-xl bg-transparent font-montserrat text-sm text-ksmt-slate placeholder:text-ksmt-slate/30 focus:outline-none focus:border-ksmt-slate/50 transition-colors"
                  placeholder="First name"
                />
              </div>

              <div>
                <label className="block font-montserrat text-[9px] tracking-widest uppercase text-ksmt-slate/50 mb-1.5">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-ksmt-slate/20 rounded-xl bg-transparent font-montserrat text-sm text-ksmt-slate placeholder:text-ksmt-slate/30 focus:outline-none focus:border-ksmt-slate/50 transition-colors"
                  placeholder="Last name"
                />
              </div>

              <div>
                <label className="block font-montserrat text-[9px] tracking-widest uppercase text-ksmt-slate/50 mb-1.5">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-ksmt-slate/20 rounded-xl bg-transparent font-montserrat text-sm text-ksmt-slate placeholder:text-ksmt-slate/30 focus:outline-none focus:border-ksmt-slate/50 transition-colors"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block font-montserrat text-[9px] tracking-widest uppercase text-ksmt-slate/50 mb-1.5">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-4 py-2.5 border border-ksmt-slate/20 rounded-xl bg-transparent font-montserrat text-sm text-ksmt-slate placeholder:text-ksmt-slate/30 focus:outline-none focus:border-ksmt-slate/50 transition-colors"
                  placeholder="e.g., Canada, United States"
                />
              </div>

              {userType === 'planner' && (
                <div>
                  <label className="block font-montserrat text-[9px] tracking-widest uppercase text-ksmt-slate/50 mb-1.5">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full px-4 py-2.5 border border-ksmt-slate/20 rounded-xl bg-transparent font-montserrat text-sm text-ksmt-slate placeholder:text-ksmt-slate/30 focus:outline-none focus:border-ksmt-slate/50 transition-colors"
                    placeholder="Your planning business name"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('type')}
                  className="flex-1 py-3 px-6 rounded-full border border-ksmt-slate/20 font-montserrat font-medium text-sm text-ksmt-slate/60 hover:border-ksmt-slate/40 hover:text-ksmt-slate transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 px-6 rounded-full font-montserrat font-medium text-sm text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: t.primaryColor }}
                  onMouseEnter={e => { if (!loading) (e.currentTarget.style.backgroundColor = t.primaryColorHover) }}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = t.primaryColor)}
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
