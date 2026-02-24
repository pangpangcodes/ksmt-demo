'use client'

import { useState, useMemo } from 'react'
import { Edit2, Check, X, Trash2 } from 'lucide-react'
import { ParsedVendorLibraryOperation, VendorLibrary } from '@/types/planner'
import { formatCurrency } from '@/lib/vendorUtils'
import { useThemeStyles } from '@/hooks/useThemeStyles'

const DIFF_FIELDS: { key: string; label: string }[] = [
  { key: 'vendor_name', label: 'Name' },
  { key: 'vendor_type', label: 'Type' },
  { key: 'contact_name', label: 'Contact' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'website', label: 'Website' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'location', label: 'Location' },
  { key: 'description', label: 'Description' },
  { key: 'pricing', label: 'Pricing' },
]

function truncate(str: string, len = 55) {
  return str.length > len ? str.slice(0, len) + '...' : str
}

interface VendorLibraryOperationCardProps {
  operation: ParsedVendorLibraryOperation
  existingVendor?: VendorLibrary
  onEdit: (updated: ParsedVendorLibraryOperation) => void
  onRemove: () => void
}

export default function VendorLibraryOperationCard({
  operation,
  existingVendor,
  onEdit,
  onRemove
}: VendorLibraryOperationCardProps) {
  const theme = useThemeStyles()
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState(operation.vendor_data)

  const diffChanges = useMemo(() => {
    if (!existingVendor || operation.action !== 'update') return null
    const changes: { label: string; old: string; new: string }[] = []
    for (const { key, label } of DIFF_FIELDS) {
      const oldVal = String((existingVendor as any)[key] ?? '')
      const newVal = String((editedData as any)[key] ?? '')
      if (oldVal !== newVal) changes.push({ label, old: oldVal, new: newVal })
    }
    const oldTags = (existingVendor.tags ?? []).join(', ')
    const newTags = (editedData.tags ?? []).join(', ')
    if (oldTags !== newTags) changes.push({ label: 'Tags', old: oldTags, new: newTags })
    return changes
  }, [existingVendor, editedData, operation.action])

  const isUpdate = operation.action === 'update'

  const handleSave = () => {
    onEdit({
      ...operation,
      vendor_data: editedData
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedData(operation.vendor_data)
    setIsEditing(false)
  }

  const handleFieldChange = (field: string, value: any) => {
    setEditedData({
      ...editedData,
      [field]: value
    })
  }

  return (
    <div className="bg-white p-4 rounded-xl border border-stone-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isUpdate ? (
            <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg font-semibold">
              UPDATE
            </span>
          ) : (
            <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg font-semibold">
              CREATE
            </span>
          )}
          <span className={`font-bold ${theme.textPrimary}`}>
            {operation.matched_vendor_name || editedData.vendor_name || editedData.vendor_type || '(Unknown vendor)'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className={`p-2 rounded-lg ${theme.textSecondary} hover:bg-stone-100 hover:${theme.textPrimary} transition-all`}
              title="Edit vendor details"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onRemove}
            className={`p-2 rounded-lg ${theme.textSecondary} hover:bg-red-50 hover:text-red-600 transition-all`}
            title="Remove from import"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Update Warning + Diff */}
      {isUpdate && (
        <div className="mb-3 bg-emerald-50 border border-emerald-200 px-3 py-2.5 rounded-lg">
          <p className="text-sm font-medium text-emerald-700">
            {operation.matched_vendor_name
              ? `Updating existing vendor: ${operation.matched_vendor_name}`
              : (
                <>
                  {'Updating vendor (ID: '}
                  <a
                    href={`/planners?view=vendors&vendor=${operation.vendor_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-emerald-900 transition-colors"
                  >
                    {operation.vendor_id}
                  </a>
                  {')'}
                </>
              )}
          </p>

          {diffChanges !== null && (
            <div className="mt-2">
              {diffChanges.length === 0 ? (
                <p className="text-xs text-emerald-600">No changes from existing record - data is identical.</p>
              ) : (
                <div className="space-y-1 mt-1">
                  <p className="text-xs font-semibold text-emerald-700">
                    {diffChanges.length} field{diffChanges.length !== 1 ? 's' : ''} will change:
                  </p>
                  {diffChanges.map(({ label, old, new: newVal }) => (
                    <div key={label} className="text-xs text-emerald-800">
                      <span className="font-medium">{label}:</span>{' '}
                      <span className="text-stone-400 line-through">{truncate(old) || '(empty)'}</span>
                      {' -> '}
                      <span className="font-medium">{truncate(newVal) || '(empty)'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {isEditing ? (
        <div className="space-y-3">
          {/* Vendor Type */}
          <div>
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-1`}>
              Vendor Type <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editedData.vendor_type || ''}
              onChange={(e) => handleFieldChange('vendor_type', e.target.value)}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
            />
          </div>

          {/* Vendor Name */}
          <div>
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-1`}>
              Vendor Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editedData.vendor_name || ''}
              onChange={(e) => handleFieldChange('vendor_name', e.target.value)}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
            />
          </div>

          {/* Contact Name */}
          <div>
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-1`}>Contact Name</label>
            <input
              type="text"
              value={editedData.contact_name || ''}
              onChange={(e) => handleFieldChange('contact_name', e.target.value)}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
            />
          </div>

          {/* Email */}
          <div>
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-1`}>Email</label>
            <input
              type="email"
              value={editedData.email || ''}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
            />
          </div>

          {/* Phone */}
          <div>
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-1`}>Phone</label>
            <input
              type="tel"
              value={editedData.phone || ''}
              onChange={(e) => handleFieldChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
            />
          </div>

          {/* Website */}
          <div>
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-1`}>Website</label>
            <input
              type="url"
              value={editedData.website || ''}
              onChange={(e) => handleFieldChange('website', e.target.value)}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
            />
          </div>

          {/* Instagram */}
          <div>
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-1`}>Instagram</label>
            <input
              type="text"
              value={editedData.instagram || ''}
              onChange={(e) => handleFieldChange('instagram', e.target.value)}
              placeholder="@username"
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
            />
          </div>

          {/* Location */}
          <div>
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-1`}>Location</label>
            <input
              type="text"
              value={editedData.location || ''}
              onChange={(e) => handleFieldChange('location', e.target.value)}
              placeholder="City or region"
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
            />
          </div>

          {/* Pricing */}
          <div>
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-1`}>Pricing</label>
            <textarea
              value={editedData.pricing || ''}
              onChange={(e) => handleFieldChange('pricing', e.target.value)}
              rows={6}
              placeholder="E.g., PACKAGE ONE - €3950&#10;8 hours coverage&#10;Feature film&#10;&#10;EXTRAS:&#10;Extra hours - €295 per hour"
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 resize-none font-mono text-sm"
            />
          </div>

          {/* Tags */}
          <div>
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-1`}>Tags (comma-separated)</label>
            <input
              type="text"
              value={editedData.tags?.join(', ') || ''}
              onChange={(e) => handleFieldChange('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
              placeholder="boho, luxury, beach"
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
            />
          </div>

          {/* Description */}
          <div>
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-1`}>Description</label>
            <textarea
              value={editedData.description || ''}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              rows={3}
              placeholder="What the vendor offers, their style, specialties..."
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              className={`flex-1 px-4 py-2 ${theme.primaryButton} ${theme.textOnPrimary} rounded-lg font-semibold ${theme.primaryButtonHover} transition-colors flex items-center justify-center gap-2`}
            >
              <Check className="w-5 h-5" />
              Save Changes
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-stone-200 rounded-lg font-semibold hover:border-stone-300 transition-colors flex items-center gap-2"
            >
              <X className="w-5 h-5" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className={`space-y-2 text-sm ${theme.textSecondary}`}>
          {/* Display fields */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {editedData.vendor_type && (
              <div>
                <span className={`font-medium ${theme.textSecondary}`}>Type:</span>{' '}
                <span className={theme.textPrimary}>{editedData.vendor_type}</span>
              </div>
            )}
            {editedData.contact_name && (
              <div>
                <span className={`font-medium ${theme.textSecondary}`}>Contact:</span>{' '}
                <span className={theme.textPrimary}>{editedData.contact_name}</span>
              </div>
            )}
            {editedData.email && (
              <div className="col-span-2">
                <span className={`font-medium ${theme.textSecondary}`}>Email:</span>{' '}
                <span className={theme.textPrimary}>{editedData.email}</span>
              </div>
            )}
            {editedData.phone && (
              <div>
                <span className={`font-medium ${theme.textSecondary}`}>Phone:</span>{' '}
                <span className={theme.textPrimary}>{editedData.phone}</span>
              </div>
            )}
            {editedData.website && (
              <div className="col-span-2">
                <span className={`font-medium ${theme.textSecondary}`}>Website:</span>{' '}
                <a href={editedData.website} target="_blank" rel="noopener noreferrer" className={`${theme.textPrimary} hover:underline`}>
                  {editedData.website}
                </a>
              </div>
            )}
            {editedData.instagram && (
              <div>
                <span className={`font-medium ${theme.textSecondary}`}>Instagram:</span>{' '}
                <a
                  href={`https://www.instagram.com/${editedData.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener"
                  className={`${theme.textPrimary} hover:underline`}
                >
                  {editedData.instagram}
                </a>
              </div>
            )}
            {editedData.location && (
              <div>
                <span className={`font-medium ${theme.textSecondary}`}>Location:</span>{' '}
                <span className={theme.textPrimary}>{editedData.location}</span>
              </div>
            )}
          </div>

          {editedData.tags && editedData.tags.length > 0 && (
            <div className="pt-2">
              <span className={`font-medium ${theme.textSecondary} text-xs block mb-1`}>Tags:</span>
              <div className="flex flex-wrap gap-1">
                {editedData.tags.map((tag, idx) => (
                  <span key={idx} className={`px-2 py-0.5 bg-stone-100 ${theme.textSecondary} text-xs rounded-full`}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {editedData.description && (
            <div className="pt-2">
              <span className={`font-medium ${theme.textSecondary} text-xs block mb-1`}>Description:</span>
              <p className={`${theme.textSecondary} text-sm`}>{editedData.description}</p>
            </div>
          )}

          {editedData.pricing && (
            <div className="pt-2">
              <span className={`font-medium ${theme.textSecondary} text-xs block mb-1`}>Pricing:</span>
              <pre className={`${theme.textSecondary} text-sm bg-stone-50 p-3 rounded-lg whitespace-pre-wrap font-sans`}>
                {editedData.pricing}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Warnings + Confidence (view mode only) */}
      {!isEditing && (
        <>
          {operation.warnings && operation.warnings.length > 0 && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-semibold text-yellow-900 mb-1">Warnings:</p>
              <ul className="text-sm text-yellow-800 list-disc list-inside space-y-1">
                {operation.warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {operation.confidence !== undefined && (
            <div className="mt-3 flex items-center gap-2">
              <span className={`text-xs ${theme.textSecondary}`}>AI Confidence:</span>
              <div className="flex-1 bg-stone-200 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    operation.confidence > 0.8
                      ? 'bg-emerald-600'
                      : operation.confidence > 0.6
                      ? 'bg-yellow-500'
                      : 'bg-orange-500'
                  }`}
                  style={{ width: `${operation.confidence * 100}%` }}
                />
              </div>
              <span className={`text-xs font-semibold ${theme.textSecondary}`}>
                {Math.round(operation.confidence * 100)}%
              </span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
