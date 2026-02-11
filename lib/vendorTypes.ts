// Centralized vendor type definitions
// Used across planner, shared workspace, and AI parsing

export const VENDOR_TYPES = [
  'Venue',
  'Photographer',
  'Videographer',
  'Florist',
  'Caterer',
  'Cake',
  'Entertainment - DJ',
  'Entertainment - Live Music',
  'Hair & Makeup',
  'Hair',
  'Makeup',
  'Planner',
  'Officiant',
  'Transportation',
  'Rentals',
  'Stationery',
  'Other'
] as const

export type VendorType = typeof VENDOR_TYPES[number]

// Check if a vendor type is valid
export function isValidVendorType(type: string): boolean {
  return VENDOR_TYPES.includes(type as VendorType)
}

// Get the closest matching vendor type (for migration/backwards compatibility)
export function normalizeVendorType(type: string): VendorType {
  const normalized = type.trim()

  // Handle legacy types
  if (normalized === 'DJ/Band') {
    return 'Entertainment - DJ' // Default to DJ for backwards compatibility
  }
  if (normalized === 'DJ') {
    return 'Entertainment - DJ'
  }
  if (normalized === 'Band' || normalized === 'Live Music' || normalized.toLowerCase().includes('live music')) {
    return 'Entertainment - Live Music'
  }

  if (isValidVendorType(normalized)) {
    return normalized as VendorType
  }

  return 'Other'
}
