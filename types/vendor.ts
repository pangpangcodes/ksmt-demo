export interface Payment {
  id: string
  description: string  // "Deposit", "2nd payment", "Final payment", etc.
  amount: number  // Amount in vendor's currency
  amount_currency: string  // Explicit currency for this payment
  amount_converted?: number  // Converted amount (flexible, not hardcoded to CAD!)
  amount_converted_currency?: string  // Currency for converted amount (CAD, USD, etc.)
  payment_type?: 'cash' | 'bank_transfer'  // Payment method
  due_date?: string
  paid: boolean
  paid_date?: string
  refundable?: boolean  // If true, exclude from total cost calculation
}

export interface Vendor {
  id: string
  created_at: string
  updated_at: string
  vendor_type: string
  vendor_name?: string
  contact_name?: string
  email?: string
  phone?: string
  website?: string
  vendor_currency?: string
  vendor_cost?: number  // Auto-calculated by database trigger from payments
  cost_converted?: number  // Auto-calculated by database trigger from payments
  cost_converted_currency?: string  // Currency for converted amount (usually USD for demo)
  contract_required: boolean  // Does this vendor need a contract?
  contract_signed: boolean
  contract_signed_date?: string
  payments: Payment[]  // Flexible payment tracking
  notes?: string
  skip_completion_prompt?: boolean  // Don't prompt to complete missing details
}

export interface VendorFormData {
  vendor_type: string
  vendor_name: string
  contact_name: string
  email: string
  phone: string
  website: string
  vendor_currency: string
  vendor_cost: string  // Auto-calculated by database trigger
  cost_converted: string  // Auto-calculated by database trigger
  converted_currency: string  // User's preferred conversion currency
  contract_required: boolean
  contract_signed: boolean
  contract_signed_date: string
  payments: Payment[]
  notes: string
}

export interface VendorStats {
  totalVendors: number
  totalCost: number
  totalPaid: number
  totalOutstanding: number
}

export const VENDOR_TYPES = [
  'DJ',
  'Entertainer',
  'Makeup Artist',
  'Photographer',
  'Videographer',
  'Florist',
  'Caterer',
  'Venue',
  'Baker',
  'Officiant',
  'Transportation',
  'Other'
] as const

export const CURRENCIES = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
] as const

// AI Parsing interfaces
export interface ParsedVendorOperation {
  action: 'create' | 'update'
  vendor_id?: string // For updates
  vendor_data: Partial<VendorFormData>
  confidence?: number
  ambiguous_fields?: string[]
  warnings?: string[]
  matched_vendor_name?: string
}

export interface ParseResult {
  operations: ParsedVendorOperation[]
  clarifications_needed: Array<{
    question: string
    field: string  // The vendor_data field this clarification is for (e.g., "vendor_name", "total_cost")
    field_type?: 'text' | 'number' | 'date' | 'email' | 'phone' | 'choice'  // Input type for the field
    context?: string
    operation_index?: number  // Which operation this clarification relates to (0-based)
    required?: boolean  // Can this be skipped?
    choices?: string[]  // For choice type: ["Skip", "Update", "Create new"]
  }>
  processing_time_ms: number
}
