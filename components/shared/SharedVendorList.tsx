'use client'

import { useMemo, useState, useEffect } from 'react'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { ChevronDown } from 'lucide-react'
import VendorCard from '../VendorCard'
import type { SharedVendor, VendorStatus } from '@/types/planner'
import { supabase } from '@/lib/supabase-client'

interface SharedVendorListProps {
  vendors: SharedVendor[]
  coupleId: string
  onUpdate: () => void
  activeCategory: string
}

export default function SharedVendorList({ vendors, coupleId, onUpdate, activeCategory }: SharedVendorListProps) {
  const theme = useThemeStyles()
  const [localVendors, setLocalVendors] = useState(vendors)
  const [showDeclined, setShowDeclined] = useState(false)

  // Group vendors by type (excluding declined)
  const groupedVendors = useMemo(() => {
    const groups: Record<string, SharedVendor[]> = {}

    localVendors.forEach(vendor => {
      const type = vendor.vendor_type
      if (!groups[type]) {
        groups[type] = []
      }
      groups[type].push(vendor)
    })

    // Sort by type name
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]))
  }, [localVendors])

  const handleStatusChange = async (vendorId: string, status: VendorStatus | null) => {
    try {
      // Update vendor status in database
      const { error: updateError } = await supabase
        .from('shared_vendors')
        .update({ couple_status: status })
        .eq('id', vendorId)

      if (updateError) throw updateError

      // Log activity
      await supabase.from('vendor_activity').insert({
        planner_couple_id: coupleId,
        shared_vendor_id: vendorId,
        action: 'status_changed',
        actor: 'couple',
        new_value: status
      })

      // Update local state only - no page refresh
      setLocalVendors(prev => prev.map(v =>
        v.id === vendorId ? { ...v, couple_status: status } : v
      ))
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handleNoteChange = async (vendorId: string, note: string) => {
    try {
      // Update vendor note in database
      const { error: updateError } = await supabase
        .from('shared_vendors')
        .update({ couple_note: note.trim() || null })
        .eq('id', vendorId)

      if (updateError) throw updateError

      // Log activity
      await supabase.from('vendor_activity').insert({
        planner_couple_id: coupleId,
        shared_vendor_id: vendorId,
        action: 'note_added',
        actor: 'couple'
      })

      // Update local state only - no page refresh
      setLocalVendors(prev => prev.map(v =>
        v.id === vendorId ? { ...v, couple_note: note } : v
      ))
    } catch (error) {
      console.error('Error updating note:', error)
    }
  }

  // Update local vendors when props change
  useEffect(() => {
    setLocalVendors(vendors)
  }, [vendors])

  const toggleShowDeclined = () => {
    setShowDeclined(prev => !prev)
  }

  // Get all declined vendors across all categories
  const allDeclinedVendors = useMemo(() => {
    return localVendors.filter(v => v.couple_status === 'pass')
  }, [localVendors])

  return (
    <div className="space-y-20">
      {groupedVendors.map(([type, typeVendors]) => {
        // Filter out declined vendors from active display
        const activeVendors = typeVendors.filter(v => v.couple_status !== 'pass')

        if (activeVendors.length === 0) return null

        // Calculate status counts (excluding declined)
        const inReview = activeVendors.filter(v => !v.couple_status).length
        const approved = activeVendors.filter(v => v.couple_status === 'interested').length
        const booked = activeVendors.filter(v => v.couple_status === 'booked').length

        // Build status text - if there's at least one approved or booked, only show that
        let statusText
        if (booked > 0) {
          statusText = `${booked} Booking Confirmed`
        } else if (approved > 0) {
          statusText = `${approved} Approved`
        } else {
          const statusParts = []
          if (inReview > 0) statusParts.push(`${inReview} In Review`)
          statusText = statusParts.length > 0 ? statusParts.join(' • ') : `${activeVendors.length} Vendors`
        }

        // Check if any vendor in this category is approved or booked
        const hasApprovedVendor = approved > 0 || booked > 0

        return (
          <section key={type} className="scroll-mt-24">
            {/* Category Header */}
            {activeCategory === 'All' && (
              <div className="flex items-center gap-4 mb-6">
                <h3 className="text-xl font-display text-stone-900">{type}</h3>
                <div className="h-px bg-gray-200 flex-1"></div>
                <span className="text-xs text-gray-400 uppercase tracking-widest">
                  {statusText}
                </span>
              </div>
            )}

            {/* Active Vendors - Card Grid (Desktop) / Horizontal Scroll (Mobile) */}
            <div className="md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6">
              <div className="flex md:contents gap-4 overflow-x-auto snap-x snap-mandatory pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
                {activeVendors.map((vendor) => {
                  // Vendor is superseded if:
                  // 1. There's a booked vendor and this one is not booked, OR
                  // 2. There's an approved vendor (and no booked) and this one is in review
                  const isSuperseded = (booked > 0 && vendor.couple_status !== 'booked') ||
                                       (booked === 0 && approved > 0 && !vendor.couple_status)
                  return (
                    <div key={vendor.id} className="flex-shrink-0 w-[85vw] sm:w-[70vw] md:w-auto snap-start">
                      <VendorCard
                        vendor={vendor}
                        mode="shared"
                        onStatusChange={handleStatusChange}
                        onNoteChange={handleNoteChange}
                        isSuperseded={isSuperseded}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )
      })}

      {/* Global Show/Hide Declined Vendors Toggle */}
      {allDeclinedVendors.length > 0 && (
        <div className="mt-16">
          <div className="relative flex justify-center py-4">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className={`w-full border-t ${theme.border}`}></div>
            </div>
            <button
              onClick={toggleShowDeclined}
              className={`relative ${theme.cardBackground} px-4 py-1 text-sm ${theme.textMuted} hover:${theme.textSecondary} ${theme.border} ${theme.borderWidth} rounded-full flex items-center gap-2 transition-colors shadow-sm`}
            >
              {showDeclined ? 'Hide' : 'Show'} {allDeclinedVendors.length} Declined
              <ChevronDown
                size={14}
                className={`transform transition-transform duration-200 ${showDeclined ? 'rotate-180' : ''}`}
              />
            </button>
          </div>

          {/* Declined Vendors Grid */}
          {showDeclined && (
            <div className="mt-8">
              <div className="md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6">
                <div className="flex md:contents gap-4 overflow-x-auto snap-x snap-mandatory pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
                  {allDeclinedVendors.map((vendor) => (
                    <div key={vendor.id} className="flex-shrink-0 w-[85vw] sm:w-[70vw] md:w-auto snap-start">
                      <VendorCard
                        vendor={vendor}
                        mode="shared"
                        onStatusChange={handleStatusChange}
                        onNoteChange={handleNoteChange}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
