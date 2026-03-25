import type { Designer, Service, Booking, BookingStats } from './types'

const BASE = '/api'

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('designer_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...authHeaders() }
  const res = await fetch(url, { headers, ...options })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '오류가 발생했습니다.')
  return data as T
}

export const api = {
  // Public
  getDesigners: () => request<Designer[]>(`${BASE}/designers`),
  getServices: () => request<Service[]>(`${BASE}/services`),
  getAvailableSlots: (designer_id: number, date: string, service_id: number) =>
    request<string[]>(`${BASE}/available-slots?designer_id=${designer_id}&date=${date}&service_id=${service_id}`),

  createBooking: (data: {
    customer_name: string
    customer_phone: string
    customer_email?: string
    designer_id: number
    service_id: number
    booking_date: string
    booking_time: string
    notes?: string
  }) => request<Booking>(`${BASE}/bookings`, { method: 'POST', body: JSON.stringify(data) }),

  // Auth
  login: (login_id: string, password: string) =>
    request<{ token: string; designer: Designer }>(`${BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ login_id, password }),
    }),

  // Protected
  getMyBookings: (params?: { date?: string; status?: string; from?: string; to?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString()
    return request<Booking[]>(`${BASE}/bookings/my${q ? '?' + q : ''}`)
  },

  updateBookingStatus: (id: number, status: string) =>
    request<Booking>(`${BASE}/bookings/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  getStats: () => request<BookingStats>(`${BASE}/bookings/stats`),
}
