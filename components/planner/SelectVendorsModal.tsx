'use client'

import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Search, CheckCircle, Loader2, ChevronDown, ChevronRight, Check } from 'lucide-react'
import { VendorLibrary } from '@/types/planner'
import { VENDOR_TYPES } from '@/lib/vendorTypes'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { useModalSize, getModalClasses } from '@/hooks/useModalSize'

interface SelectVendorsModalProps {
  coupleId: string
  coupleName: string
  vendorLibrary: VendorLibrary[]
  alreadySharedVendors: Array<{ vendor_library_id?: string | null }>
  initialSelectedVendorIds?: string[]
  initialCustomMessage?: string
  onClose: () => void
  onContinue: (selections: { vendorIds: string[]; customMessage: string }) => void
}

export default function SelectVendorsModal({
  coupleId,
  coupleName,
  vendorLibrary,
  alreadySharedVendors,
  initialSelectedVendorIds = [],
  initialCustomMessage = '',
  onClose,
  onContinue
}: SelectVendorsModalProps) {
  const theme = useThemeStyles()
  const { headerRef, contentRef, footerRef, isLargeModal } = useModalSize(true)
  const { overlay: overlayClass, maxH: maxHClass } = getModalClasses(isLargeModal)
  const [selectedVendorIds, setSelectedVendorIds] = useState<Set<string>>(new Set(initialSelectedVendorIds))
  const [customMessage, setCustomMessage] = useState<string>(initialCustomMessage)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  // Create Set of already-shared vendor_library_ids for quick lookup
  const alreadySharedIds = useMemo(() => {
    return new Set(
      alreadySharedVendors
        .map(v => v.vendor_library_id)
        .filter(Boolean) as string[]
    )
  }, [alreadySharedVendors])

  // Filter vendors by search (show all vendors, not just non-shared)
  const filteredVendors = useMemo(() => {
    const allVendors = vendorLibrary
    if (!searchQuery) return allVendors

    const query = searchQuery.toLowerCase()
    return allVendors.filter(v =>
      v.vendor_name.toLowerCase().includes(query) ||
      v.contact_name?.toLowerCase().includes(query) ||
      v.location?.toLowerCase().includes(query) ||
      v.tags?.some(tag => tag.toLowerCase().includes(query))
    )
  }, [vendorLibrary, searchQuery])

  // Group vendors by type
  const vendorsByType = useMemo(() => {
    const grouped: Record<string, VendorLibrary[]> = {}
    VENDOR_TYPES.forEach(type => {
      grouped[type] = filteredVendors.filter(v => v.vendor_type === type)
    })
    return grouped
  }, [filteredVendors])

  const handleToggleVendor = (vendorId: string) => {
    const newSelected = new Set(selectedVendorIds)
    if (newSelected.has(vendorId)) {
      newSelected.delete(vendorId)
    } else {
      newSelected.add(vendorId)
    }
    setSelectedVendorIds(newSelected)
  }

  const handleSelectAllType = (type: string) => {
    const typeVendors = vendorsByType[type]
    const allSelected = typeVendors.every(v => selectedVendorIds.has(v.id))

    const newSelected = new Set(selectedVendorIds)
    if (allSelected) {
      // Unselect all
      typeVendors.forEach(v => newSelected.delete(v.id))
    } else {
      // Select all
      typeVendors.forEach(v => newSelected.add(v.id))
    }
    setSelectedVendorIds(newSelected)
  }

  const handleToggleExpanded = (type: string) => {
    const newExpanded = new Set(expandedTypes)
    if (newExpanded.has(type)) {
      newExpanded.delete(type)
    } else {
      newExpanded.add(type)
    }
    setExpandedTypes(newExpanded)
  }

  const handleContinue = () => {
    if (selectedVendorIds.size === 0) {
      setError('Please select at least one vendor to share')
      return
    }

    setError('')
    onContinue({
      vendorIds: Array.from(selectedVendorIds),
      customMessage: customMessage
    })
  }

  const selectedCount = selectedVendorIds.size

  const modalContent = (
    <div className={`${overlayClass} bg-black/60 z-[9999] flex items-center justify-center p-4`}>
      <div className={`${theme.cardBackground} rounded-2xl shadow-xl max-w-2xl w-full ${maxHClass} flex flex-col border ${theme.border} ${theme.borderWidth} overflow-hidden`}>
        <div ref={headerRef}>
          {/* Header */}
          <div className={`${theme.cardBackground} border-b ${theme.border} px-8 py-6 flex justify-between items-center flex-shrink-0`}>
            <h3 className={`font-display text-2xl md:text-3xl ${theme.textPrimary}`}>
              Share Vendors from Library
            </h3>
            <button
              onClick={onClose}
              className={`${theme.textMuted} hover:${theme.textSecondary} transition-colors`}
            >
              <X size={20} />
            </button>
          </div>

          {/* Search and Stats */}
          <div className={`px-8 py-4 border-b ${theme.border} flex-shrink-0`}>
          <p className={`text-sm ${theme.textSecondary} mb-4`}>
            Select vendors to share with {coupleName}
          </p>
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${theme.textMuted}`} />
              <input
                type="text"
                placeholder="Search vendors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border ${theme.border} rounded-xl text-sm ${theme.textPrimary} focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all`}
              />
            </div>
            <div className={`text-sm font-medium ${theme.textSecondary}`}>
              {selectedCount} new vendor{selectedCount !== 1 ? 's' : ''} selected
            </div>
          </div>

          {filteredVendors.length === 0 && (
            <div className={`text-sm ${theme.textSecondary}`}>No vendors match your search</div>
          )}
          </div>
        </div>

        {/* Vendor List */}
        <div className="flex-1 overflow-y-auto px-8 py-4">
          <div ref={contentRef} className="space-y-4">
            {VENDOR_TYPES.map(type => {
              const typeVendors = vendorsByType[type]
              if (typeVendors.length === 0) return null

              // Sort vendors: unshared first, then shared
              const sortedTypeVendors = [...typeVendors].sort((a, b) => {
                const aIsShared = alreadySharedIds.has(a.id)
                const bIsShared = alreadySharedIds.has(b.id)
                if (aIsShared === bIsShared) return 0
                return aIsShared ? 1 : -1
              })

              const isExpanded = expandedTypes.has(type)
              const allSelected = typeVendors.every(v => selectedVendorIds.has(v.id))
              const someSelected = typeVendors.some(v => selectedVendorIds.has(v.id))
              const sharedCount = typeVendors.filter(v => alreadySharedIds.has(v.id)).length

              return (
                <div key={type} className={`border ${theme.border} ${theme.borderWidth} rounded-xl overflow-hidden`}>
                  {/* Type Header */}
                  <div className="bg-stone-50 px-4 py-3 flex items-center justify-between">
                    <button
                      onClick={() => handleToggleExpanded(type)}
                      className="flex items-center gap-2 flex-1 text-left"
                    >
                      {isExpanded ? (
                        <ChevronDown className={`w-5 h-5 ${theme.textSecondary}`} />
                      ) : (
                        <ChevronRight className={`w-5 h-5 ${theme.textSecondary}`} />
                      )}
                      <span className={`font-bold ${theme.textPrimary}`}>
                        {type} ({sharedCount}/{typeVendors.length} shared)
                      </span>
                    </button>
                    <button
                      onClick={() => handleSelectAllType(type)}
                      className={`px-3 py-1 text-sm font-semibold rounded-lg transition-colors ${
                        allSelected
                          ? `${theme.primaryButton} ${theme.textOnPrimary} ${theme.primaryButtonHover}`
                          : `${theme.secondaryButton} ${theme.textSecondary} ${theme.secondaryButtonHover}`
                      }`}
                    >
                      {allSelected ? 'Unselect All' : 'Select All'}
                    </button>
                  </div>

                  {/* Vendor List */}
                  {isExpanded && (
                    <div className={`divide-y ${theme.border}`}>
                      {sortedTypeVendors.map(vendor => {
                        const isSelected = selectedVendorIds.has(vendor.id)
                        const isAlreadyShared = alreadySharedIds.has(vendor.id)

                        return (
                          <div
                            key={vendor.id}
                            className={`p-4 transition-colors ${
                              isAlreadyShared
                                ? `${theme.cardBackground} opacity-50`
                                : isSelected
                                ? 'bg-stone-50'
                                : `${theme.cardBackground} hover:bg-stone-50`
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {/* Checkbox */}
                              <button
                                onClick={() => !isAlreadyShared && handleToggleVendor(vendor.id)}
                                disabled={isAlreadyShared}
                                className={`flex-shrink-0 w-4 h-4 rounded border ${theme.border} flex items-center justify-center transition-colors ${theme.cardBackground} disabled:cursor-not-allowed disabled:opacity-50`}
                              >
                                {isSelected && <Check className={`w-3 h-3 ${theme.textPrimary}`} strokeWidth={2} />}
                              </button>

                              {/* Vendor Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4 mb-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <h4 className={`font-bold ${theme.textPrimary}`}>{vendor.vendor_name}</h4>
                                      {isAlreadyShared && (
                                        <span className="px-2 py-0.5 bg-stone-200 text-stone-600 text-xs rounded-full flex items-center gap-1">
                                          <Check className="w-3 h-3" />
                                          Already Shared
                                        </span>
                                      )}
                                    </div>
                                    {vendor.location && (
                                      <p className={`text-sm ${theme.textSecondary}`}>{vendor.location}</p>
                                    )}
                                  </div>
                                </div>

                                <div className={`grid grid-cols-2 gap-2 text-sm ${theme.textSecondary} mb-2`}>
                                  {vendor.contact_name && (
                                    <div>Contact: {vendor.contact_name}</div>
                                  )}
                                  {vendor.email && <div>{vendor.email}</div>}
                                  {vendor.phone && <div>{vendor.phone}</div>}
                                  {vendor.instagram && <div>{vendor.instagram}</div>}
                                </div>

                                {vendor.tags && vendor.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    {vendor.tags.map(tag => (
                                      <span key={tag} className={`px-2 py-0.5 bg-stone-100 ${theme.textSecondary} text-xs rounded-full`}>
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {vendor.description && (
                                  <p className={`text-sm ${theme.textSecondary} italic mb-2`}>
                                    &quot;{vendor.description}&quot;
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer - Sticky CTA Buttons */}
        <div ref={footerRef} className={`${theme.cardBackground} px-8 py-6 border-t ${theme.border} flex-shrink-0`}>
          {/* Custom Message Input */}
          <div className="mb-4">
            <label className={`block text-sm font-medium ${theme.textPrimary} mb-2`}>
              Add a personal note (optional)
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder={`Add a personal message for ${coupleName}. This will appear as a highlighted note in the email.`}
              rows={3}
              className={`w-full px-4 py-3 border ${theme.border} rounded-xl text-sm ${theme.textPrimary} focus:ring-1 focus:ring-stone-900 focus:border-stone-900 transition-all resize-none`}
            />
            <p className={`text-xs ${theme.textMuted} mt-1`}>
              This will appear as a special note from you in the email.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          <div className="flex gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-3 sm:px-6 py-3 ${theme.secondaryButton} ${theme.textSecondary} ${theme.secondaryButtonHover} rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap`}
            >
              Cancel
            </button>
            <button
              onClick={handleContinue}
              disabled={selectedCount === 0}
              className={`flex-1 ${theme.primaryButton} ${theme.textOnPrimary} px-3 sm:px-6 py-3 rounded-xl text-xs sm:text-sm font-medium ${theme.primaryButtonHover} transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap`}
            >
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">Preview Email </span>({selectedCount})
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null
}
