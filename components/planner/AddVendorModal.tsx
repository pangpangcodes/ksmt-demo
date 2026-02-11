'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import TagInput from './TagInput'
import { normalizeTags } from '@/lib/tagUtils'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { VENDOR_TYPES } from '@/lib/vendorTypes'

interface AddVendorModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  coupleId?: string  // Optional: if not provided, adds to planner_vendor_library
  vendorToEdit?: {
    id: string
    vendor_name: string
    vendor_type: string
    contact_name?: string
    email?: string
    phone?: string
    instagram?: string
    website?: string
    pricing?: string
    description?: string
    tags?: string[]
  }
}

export default function AddVendorModal({ isOpen, onClose, onSuccess, coupleId, vendorToEdit }: AddVendorModalProps) {
  const theme = useThemeStyles()
  const isEditMode = !!vendorToEdit

  const [formData, setFormData] = useState({
    vendor_name: vendorToEdit?.vendor_name || '',
    vendor_type: vendorToEdit?.vendor_type || '',
    contact_name: vendorToEdit?.contact_name || '',
    email: vendorToEdit?.email || '',
    phone: vendorToEdit?.phone || '',
    instagram: vendorToEdit?.instagram || '',
    website: vendorToEdit?.website || '',
    pricing: vendorToEdit?.pricing || '',
    description: vendorToEdit?.description || '',
    tags: vendorToEdit?.tags?.slice(0, 3) || [],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen])

  // Reset form data when vendor changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        vendor_name: vendorToEdit?.vendor_name || '',
        vendor_type: vendorToEdit?.vendor_type || '',
        contact_name: vendorToEdit?.contact_name || '',
        email: vendorToEdit?.email || '',
        phone: vendorToEdit?.phone || '',
        instagram: vendorToEdit?.instagram || '',
        website: vendorToEdit?.website || '',
        pricing: vendorToEdit?.pricing || '',
        description: vendorToEdit?.description || '',
        tags: vendorToEdit?.tags?.slice(0, 3) || [],
      })
      setError('')
    }
  }, [isOpen, vendorToEdit])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // If coupleId provided, add to shared_vendors; otherwise add to planner_vendor_library
      const tableName = coupleId ? 'shared_vendors' : 'planner_vendor_library'
      const vendorData: any = {
        vendor_name: formData.vendor_name.trim(),
        vendor_type: formData.vendor_type,
        contact_name: formData.contact_name.trim() || null,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        instagram: formData.instagram.trim() || null,
        website: formData.website.trim() || null,
        pricing: formData.pricing.trim() || null,
        description: formData.description.trim() || null,
        tags: formData.tags.length > 0 ? normalizeTags(formData.tags) : null,
      }

      // Add couple-specific or library-specific fields
      if (coupleId) {
        vendorData.planner_couple_id = coupleId
      } else {
        if (!isEditMode) {
          vendorData.is_active = true
        }
      }

      let result
      if (isEditMode && vendorToEdit) {
        // Update existing vendor
        result = await supabase
          .from(tableName)
          .update(vendorData)
          .eq('id', vendorToEdit.id)
      } else {
        // Insert new vendor
        result = await supabase
          .from(tableName)
          .insert(vendorData)
      }

      if (result.error) {
        console.error(`Failed to ${isEditMode ? 'update' : 'add'} vendor:`, result.error)
        setError(`Failed to ${isEditMode ? 'update' : 'add'} vendor. Please try again.`)
        return
      }

      // Reset form
      if (!isEditMode) {
        setFormData({
          vendor_name: '',
          vendor_type: 'Photographer',
          contact_name: '',
          email: '',
          phone: '',
          instagram: '',
          website: '',
          pricing: '',
          description: '',
          tags: [],
        })
      }

      onSuccess()
      onClose()
    } catch (err) {
      console.error(`${isEditMode ? 'Update' : 'Add'} vendor error:`, err)
      setError(`Failed to ${isEditMode ? 'update' : 'add'} vendor. Please try again.`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  // Render modal in portal to avoid DOM nesting issues when used inside tables
  if (typeof window === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4" style={{ WebkitBackdropFilter: 'blur(12px)', backdropFilter: 'blur(12px)' }}>
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[95vh] border border-stone-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-stone-200 px-8 py-6 flex justify-between items-center flex-shrink-0">
          <h3 className={`font-display text-2xl md:text-3xl ${theme.textPrimary}`}>
            {isEditMode ? 'Edit Vendor' : 'Add Vendor'}
          </h3>
          <button
            onClick={onClose}
            className={`${theme.textMuted} hover:${theme.textSecondary} transition-colors`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form - Scrollable Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 py-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="vendor_name" className={`block text-xs font-medium ${theme.textSecondary} uppercase tracking-widest mb-3`}>
                Vendor Name *
              </label>
              <input
                type="text"
                id="vendor_name"
                name="vendor_name"
                required
                value={formData.vendor_name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all"
                placeholder="e.g., La Vie Photography"
              />
            </div>

            <div>
              <label htmlFor="vendor_type" className={`block text-xs font-medium ${theme.textSecondary} uppercase tracking-widest mb-3`}>
                Vendor Type *
              </label>
              <select
                id="vendor_type"
                name="vendor_type"
                required
                value={formData.vendor_type}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm bg-white focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all"
              >
                <option value="" disabled>Select vendor type...</option>
                {VENDOR_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="contact_name" className={`block text-xs font-medium ${theme.textSecondary} uppercase tracking-widest mb-3`}>
              Contact Name
            </label>
            <input
              type="text"
              id="contact_name"
              name="contact_name"
              value={formData.contact_name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all"
              placeholder="e.g., Maria Garcia"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className={`block text-xs font-medium ${theme.textSecondary} uppercase tracking-widest mb-3`}>
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all"
                placeholder="vendor@example.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className={`block text-xs font-medium ${theme.textSecondary} uppercase tracking-widest mb-3`}>
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all"
                placeholder="+34 123 456 789"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="instagram" className={`block text-xs font-medium ${theme.textSecondary} uppercase tracking-widest mb-3`}>
                Instagram
              </label>
              <input
                type="text"
                id="instagram"
                name="instagram"
                value={formData.instagram}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all"
                placeholder="@vendorhandle"
              />
            </div>

            <div>
              <label htmlFor="website" className={`block text-xs font-medium ${theme.textSecondary} uppercase tracking-widest mb-3`}>
                Website
              </label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all"
                placeholder="https://vendor.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="pricing" className={`block text-xs font-medium ${theme.textSecondary} uppercase tracking-widest mb-3`}>
              Pricing
            </label>
            <textarea
              id="pricing"
              name="pricing"
              value={formData.pricing}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all resize-none"
              placeholder="BRIDE - €297&#10;BRIDAL PARTY - €147 per person&#10;BRIDE TRIAL - €175"
            />
          </div>

          <div>
            <label htmlFor="description" className={`block text-xs font-medium ${theme.textSecondary} uppercase tracking-widest mb-3`}>
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all resize-none"
              placeholder="What the vendor offers, their style, and specialties..."
            />
          </div>

          <div>
            <label className={`block text-xs font-medium ${theme.textSecondary} uppercase tracking-widest mb-3`}>
              Tags
              <span className={`text-xs ${theme.textSecondary} font-normal normal-case ml-2`}>
                (Max 3 tags - type-specific suggestions provided)
              </span>
            </label>
            <TagInput
              value={formData.tags}
              onChange={(tags) => setFormData({ ...formData, tags: tags.slice(0, 3) })}
              vendorType={formData.vendor_type}
              placeholder="Add tags (press Enter)"
              maxTags={3}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
        </form>

        {/* Footer - Sticky CTA Buttons */}
        <div className="bg-white border-t border-stone-200 px-4 sm:px-8 py-6 flex gap-2 sm:gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className={`flex-1 px-3 sm:px-6 py-3 border border-stone-200 ${theme.textSecondary} rounded-xl text-xs sm:text-sm font-medium hover:bg-stone-50 transition-colors whitespace-nowrap`}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="vendor-form"
            disabled={loading}
            className={`flex-1 ${theme.primaryButton} ${theme.textOnPrimary} px-3 sm:px-6 py-3 rounded-xl text-xs sm:text-sm font-medium ${theme.primaryButtonHover} transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap`}
            onClick={handleSubmit}
          >
            {loading
              ? (isEditMode ? 'Updating...' : 'Adding...')
              : (isEditMode ? 'Update Vendor' : 'Add Vendor')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
