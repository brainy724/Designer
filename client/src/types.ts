export interface Designer {
  id: number
  name: string
  specialty: string
  description: string
  working_start: string
  working_end: string
}

export interface Service {
  id: number
  name: string
  duration_minutes: number
  price: number
  description: string
  category: string
}

export interface Booking {
  id: number
  customer_name: string
  customer_phone: string
  customer_email: string | null
  designer_id: number
  service_id: number
  booking_date: string
  booking_time: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  notes: string | null
  created_at: string
  designer_name: string
  service_name: string
  price: number
  duration_minutes: number
  category?: string
}

export interface BookingStats {
  today_total: number
  today_pending: number
  today_confirmed: number
  today_completed: number
  upcoming: number
}

export type BookingStep = 'service' | 'designer' | 'datetime' | 'info' | 'confirm'

export interface BookingFormData {
  service: Service | null
  designer: Designer | null
  date: string
  time: string
  customer_name: string
  customer_phone: string
  customer_email: string
  notes: string
}
