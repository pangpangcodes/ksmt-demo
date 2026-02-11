// TypeScript types for planner-couple collaboration feature
// Matches Supabase schema in supabase/migrations/001_planner_tables.sql and 002_vendor_library.sql

// =============================================================================
// Planner Couples
// =============================================================================

export interface PlannerCouple {
  id: string
  couple_names: string // e.g., "Sarah & Mike"
  couple_email?: string | null
  wedding_date?: string | null // ISO date string
  wedding_location?: string | null
  venue_name?: string | null // Specific venue for filtering
  share_link_id: string // UUID for /shared/[link-id]
  is_active: boolean
  notes?: string | null // Planner's private notes
  created_at: string // ISO timestamp
  last_activity: string // ISO timestamp
  updated_at: string // ISO timestamp
}

export interface CreatePlannerCoupleInput {
  couple_names: string
  couple_email?: string
  wedding_date?: string // REQUIRED for calendar view
  wedding_location?: string
  venue_name?: string
  notes?: string
}

export interface UpdatePlannerCoupleInput {
  couple_names?: string
  couple_email?: string
  wedding_date?: string
  wedding_location?: string
  venue_name?: string
  notes?: string
  is_active?: boolean
}

// =============================================================================
// Vendor Library
// =============================================================================

export interface VendorLibrary {
  id: string
  vendor_type: string // From VENDOR_TYPES
  vendor_name: string
  contact_name?: string | null
  email?: string | null
  phone?: string | null
  website?: string | null
  instagram?: string | null // e.g., "@mariasflores"
  location?: string | null // City/region where vendor operates
  tags?: string[] | null // e.g., ["boho", "luxury", "beach"]
  portfolio_images?: string[] | null // URLs to portfolio images
  pricing?: string | null // Free-form pricing text, well-formatted (e.g., "BRIDE - €297\nBRIDAL PARTY - €147 per person\nBRIDE TRIAL - €175")
  description?: string | null // What the vendor offers, their style, specialties
  is_active: boolean
  created_at: string // ISO timestamp
  updated_at: string // ISO timestamp
}

export interface CreateVendorLibraryInput {
  vendor_type: string
  vendor_name: string
  contact_name?: string
  email?: string
  phone?: string
  website?: string
  instagram?: string
  location?: string
  tags?: string[]
  portfolio_images?: string[]
  pricing?: string
  description?: string
}

export interface UpdateVendorLibraryInput {
  vendor_type?: string
  vendor_name?: string
  contact_name?: string
  email?: string
  phone?: string
  website?: string
  instagram?: string
  location?: string
  tags?: string[]
  portfolio_images?: string[]
  pricing?: string
  description?: string
  is_active?: boolean
}

// AI Parsing for Vendor Library
export interface ParsedVendorLibraryOperation {
  action: 'create' | 'update'
  vendor_id?: string // For updates
  vendor_data: Partial<CreateVendorLibraryInput>
  confidence?: number
  ambiguous_fields?: string[]
  warnings?: string[]
  matched_vendor_name?: string
}

export interface VendorParseResult {
  operations: ParsedVendorLibraryOperation[]
  clarifications_needed: Array<{
    question: string
    field: string
    field_type?: 'text' | 'number' | 'date' | 'email' | 'phone' | 'choice' | 'tags'
    context?: string
    operation_index?: number
    required?: boolean
    choices?: string[]
  }>
  processing_time_ms: number
}

// AI Parsing for Couples
export interface ParsedCoupleOperation {
  action: 'create' | 'update'
  couple_id?: string // For updates
  couple_data: Partial<CreatePlannerCoupleInput>
  confidence?: number
  ambiguous_fields?: string[]
  warnings?: string[]
  matched_couple_names?: string
}

export interface CoupleParseResult {
  operations: ParsedCoupleOperation[]
  clarifications_needed: Array<{
    question: string
    field: string
    field_type?: 'text' | 'date' | 'email'
    context?: string
    operation_index?: number
    required?: boolean
    choices?: string[]
  }>
  processing_time_ms: number
}

