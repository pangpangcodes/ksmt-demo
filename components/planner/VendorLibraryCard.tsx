'use client'

import { useState, useEffect, Fragment } from 'react'
import { Mail, Phone, Globe, Instagram, MapPin, Edit2, Trash2, ChevronRight, ChevronDown } from 'lucide-react'
import { VendorLibrary } from '@/types/planner'
import AddVendorModal from './AddVendorModal'
import { useThemeStyles } from '@/hooks/useThemeStyles'

interface VendorLibraryCardProps {
  vendor: VendorLibrary
  defaultExpanded?: boolean
  onUpdate: () => void
  onDelete: (vendorId: string) => void
}

export default function VendorLibraryCard({ vendor, defaultExpanded = false, onUpdate, onDelete }: VendorLibraryCardProps) {
  const theme = useThemeStyles()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [expanded, setExpanded] = useState(defaultExpanded)

  useEffect(() => {
    if (defaultExpanded) setExpanded(true)
  }, [defaultExpanded])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const token = sessionStorage.getItem('planner_auth')
      if (!token) return

      const response = await fetch(`/api/planners/vendor-library/${vendor.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        onDelete(vendor.id)
      }
    } catch (error) {
      console.error('Failed to delete vendor:', error)
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <Fragment>
      <tr
        className="hover:bg-stone-50 cursor-pointer transition-all duration-150 group"
        onClick={() => setExpanded(!expanded)}
      >
        <td className={`px-2 py-4 ${theme.textMuted}`}>
          {expanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </td>
        <td className={`px-4 py-4 text-sm ${theme.textSecondary}`}>
          {vendor.vendor_type}
        </td>
        <td className="px-4 py-4">
          <div className={`text-sm font-medium ${theme.textPrimary}`}>
            {vendor.vendor_name}
          </div>
        </td>
        <td className={`px-4 py-4 text-sm ${theme.textSecondary}`}>
          {vendor.contact_name || (
            <span className={`${theme.textMuted} italic`}>-</span>
          )}
        </td>
        <td className={`px-4 py-4 text-sm ${theme.textSecondary}`}>
          {vendor.location ? (
            <div className="flex items-center gap-1">
              <MapPin className={`w-4 h-4 flex-shrink-0 ${theme.textMuted}`} />
              {vendor.location}
            </div>
          ) : (
            <span className={`${theme.textMuted} italic`}>-</span>
          )}
        </td>
        <td className="px-4 py-4">
          {vendor.tags && vendor.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {vendor.tags.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  className={`px-2 py-0.5 bg-stone-100 ${theme.textSecondary} text-xs rounded-full lowercase`}
                >
                  {tag}
                </span>
              ))}
              {vendor.tags.length > 3 && (
                <span className={`px-2 py-0.5 bg-stone-100 ${theme.textMuted} text-xs rounded-full`}>
                  +{vendor.tags.length - 3}
                </span>
              )}
            </div>
          ) : (
            <span className={`${theme.textMuted} italic text-sm`}>-</span>
          )}
        </td>
        <td className="px-4 py-4">
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowEditModal(true)}
              className={`p-1.5 rounded ${theme.textSecondary} hover:bg-stone-100 hover:${theme.textPrimary} transition-all`}
              title="Edit vendor"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            {showDeleteConfirm ? (
              <div className="flex gap-1">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {deleting ? '...' : 'Confirm'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className={`px-2 py-1 text-xs bg-stone-200 ${theme.textSecondary} rounded hover:bg-stone-300 transition-colors`}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className={`p-1.5 rounded ${theme.textSecondary} hover:bg-red-50 hover:text-red-600 transition-all`}
                title="Archive vendor"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Expanded Details Row */}
      {expanded && (
        <tr>
          <td colSpan={7} className="px-4 py-4 bg-stone-50 border-t border-stone-200">
            <div className="max-w-5xl space-y-4">
              {/* Socials */}
              {(vendor.website || vendor.instagram) && (
                <div>
                  <h4 className={`text-xs font-semibold ${theme.textSecondary} uppercase tracking-wide mb-2`}>Socials</h4>
                  <div className="flex items-center gap-4 text-sm">
                    {vendor.website && (
                      <a
                        href={vendor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${theme.primaryButton} ${theme.textOnPrimary} ${theme.primaryButtonHover} flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors`}
                      >
                        <Globe className="w-4 h-4 flex-shrink-0" />
                        Website
                      </a>
                    )}
                    {vendor.instagram && (
                      <a
                        href={`https://www.instagram.com/${vendor.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${theme.primaryButton} ${theme.textOnPrimary} ${theme.primaryButtonHover} flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors`}
                      >
                        <Instagram className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{vendor.instagram}</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              {vendor.description && (
                <div>
                  <h4 className={`text-xs font-semibold ${theme.textSecondary} uppercase tracking-wide mb-2`}>Description</h4>
                  <div className={`text-sm ${theme.textSecondary} leading-relaxed`}>
                    {vendor.description}
                  </div>
                </div>
              )}

              {/* Pricing */}
              {vendor.pricing && (
                <div>
                  <h4 className={`text-xs font-semibold ${theme.textSecondary} uppercase tracking-wide mb-2`}>Pricing</h4>
                  <div className={`bg-white p-4 rounded-lg border border-stone-200 text-sm ${theme.textSecondary} whitespace-pre-line leading-relaxed font-sans`}>
                    {(() => {
                      try {
                        // Try to parse as JSON
                        const parsed = JSON.parse(vendor.pricing)
                        if (parsed && typeof parsed === 'object') {
                          const { currency, amount, notes } = parsed
                          const symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency
                          return (
                            <div className="space-y-1">
                              <div className={`font-semibold ${theme.textPrimary}`}>
                                {symbol}{amount?.toLocaleString() || 'N/A'}
                              </div>
                              {notes && <div className={theme.textSecondary}>{notes}</div>}
                            </div>
                          )
                        }
                        return vendor.pricing
                      } catch {
                        // If not JSON, display as-is
                        return vendor.pricing
                      }
                    })()}
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <AddVendorModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false)
            onUpdate()
          }}
          vendorToEdit={{
            id: vendor.id,
            vendor_name: vendor.vendor_name,
            vendor_type: vendor.vendor_type,
            contact_name: vendor.contact_name || undefined,
            email: vendor.email || undefined,
            phone: vendor.phone || undefined,
            instagram: vendor.instagram || undefined,
            website: vendor.website || undefined,
            pricing: vendor.pricing || undefined,
            description: vendor.description || undefined,
            tags: vendor.tags || undefined,
          }}
        />
      )}
    </Fragment>
  )
}
