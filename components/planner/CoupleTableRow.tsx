'use client'

import { useState, Fragment, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { format, formatDistanceToNow } from 'date-fns'
import {
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Mail,
  MapPin,
  Share2,
  Loader2
} from 'lucide-react'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import type { PlannerCouple, VendorLibrary, SharedVendor } from '@/types/planner'
import SelectVendorsModal from './SelectVendorsModal'
import EmailPreviewModal from './EmailPreviewModal'
import Notification from './Notification'

interface CoupleTableRowProps {
  couple: PlannerCouple
  onEdit: (couple: PlannerCouple) => void
  onDelete: (coupleId: string) => void
  onRefresh: () => void
  sharedVendorsCounts?: Record<string, {total: number, bookedCategories: number, totalCategories: number}>
  tourId?: string
}

export default function CoupleTableRow({
  couple,
  onEdit,
  onDelete,
  onRefresh,
  sharedVendorsCounts,
  tourId
}: CoupleTableRowProps) {
  const theme = useThemeStyles()
  const router = useRouter()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Share vendors state
  const [showShareModal, setShowShareModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [vendorLibrary, setVendorLibrary] = useState<VendorLibrary[]>([])
  const [alreadySharedVendors, setAlreadySharedVendors] = useState<SharedVendor[]>([])
  const [selectedVendors, setSelectedVendors] = useState<{vendorIds: string[], customMessage: string}>({vendorIds: [], customMessage: ''})
  const [loadingVendors, setLoadingVendors] = useState(false)
  const [notification, setNotification] = useState<{type: 'success' | 'error' | 'warning', title: string, message: string} | null>(null)
  const [shareLink, setShareLink] = useState('')

  const vendorInfo = sharedVendorsCounts?.[couple.id] || {total: 0, bookedCategories: 0, totalCategories: 0}

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      setShareLink(`${window.location.origin}/s/${couple.share_link_id}`)
    }
  }, [couple.share_link_id])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const token = sessionStorage.getItem('planner_auth')
      if (!token) return

      const response = await fetch(`/api/planners/couples/${couple.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        onDelete(couple.id)
        onRefresh()
      }
    } catch (error) {
      console.error('Failed to delete couple:', error)
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleCopyEmail = () => {
    if (couple.couple_email) {
      navigator.clipboard.writeText(couple.couple_email)
      setCopiedEmail(true)
      setTimeout(() => setCopiedEmail(false), 2000)
    }
  }

  const handleShareVendors = async () => {
    console.log('handleShareVendors called for couple:', couple.couple_names)

    // Validate email
    if (!couple.couple_email) {
      console.log('No email found for couple')
      setNotification({
        type: 'error',
        title: 'Email Required',
        message: `Please add an email address for ${couple.couple_names} before sharing vendors.`
      })
      return
    }

    // Fetch data
    setLoadingVendors(true)
    try {
      const token = sessionStorage.getItem('planner_auth')
      console.log('Fetching vendor data with token:', token ? 'present' : 'missing')

      // Parallel fetch
      const [libraryRes, sharedRes] = await Promise.all([
        fetch('/api/planners/vendor-library', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/planners/couples/${couple.id}/vendors`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      console.log('Library response status:', libraryRes.status)
      console.log('Shared response status:', sharedRes.status)

      // Check for non-200 responses
      if (!libraryRes.ok) {
        const errorText = await libraryRes.text()
        console.error('Library API error:', libraryRes.status, errorText)
        setNotification({
          type: 'error',
          title: 'Failed to Load Vendors',
          message: libraryRes.status === 401 ? 'Authentication failed. Please log in again.' : 'Could not load vendors.'
        })
        return
      }

      if (!sharedRes.ok) {
        const errorText = await sharedRes.text()
        console.error('Shared vendors API error:', sharedRes.status, errorText)
        setNotification({
          type: 'error',
          title: 'Failed to Load Shared Vendors',
          message: sharedRes.status === 401 ? 'Authentication failed. Please log in again.' : 'Could not load shared vendors.'
        })
        return
      }

      const libraryData = await libraryRes.json()
      const sharedData = await sharedRes.json()

      console.log('Library data:', libraryData)
      console.log('Shared data:', sharedData)

      if (libraryData.success && sharedData.success) {
        setVendorLibrary(libraryData.data || [])
        setAlreadySharedVendors(sharedData.data || [])
        setShowShareModal(true)
        console.log('Opening share modal')
      } else {
        console.error('API call failed:', { libraryData, sharedData })
        setNotification({
          type: 'error',
          title: 'Failed to Load Vendors',
          message: libraryData.error || sharedData.error || 'Could not fetch vendor data.'
        })
      }
    } catch (error) {
      console.error('Error in handleShareVendors:', error)
      setNotification({
        type: 'error',
        title: 'Failed to Load Vendors',
        message: 'Could not fetch vendor data. Please try again.'
      })
    } finally {
      setLoadingVendors(false)
    }
  }

  const handleVendorSelectionComplete = (selections: {vendorIds: string[], customMessage: string}) => {
    setSelectedVendors(selections)
    setShowShareModal(false)
    setShowConfirmModal(true)
  }

  const handleConfirmAndSend = async () => {
    try {
      const token = sessionStorage.getItem('planner_auth')

      // Step 1: Share vendors
      const shareResponse = await fetch(`/api/planners/couples/${couple.id}/vendors/bulk-share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          vendor_ids: selectedVendors.vendorIds,
          custom_message: selectedVendors.customMessage
        })
      })

      const shareData = await shareResponse.json()

      if (!shareData.success) {
        throw new Error(shareData.error || 'Failed to share vendors')
      }

      // Step 2: Send email
      const emailResponse = await fetch(`/api/planners/couples/${couple.id}/invite`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const emailData = await emailResponse.json()

      setShowConfirmModal(false)

      if (emailData.success) {
        setNotification({
          type: 'success',
          title: 'Vendors Shared & Email Sent!',
          message: `Successfully shared ${shareData.data.shared} vendors with ${couple.couple_names} and sent invitation to ${couple.couple_email}`
        })
      } else {
        setNotification({
          type: 'warning',
          title: 'Partially Complete',
          message: `Shared ${shareData.data.shared} vendors, but failed to send email. You can resend from the couple detail page.`
        })
      }

      // Refresh couple data
      onRefresh()

    } catch (error: any) {
      setShowConfirmModal(false)
      setNotification({
        type: 'error',
        title: 'Failed to Share Vendors',
        message: error.message || 'Please try again.'
      })
    }
  }

  return (
    <Fragment>
      <tr
        className="hover:bg-stone-50 cursor-pointer transition-all duration-150 group"
        onClick={() => router.push(`/planners/couples/${couple.share_link_id}`)}
      >
        {/* Couple Names */}
        <td className="px-4 py-4">
          <span id={tourId} className={`text-sm font-medium ${theme.textPrimary} group-hover:underline group-hover:text-stone-900 transition-all`}>
            {couple.couple_names}
          </span>
        </td>

        {/* Contact (Email) */}
        <td className="px-4 py-4">
          {couple.couple_email ? (
            <div className="flex items-center gap-2 group/email">
              <span className={`text-sm ${theme.textSecondary}`}>
                {couple.couple_email}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleCopyEmail()
                }}
                className="opacity-0 group-hover/email:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                title="Copy email"
              >
                {copiedEmail ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500" />
                )}
              </button>
            </div>
          ) : (
            <span className={`${theme.textMuted} italic text-sm`}>-</span>
          )}
        </td>

        {/* Wedding Date */}
        <td className={`px-4 py-4 text-sm ${theme.textSecondary}`}>
          {couple.wedding_date ? (() => {
            // Parse date without timezone conversion to avoid date shifting
            const [year, month, day] = couple.wedding_date.split('-').map(Number)
            const date = new Date(year, month - 1, day)
            return format(date, 'MMM d, yyyy')
          })() : (
            <span className={`${theme.textMuted} italic`}>-</span>
          )}
        </td>

        {/* Location */}
        <td className={`px-4 py-4 text-sm ${theme.textSecondary}`}>
          {couple.wedding_location || couple.venue_name ? (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(couple.wedding_location || couple.venue_name || '')}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={`${theme.textSecondary} hover:text-stone-900 hover:underline transition-colors`}
            >
              {couple.wedding_location || couple.venue_name}
            </a>
          ) : (
            <span className={`${theme.textMuted} italic`}>-</span>
          )}
        </td>

        {/* Last Activity */}
        <td className={`px-4 py-4 text-sm ${theme.textMuted}`}>
          {formatDistanceToNow(new Date(couple.last_activity), { addSuffix: true })}
        </td>

        {/* Vendor Count */}
        <td className={`px-4 py-4`}>
          {vendorInfo.totalCategories > 0 ? (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              vendorInfo.bookedCategories > 0
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-stone-100 text-stone-600'
            }`}>
              {vendorInfo.bookedCategories}/{vendorInfo.totalCategories} booked
            </span>
          ) : (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-600">
              0 vendors
            </span>
          )}
        </td>

        {/* Actions */}
        <td className={`px-4 py-4`}>
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            {/* View Shared Website Button */}
            <button
              onClick={() => window.open(shareLink, '_blank')}
              className={`p-1.5 rounded ${theme.textSecondary} hover:bg-stone-100 hover:${theme.textPrimary} transition-all`}
              title="Open shared workspace"
            >
              <ExternalLink className="w-4 h-4" />
            </button>

            {/* Share Vendors Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleShareVendors()
              }}
              disabled={loadingVendors}
              className={`p-1.5 rounded ${theme.textSecondary} hover:bg-stone-100 hover:${theme.textPrimary} transition-all disabled:opacity-50 disabled:hover:bg-transparent`}
              title="Share vendors with couple"
              aria-label="Share vendors"
            >
              {loadingVendors ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </button>

            {/* Edit Button */}
            <button
              onClick={() => onEdit(couple)}
              className={`p-1.5 rounded ${theme.textSecondary} hover:bg-stone-100 hover:${theme.textPrimary} transition-all`}
              title="Edit couple details"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            {/* Delete Button with Confirmation */}
            {showDeleteConfirm ? (
              <div className="flex gap-1">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {deleting ? 'Deleting...' : 'Confirm'}
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
                title="Delete couple"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Modals */}
      {showShareModal && (
        <SelectVendorsModal
          coupleId={couple.id}
          coupleName={couple.couple_names}
          vendorLibrary={vendorLibrary}
          alreadySharedVendors={alreadySharedVendors}
          initialSelectedVendorIds={selectedVendors.vendorIds}
          initialCustomMessage={selectedVendors.customMessage}
          onClose={() => {
            setShowShareModal(false)
            // Reset selections when modal is closed without continuing
            setSelectedVendors({vendorIds: [], customMessage: ''})
          }}
          onContinue={handleVendorSelectionComplete}
        />
      )}

      {showConfirmModal && (() => {
        // Calculate vendor categories from selected vendors
        const selectedVendorDetails = vendorLibrary.filter(v =>
          selectedVendors.vendorIds.includes(v.id)
        )

        const categoryMap = new Map<string, number>()
        selectedVendorDetails.forEach(vendor => {
          const count = categoryMap.get(vendor.vendor_type) || 0
          categoryMap.set(vendor.vendor_type, count + 1)
        })

        const vendorCategories = Array.from(categoryMap.entries()).map(([type, count]) => ({
          type,
          count
        }))

        return (
          <EmailPreviewModal
            couple={couple}
            vendorCount={selectedVendors.vendorIds.length}
            customMessage={selectedVendors.customMessage}
            vendorCategories={vendorCategories}
            onBack={() => {
              setShowConfirmModal(false)
              setShowShareModal(true)
            }}
            onConfirm={handleConfirmAndSend}
            onClose={() => {
              setShowConfirmModal(false)
              // Reset selections when modal is closed without sending
              setSelectedVendors({vendorIds: [], customMessage: ''})
            }}
          />
        )
      })()}

      {/* Notification - Rendered via Portal to avoid hydration error */}
      {mounted && notification && createPortal(
        <Notification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={() => setNotification(null)}
        />,
        document.body
      )}
    </Fragment>
  )
}
