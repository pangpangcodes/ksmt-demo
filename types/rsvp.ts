export interface RSVP {
  id: string
  created_at: string
  updated_at?: string
  name: string
  email: string
  phone?: string
  attending: boolean
  number_of_guests?: number
  dietary_restrictions?: string
  message?: string
  submission_ip?: string
}

export interface RSVPGuest {
  id: string
  created_at: string
  rsvp_id: string
  guest_name: string
  guest_order: number
}

export interface RSVPSubmission {
  name: string
  email: string
  phone: string
  attending: boolean
  number_of_guests?: number
  dietary_restrictions?: string
  message?: string
  plusOnes?: Array<{ name: string }>
}

export interface RSVPViewData {
  id: string
  name: string
  email: string
  phone: string
  attending: boolean
  number_of_guests?: number
  dietary_restrictions?: string
  message?: string
  guests?: Array<{ guest_name?: string; name?: string; order: number }>
  createdAt: string
}

export interface Question {
  id: string
  question: string
  answer?: string
}