// =============================================================================
// Shared Vendors
// =============================================================================

export type VendorStatus =
  | 'interested' // Approved (couple likes this vendor)
  | 'booked' // Booked & Confirmed (planner confirmed booking)
  | 'pass' // Not for us
  | null // Review Needed

export interface SharedVendor {
  id: string
  planner_couple_id: string
  vendor_library_id?: string | null // Reference to vendor_library (if shared from library)
  vendor_name: string
  vendor_type: string // Photographer, Florist, Venue, etc.
  contact_name?: string | null
  email?: string | null
  phone?: string | null
  instagram?: string | null
  website?: string | null
  estimated_cost_eur?: number | null
  estimated_cost_usd?: number | null
  planner_note?: string | null // Visible to couple (deprecated - use custom_note)
  custom_note?: string | null // Per-couple override of library default_note
  couple_status?: VendorStatus
  couple_note?: string | null // Visible to planner
  created_at: string // ISO timestamp
  updated_at: string // ISO timestamp
  vendor_library?: VendorLibrary | null // Joined data from vendor_library table
}

// Shared vendor WITH library vendor details (for display)
export interface SharedVendorWithLibrary extends SharedVendor {
  library_vendor?: VendorLibrary | null
}

export interface CreateSharedVendorInput {
  planner_couple_id: string
  vendor_name: string
  vendor_type: string
  contact_name?: string
  email?: string
  phone?: string
  instagram?: string
  website?: string
  estimated_cost_eur?: number
  estimated_cost_usd?: number
  planner_note?: string
}

export interface UpdateSharedVendorInput {
  vendor_name?: string
  vendor_type?: string
  contact_name?: string
  email?: string
  phone?: string
  instagram?: string
  website?: string
  estimated_cost_eur?: number
  estimated_cost_usd?: number
  planner_note?: string
  couple_status?: VendorStatus
  couple_note?: string
}

// For couple updates (limited fields)
export interface CoupleUpdateVendorInput {
  couple_status?: VendorStatus
  couple_note?: string
}

// =============================================================================
// Vendor Activity
// =============================================================================

export type ActivityAction =
  | 'vendor_shared'
  | 'status_changed'
  | 'note_added'
  | 'couple_note_added'
  | 'planner_note_updated'
  | 'vendor_created'
  | 'vendor_updated'
  | 'invitation_sent'

export type ActivityActor = 'planner' | 'couple'

export interface VendorActivity {
  id: string
  planner_couple_id: string
  shared_vendor_id?: string | null
  action: ActivityAction
  actor: ActivityActor
  old_value?: string | null
  new_value?: string | null
  created_at: string // ISO timestamp
}

export interface CreateActivityInput {
  planner_couple_id: string
  shared_vendor_id?: string
  action: ActivityAction
  actor: ActivityActor
  old_value?: string
  new_value?: string
}

// =============================================================================
// View Models (with joined data)
// =============================================================================

export interface SharedVendorWithCouple extends SharedVendor {
  couple: PlannerCouple
}

export interface ActivityWithVendor extends VendorActivity {
  vendor?: SharedVendor
  couple: PlannerCouple
}

export interface PlannerCoupleWithStats extends PlannerCouple {
  vendor_count: number
  reviewed_count: number // Vendors with couple_status set
  last_activity_text?: string
}

// =============================================================================
// Grouped Vendors (for display)
// =============================================================================

export interface VendorGroup {
  type: string // Photographer, Florist, etc.
  vendors: SharedVendor[]
  count: number
}

// =============================================================================
// Tag Management
// =============================================================================

export interface TagWithCount {
  tag: string
  count: number
}

export interface VendorTagsResponse {
  tags: TagWithCount[]
  total_tags: number
  total_vendors: number
  vendor_type: string | null
}

export interface TagSuggestionResponse {
  original_tag: string
  suggested_tag: string | null
  confidence: number
}

// =============================================================================
// Planner Session (for auth - MVP password gate)
// =============================================================================

export interface PlannerSession {
  authenticated: boolean
  timestamp: string
}
