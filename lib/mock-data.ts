import { Vendor } from '@/types/vendor'
import { RSVP } from '@/types/rsvp'

export const DEMO_COUPLE = {
  bride: 'Bella',
  groom: 'Edward',
  lastName: 'Cullen',
  weddingDate: 'September 20-22, 2026',
  location: 'Hacienda de los Naranjos, Seville, Spain'
}

// Helper to generate dates relative to today
const getDateFromToday = (daysOffset: number): string => {
  const date = new Date()
  date.setDate(date.getDate() + daysOffset)
  return date.toISOString().split('T')[0]
}

// EUR to USD conversion rate: ~1.10
// Total budget: ~€45,500 (~$50,050)
export const MOCK_VENDORS: Vendor[] = [
  {
    id: 'vendor-1',
    vendor_name: 'Hacienda de los Naranjos',
    vendor_type: 'Venue',
    contact_name: 'Maria Garcia',
    email: 'events@haciendanaranjos.es',
    phone: '+34 954 123 456',
    website: 'https://haciendanaranjos.es',
    vendor_currency: 'EUR',
    vendor_cost: 14000,
    cost_converted: 15400,
    cost_converted_currency: 'USD',
    contract_required: true,
    contract_signed: true,
    contract_signed_date: '2025-08-15',
    payments: [
      {
        id: 'payment-1-1',
        description: 'Deposit (50%)',
        amount: 7000,
        amount_currency: 'EUR',
        amount_converted: 7700,
        amount_converted_currency: 'USD',
        due_date: '2025-09-01',
        paid: true,
        paid_date: '2025-08-20',
        payment_type: 'bank_transfer',
        refundable: true
      },
      {
        id: 'payment-1-2',
        description: 'Final payment (50%)',
        amount: 7000,
        amount_currency: 'EUR',
        amount_converted: 7700,
        amount_converted_currency: 'USD',
        due_date: '2026-08-20',
        paid: false,
        payment_type: 'bank_transfer',
        refundable: false
      }
    ],
    notes: 'Full venue rental for 3 days, includes ceremony and reception spaces',
    created_at: '2025-07-10T10:00:00Z',
    updated_at: '2025-08-20T15:30:00Z'
  },
  {
    id: 'vendor-2',
    vendor_name: 'Catering Services',
    vendor_type: 'Caterer',
    contact_name: 'Carlos Rodriguez',
    email: 'carlos@andalusiancatering.es',
    phone: '+34 954 234 567',
    vendor_currency: 'EUR',
    vendor_cost: 12000,
    cost_converted: 13200,
    cost_converted_currency: 'USD',
    contract_required: true,
    contract_signed: true,
    contract_signed_date: '2025-11-20',
    payments: [
      {
        id: 'payment-2-1',
        description: 'Deposit (30%)',
        amount: 3600,
        amount_currency: 'EUR',
        amount_converted: 3960,
        amount_converted_currency: 'USD',
        due_date: '2025-12-01',
        paid: true,
        paid_date: '2025-11-25',
        payment_type: 'bank_transfer',
        refundable: true
      },
      {
        id: 'payment-2-2',
        description: '2nd payment (40%)',
        amount: 4800,
        amount_currency: 'EUR',
        amount_converted: 5280,
        amount_converted_currency: 'USD',
        due_date: '2026-02-10',
        paid: true,
        paid_date: '2026-02-08',
        payment_type: 'bank_transfer',
        refundable: false
      },
      {
        id: 'payment-2-3',
        description: 'Final payment (30%)',
        amount: 3600,
        amount_currency: 'EUR',
        amount_converted: 3960,
        amount_converted_currency: 'USD',
        due_date: '2026-09-01',
        paid: false,
        payment_type: 'bank_transfer',
        refundable: false
      }
    ],
    notes: 'Full catering for 100 guests, includes tapas, dinner, and late-night snacks',
    created_at: '2025-10-15T11:00:00Z',
    updated_at: '2026-02-08T14:20:00Z'
  },
  {
    id: 'vendor-3',
    vendor_name: 'Photography Studio',
    vendor_type: 'Photographer',
    contact_name: 'Ana Lopez',
    email: 'ana@sevillephoto.es',
    phone: '+34 954 345 678',
    website: 'https://sevillephoto.es',
    vendor_currency: 'EUR',
    vendor_cost: 5500,
    cost_converted: 6050,
    cost_converted_currency: 'USD',
    contract_required: true,
    contract_signed: true,
    contract_signed_date: '2025-10-10',
    payments: [
      {
        id: 'payment-3-1',
        description: 'Deposit (40%)',
        amount: 2200,
        amount_currency: 'EUR',
        amount_converted: 2420,
        amount_converted_currency: 'USD',
        due_date: '2025-11-01',
        paid: true,
        paid_date: '2025-10-28',
        payment_type: 'bank_transfer',
        refundable: false
      },
      {
        id: 'payment-3-2',
        description: 'Balance (60%)',
        amount: 3300,
        amount_currency: 'EUR',
        amount_converted: 3630,
        amount_converted_currency: 'USD',
        due_date: '__DYNAMIC_DATE_OFFSET_5__',
        paid: false,
        payment_type: 'bank_transfer',
        refundable: false
      }
    ],
    notes: 'Full weekend coverage, includes engagement session',
    created_at: '2025-09-20T10:00:00Z',
    updated_at: '2025-10-28T16:45:00Z'
  },
  {
    id: 'vendor-4',
    vendor_name: 'Floral Design',
    vendor_type: 'Florist',
    contact_name: 'Isabel Fernandez',
    email: 'isabel@spanishflorals.es',
    phone: '+34 954 456 789',
    vendor_currency: 'EUR',
    vendor_cost: 4500,
    cost_converted: 4950,
    cost_converted_currency: 'USD',
    contract_required: true,
    contract_signed: true,
    contract_signed_date: '2026-01-10',
    payments: [
      {
        id: 'payment-4-1',
        description: 'Deposit (50%)',
        amount: 2250,
        amount_currency: 'EUR',
        amount_converted: 2475,
        amount_converted_currency: 'USD',
        due_date: '2026-01-20',
        paid: true,
        paid_date: '2026-01-18',
        payment_type: 'bank_transfer',
        refundable: false
      },
      {
        id: 'payment-4-2',
        description: 'Final payment (50%)',
        amount: 2250,
        amount_currency: 'EUR',
        amount_converted: 2475,
        amount_converted_currency: 'USD',
        due_date: '2026-09-10',
        paid: false,
        payment_type: 'bank_transfer',
        refundable: false
      }
    ],
    notes: 'Bridal bouquet, centerpieces, ceremony arch, and venue decorations',
    created_at: '2025-12-15T13:00:00Z',
    updated_at: '2026-01-18T11:25:00Z'
  },
  {
    id: 'vendor-5',
    vendor_name: 'Live Entertainment',
    vendor_type: 'Entertainment',
    contact_name: 'Miguel Santos',
    email: 'miguel@flamencoent.es',
    phone: '+34 954 567 890',
    vendor_currency: 'EUR',
    vendor_cost: 3100,
    cost_converted: 3410,
    cost_converted_currency: 'USD',
    contract_required: true,
    contract_signed: true,
    contract_signed_date: '2026-01-25',
    payments: [
      {
        id: 'payment-5-1',
        description: 'Deposit (40%)',
        amount: 1240,
        amount_currency: 'EUR',
        amount_converted: 1364,
        amount_converted_currency: 'USD',
        due_date: '2026-02-05',
        paid: true,
        paid_date: '2026-02-03',
        payment_type: 'bank_transfer',
        refundable: false
      },
      {
        id: 'payment-5-2',
        description: 'Final payment (60%)',
        amount: 1860,
        amount_currency: 'EUR',
        amount_converted: 2046,
        amount_converted_currency: 'USD',
        due_date: '2026-09-05',
        paid: false,
        payment_type: 'cash',
        refundable: false
      }
    ],
    notes: 'Live flamenco performance during cocktail hour and DJ for reception',
    created_at: '2026-01-05T15:00:00Z',
    updated_at: '2026-02-03T09:15:00Z'
  },
  {
    id: 'vendor-6',
    vendor_name: 'Wedding Videography',
    vendor_type: 'Videographer',
    contact_name: 'David Martinez',
    email: 'david@weddingfilms.es',
    phone: '+34 954 678 901',
    website: 'https://weddingfilms.es',
    vendor_currency: 'EUR',
    vendor_cost: 3200,
    cost_converted: 3520,
    cost_converted_currency: 'USD',
    contract_required: true,
    contract_signed: true,
    contract_signed_date: '2026-01-28',
    payments: [
      {
        id: 'payment-6-1',
        description: 'Deposit (50%)',
        amount: 1600,
        amount_currency: 'EUR',
        amount_converted: 1760,
        amount_converted_currency: 'USD',
        due_date: getDateFromToday(30),
        paid: false,
        payment_type: 'bank_transfer',
        refundable: true
      },
      {
        id: 'payment-6-2',
        description: 'Final payment (50%)',
        amount: 1600,
        amount_currency: 'EUR',
        amount_converted: 1760,
        amount_converted_currency: 'USD',
        due_date: '2026-09-12',
        paid: false,
        payment_type: 'bank_transfer',
        refundable: false
      }
    ],
    notes: 'Full-day video coverage with highlight reel and full ceremony edit',
    created_at: '2026-01-28T14:00:00Z',
    updated_at: '2026-01-28T14:00:00Z'
  },
  {
    id: 'vendor-7',
    vendor_name: 'Wedding Cakes',
    vendor_type: 'Cake',
    contact_name: 'Laura Jimenez',
    email: 'laura@sweetcelebrations.es',
    phone: '+34 954 789 012',
    vendor_currency: 'EUR',
    vendor_cost: 1200,
    cost_converted: 1320,
    cost_converted_currency: 'USD',
    contract_required: false,
    contract_signed: false,
    payments: [
      {
        id: 'payment-7-1',
        description: 'Full payment',
        amount: 1200,
        amount_currency: 'EUR',
        amount_converted: 1320,
        amount_converted_currency: 'USD',
        due_date: '2026-09-08',
        paid: false,
        payment_type: 'cash',
        refundable: false
      }
    ],
    notes: 'Three-tier wedding cake serving 100 guests',
    created_at: '2026-02-01T10:00:00Z',
    updated_at: '2026-02-01T10:00:00Z'
  },
  {
    id: 'vendor-8',
    vendor_name: 'Hair & Makeup',
    vendor_type: 'Hair & Makeup',
    contact_name: 'Sofia Ruiz',
    email: 'sofia@sevillehairandmakeup.es',
    phone: '+34 954 890 123',
    vendor_currency: 'EUR',
    vendor_cost: 800,
    cost_converted: 880,
    cost_converted_currency: 'USD',
    contract_required: false,
    contract_signed: true,
    contract_signed_date: '2026-01-30',
    payments: [
      {
        id: 'payment-8-1',
        description: 'Deposit (50%)',
        amount: 400,
        amount_currency: 'EUR',
        amount_converted: 440,
        amount_converted_currency: 'USD',
        due_date: getDateFromToday(45),
        paid: false,
        payment_type: 'bank_transfer',
        refundable: false
      },
      {
        id: 'payment-8-2',
        description: 'Final payment (50%)',
        amount: 400,
        amount_currency: 'EUR',
        amount_converted: 440,
        amount_converted_currency: 'USD',
        due_date: '2026-09-20',
        paid: false,
        payment_type: 'cash',
        refundable: false
      }
    ],
    notes: 'Bridal hair and makeup on wedding day',
    created_at: '2026-01-22T11:00:00Z',
    updated_at: '2026-01-30T16:30:00Z'
  },
  {
    id: 'vendor-9',
    vendor_name: 'Wedding Invitations',
    vendor_type: 'Stationery',
    contact_name: 'Pedro Moreno',
    email: 'pedro@printperfect.es',
    phone: '+34 954 901 234',
    vendor_currency: 'EUR',
    vendor_cost: 1200,
    cost_converted: 1320,
    cost_converted_currency: 'USD',
    contract_required: false,
    contract_signed: true,
    contract_signed_date: '2025-12-05',
    payments: [
      {
        id: 'payment-9-1',
        description: 'Full payment',
        amount: 1200,
        amount_currency: 'EUR',
        amount_converted: 1320,
        amount_converted_currency: 'USD',
        due_date: '2025-12-20',
        paid: true,
        paid_date: '2025-12-18',
        payment_type: 'bank_transfer',
        refundable: false
      }
    ],
    notes: 'Save the dates, invitations, programs, and thank you cards for 100 guests',
    created_at: '2025-11-15T09:00:00Z',
    updated_at: '2025-12-18T14:45:00Z'
  }
]

