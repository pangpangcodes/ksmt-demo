'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import LocationAutocompleteInput from '@/components/LocationAutocompleteInput'

const CURRENCY_OPTIONS = ['USD', 'EUR', 'GBP', 'CAD']

interface WeddingSettings {
  id?: string
  bride_name: string
  groom_name: string
  wedding_date: string
  wedding_location: string
  wedding_budget: number
  local_currency: string
  vendor_currency: string
  exchange_rate: number
}

const DEFAULT_SETTINGS: WeddingSettings = {
  bride_name: 'Bella',
  groom_name: 'Edward',
  wedding_date: '2026-09-20',
  wedding_location: 'Hacienda de los Naranjos, Seville, Spain',
  wedding_budget: 50000,
  local_currency: 'USD',
  vendor_currency: 'EUR',
  exchange_rate: 0.9259,
}

export default function SettingsPage() {
  const theme = useThemeStyles()
  const [settings, setSettings] = useState<WeddingSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rateLoading, setRateLoading] = useState(false)
  const [rateFetchedAt, setRateFetchedAt] = useState<string | null>(null)
  const [rateError, setRateError] = useState<string | null>(null)
  const [budgetOpen, setBudgetOpen] = useState(true)

  useEffect(() => { fetchSettings() }, [])

  const fetchLiveRate = useCallback(async (from: string, to: string) => {
    if (from === to) {
      setSettings(prev => ({ ...prev, exchange_rate: 1 }))
      setRateFetchedAt(new Date().toISOString())
      return
    }
    setRateLoading(true)
    setRateError(null)
    try {
      const res = await fetch(`/api/exchange-rate?from=${from}&to=${to}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSettings(prev => ({ ...prev, exchange_rate: data.rate }))
      setRateFetchedAt(data.fetchedAt)
    } catch (err) {
      setRateError('Could not fetch live rate.')
      console.error('Rate fetch error:', err)
    } finally {
      setRateLoading(false)
    }
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const { data, error: fetchError } = await supabase
        .from('wedding_settings').select('*').single()
      if (data && !fetchError) {
        setSettings({
          id: data.id,
          bride_name: data.bride_name ?? DEFAULT_SETTINGS.bride_name,
          groom_name: data.groom_name ?? DEFAULT_SETTINGS.groom_name,
          wedding_date: data.wedding_date ?? DEFAULT_SETTINGS.wedding_date,
          wedding_location: data.wedding_location ?? DEFAULT_SETTINGS.wedding_location,
          wedding_budget: data.wedding_budget ?? DEFAULT_SETTINGS.wedding_budget,
          local_currency: data.local_currency ?? DEFAULT_SETTINGS.local_currency,
          vendor_currency: data.vendor_currency ?? DEFAULT_SETTINGS.vendor_currency,
          exchange_rate: data.exchange_rate ?? DEFAULT_SETTINGS.exchange_rate,
        })
        fetchLiveRate(data.local_currency ?? 'USD', data.vendor_currency ?? 'EUR')
      } else {
        fetchLiveRate('USD', 'EUR')
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err)
      fetchLiveRate('USD', 'EUR')
    } finally {
      setLoading(false)
    }
  }

  const handleLocalCurrencyChange = (value: string) => {
    setSettings(prev => ({ ...prev, local_currency: value }))
    fetchLiveRate(value, settings.vendor_currency)
  }

  const handleVendorCurrencyChange = (value: string) => {
    setSettings(prev => ({ ...prev, vendor_currency: value }))
    fetchLiveRate(settings.local_currency, value)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const payload = {
        bride_name: settings.bride_name,
        groom_name: settings.groom_name,
        wedding_date: settings.wedding_date || null,
        wedding_location: settings.wedding_location,
        wedding_budget: settings.wedding_budget,
        local_currency: settings.local_currency,
        vendor_currency: settings.vendor_currency,
        exchange_rate: settings.exchange_rate,
        updated_at: new Date().toISOString(),
      }
      if (settings.id) {
        const { error: updateError } = await supabase
          .from('wedding_settings').update(payload).eq('id', settings.id)
        if (updateError) throw updateError
      } else {
        const { data, error: insertError } = await supabase
          .from('wedding_settings').insert(payload).select().single()
        if (insertError) throw insertError
        if (data) setSettings(prev => ({ ...prev, id: data.id }))
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      console.error('Failed to save settings:', err)
      setError('Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const budgetInVendorCurrency = settings.wedding_budget * settings.exchange_rate
  const displayName = [settings.bride_name, settings.groom_name]
    .filter(Boolean)
    .map(n => n.trim().split(/\s+/)[0])
    .join(' & ')

  const getCurrencySymbol = (code: string) => {
    const symbols: Record<string, string> = { USD: '$', EUR: '\u20ac', GBP: '\u00a3', CAD: '$' }
    return symbols[code] ?? code
  }

  const formatFetchedAt = (iso: string) =>
    new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })

  const inputClass = `w-full px-3 py-2.5 rounded-xl border ${theme.border} ${theme.cardBackground} ${theme.textPrimary} text-sm focus:outline-none focus:ring-2`

  if (loading) {
    return (
      <div className={`${theme.cardBackground} rounded-2xl shadow-md p-6 border ${theme.border}`}>
        <p className={`${theme.textSecondary} text-sm`}>Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

      {/* Left: Couple Profile Card */}
      <div className={`${theme.cardBackground} rounded-2xl shadow-md border ${theme.border} p-5 lg:p-8`}>

        {/* Avatar + display name */}
        <div className="flex flex-col items-center text-center mb-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-serif mb-4"
            style={{ backgroundColor: `${theme.primaryColor}15`, color: theme.primaryColor }}
          >
            {[settings.bride_name, settings.groom_name]
              .map(n => n.trim().charAt(0).toUpperCase()).join('')}
          </div>
          <h3 className={`font-display text-xl ${theme.textPrimary}`}>{displayName || 'Your Names'}</h3>
          {settings.wedding_location && (
            <p className={`text-sm ${theme.textSecondary} mt-1`}>{settings.wedding_location}</p>
          )}
        </div>

        {/* Editable Fields */}
        <div className={`space-y-4 border-t ${theme.border} pt-5`}>

          <div>
            <label className={`block text-xs font-medium ${theme.textSecondary} uppercase tracking-widest mb-3`}>
              Bride Name
            </label>
            <input
              type="text"
              value={settings.bride_name}
              onChange={e => setSettings(prev => ({ ...prev, bride_name: e.target.value }))}
              placeholder="Name"
              className={inputClass}
              style={{ '--tw-ring-color': theme.primaryColor } as React.CSSProperties}
            />
          </div>
          <div>
            <label className={`block text-xs font-medium ${theme.textSecondary} uppercase tracking-widest mb-3`}>
              Groom Name
            </label>
            <input
              type="text"
              value={settings.groom_name}
              onChange={e => setSettings(prev => ({ ...prev, groom_name: e.target.value }))}
              placeholder="Name"
              className={inputClass}
              style={{ '--tw-ring-color': theme.primaryColor } as React.CSSProperties}
            />
          </div>

          <div>
            <label className={`block text-xs font-medium ${theme.textSecondary} uppercase tracking-widest mb-3`}>
              Wedding Date
            </label>
            <input
              type="date"
              value={settings.wedding_date}
              onChange={e => setSettings(prev => ({ ...prev, wedding_date: e.target.value }))}
              className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all"
            />
          </div>

          <div>
            <label className={`block text-xs font-medium ${theme.textSecondary} uppercase tracking-widest mb-3`}>
              Location
            </label>
            <LocationAutocompleteInput
              value={settings.wedding_location}
              onChange={value => setSettings(prev => ({ ...prev, wedding_location: value }))}
              placeholder="e.g. Hacienda de los Naranjos, Seville"
            />
          </div>
        </div>

      </div>

      {/* Right: Collapsible sections */}
      <div className="lg:col-span-2 space-y-4">

        {/* Budget Settings */}
        <div className={`${theme.cardBackground} rounded-2xl shadow-md border ${theme.border} overflow-hidden`}>
          <button
            onClick={() => setBudgetOpen(o => !o)}
            className="w-full flex items-center justify-between p-4 md:p-6 text-left transition-colors hover:bg-stone-50"
          >
            <h3 className={`${theme.typeSectionHeading} ${theme.textPrimary}`}>Budget Settings</h3>
            <ChevronDown className={`w-5 h-5 ${theme.textSecondary} transition-transform duration-200 ${budgetOpen ? 'rotate-180' : ''}`} />
          </button>

          {budgetOpen && (
            <div className="px-4 pb-4 md:px-6 md:pb-6 border-t border-stone-100">
              <div className="space-y-4 pt-4">

                {/* Row 1: Total Budget + Local Currency */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${theme.textPrimary} mb-1.5`}>
                      Total Wedding Budget
                    </label>
                    <div className="relative">
                      <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${theme.textSecondary}`}>
                        {getCurrencySymbol(settings.local_currency)}
                      </span>
                      <input
                        type="number"
                        min={0}
                        step={100}
                        value={settings.wedding_budget}
                        onChange={e => setSettings(prev => ({ ...prev, wedding_budget: parseFloat(e.target.value) || 0 }))}
                        className={`w-full pl-8 pr-4 py-2.5 rounded-xl border ${theme.border} ${theme.cardBackground} ${theme.textPrimary} text-sm focus:outline-none focus:ring-2`}
                        style={{ '--tw-ring-color': theme.primaryColor } as React.CSSProperties}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${theme.textPrimary} mb-1.5`}>
                      Local Currency (yours)
                    </label>
                    <select
                      value={settings.local_currency}
                      onChange={e => handleLocalCurrencyChange(e.target.value)}
                      className={`w-full px-3 py-2.5 rounded-xl border ${theme.border} ${theme.cardBackground} ${theme.textPrimary} text-sm focus:outline-none focus:ring-2`}
                      style={{ '--tw-ring-color': theme.primaryColor } as React.CSSProperties}
                    >
                      {CURRENCY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Row 2: Budget in Vendor Currency + Vendor Currency */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${theme.textPrimary} mb-1.5`}>
                      Budget in Vendor Currency
                    </label>
                    <div className="relative">
                      <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${theme.textSecondary}`}>
                        {getCurrencySymbol(settings.vendor_currency)}
                      </span>
                      <input
                        type="text"
                        readOnly
                        value={Math.round(budgetInVendorCurrency).toLocaleString()}
                        className={`w-full pl-8 pr-4 py-2.5 rounded-xl border ${theme.border} bg-stone-50 ${theme.textSecondary} text-sm cursor-default select-none`}
                      />
                    </div>
                    {/* Exchange rate as undertext */}
                    <div className="flex items-center gap-1.5 mt-1">
                      {rateError ? (
                        <p className="text-xs text-red-500">{rateError}</p>
                      ) : (
                        <p className={`text-xs ${theme.textSecondary}`}>
                          {settings.wedding_budget.toLocaleString()} {settings.local_currency} x {rateLoading ? '...' : settings.exchange_rate.toFixed(4)}
                          {rateFetchedAt && !rateLoading && (
                            <span className="ml-1 opacity-60">- live rate {formatFetchedAt(rateFetchedAt)}</span>
                          )}
                        </p>
                      )}
                      <button
                        onClick={() => fetchLiveRate(settings.local_currency, settings.vendor_currency)}
                        disabled={rateLoading}
                        className={`flex items-center gap-0.5 text-xs ${theme.textSecondary} transition-colors disabled:opacity-40 flex-shrink-0`}
                        title="Refresh exchange rate"
                      >
                        <RefreshCw className={`w-3 h-3 ${rateLoading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${theme.textPrimary} mb-1.5`}>
                      Vendor Currency
                    </label>
                    <select
                      value={settings.vendor_currency}
                      onChange={e => handleVendorCurrencyChange(e.target.value)}
                      className={`w-full px-3 py-2.5 rounded-xl border ${theme.border} ${theme.cardBackground} ${theme.textPrimary} text-sm focus:outline-none focus:ring-2`}
                      style={{ '--tw-ring-color': theme.primaryColor } as React.CSSProperties}
                    >
                      {CURRENCY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Save */}
        <div className="flex flex-col items-end gap-2">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            onClick={handleSave}
            disabled={saving || rateLoading}
            className="px-8 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-60"
            style={{ backgroundColor: theme.primaryColor }}
          >
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
    </div>
  )
}