export const MOCK_RSVPS: any[] = [
  {
    id: 'rsvp-1',
    name: 'Sophie Anderson',
    email: 'sophie.anderson@email.com',
    phone: '+1 416 555 0101',
    attending: true,
    number_of_guests: 2,
    guests: [
      { name: 'Marcus Anderson', order: 1 }
    ],
    dietary_restrictions: 'Vegetarian',
    created_at: '2026-01-10T14:20:00Z',
    updated_at: '2026-01-10T14:20:00Z'
  },
  {
    id: 'rsvp-2',
    name: 'Michael Chen',
    email: 'michael.chen@email.com',
    phone: '+1 647 555 0202',
    attending: true,
    number_of_guests: 1,
    guests: [],
    created_at: '2026-01-12T09:30:00Z',
    updated_at: '2026-01-12T09:30:00Z'
  },
  {
    id: 'rsvp-3',
    name: 'Emily Davis',
    email: 'emily.davis@email.com',
    phone: '+1 905 555 0303',
    attending: false,
    number_of_guests: 0,
    guests: [],
    message: 'So sorry, will be traveling for work',
    created_at: '2026-01-08T16:45:00Z',
    updated_at: '2026-01-08T16:45:00Z'
  },
  {
    id: 'rsvp-4',
    name: 'James Wilson',
    email: 'james.wilson@email.com',
    phone: '+1 416 555 0404',
    attending: true,
    number_of_guests: 2,
    guests: [
      { name: 'Patricia Wilson', order: 1 }
    ],
    dietary_restrictions: 'Gluten-free',
    created_at: '2026-01-15T11:00:00Z',
    updated_at: '2026-01-15T11:00:00Z'
  },
  {
    id: 'rsvp-5',
    name: 'Sarah Martinez',
    email: 'sarah.martinez@email.com',
    phone: '+1 647 555 0505',
    attending: true,
    number_of_guests: 1,
    guests: [],
    created_at: '2026-01-18T13:15:00Z',
    updated_at: '2026-01-18T13:15:00Z'
  },
  {
    id: 'rsvp-6',
    name: 'David Thompson',
    email: 'david.thompson@email.com',
    phone: '+1 905 555 0606',
    attending: true,
    number_of_guests: 3,
    guests: [
      { name: 'Linda Thompson', order: 1 },
      { name: 'Tommy Thompson', order: 2 }
    ],
    created_at: '2026-01-20T10:30:00Z',
    updated_at: '2026-01-20T10:30:00Z'
  },
  {
    id: 'rsvp-7',
    name: 'Jennifer Lee',
    email: 'jennifer.lee@email.com',
    phone: '+1 416 555 0707',
    attending: false,
    number_of_guests: 0,
    guests: [],
    created_at: '2026-01-14T15:20:00Z',
    updated_at: '2026-01-14T15:20:00Z'
  },
  {
    id: 'rsvp-8',
    name: 'Robert Garcia',
    email: 'robert.garcia@email.com',
    phone: '+1 647 555 0808',
    attending: true,
    number_of_guests: 2,
    guests: [
      { name: 'Maria Garcia', order: 1 }
    ],
    dietary_restrictions: 'No seafood',
    created_at: '2026-01-22T09:45:00Z',
    updated_at: '2026-01-22T09:45:00Z'
  },
  {
    id: 'rsvp-9',
    name: 'Amanda Parker',
    email: 'amanda.parker@email.com',
    phone: '+1 416 555 0909',
    attending: true,
    number_of_guests: 3,
    guests: [
      { name: 'Jason Parker', order: 1 },
      { name: 'Lily Parker', order: 2 }
    ],
    dietary_restrictions: 'Nut allergy (Lily)',
    created_at: '2026-01-24T14:30:00Z',
    updated_at: '2026-01-24T14:30:00Z'
  },
  {
    id: 'rsvp-10',
    name: 'Christopher Brown',
    email: 'chris.brown@email.com',
    phone: '+1 905 555 1010',
    attending: true,
    number_of_guests: 2,
    guests: [
      { name: 'Elizabeth Brown', order: 1 }
    ],
    created_at: '2026-01-26T11:15:00Z',
    updated_at: '2026-01-26T11:15:00Z'
  }
]
