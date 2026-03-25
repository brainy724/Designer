import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Booking, BookingStats, Designer } from '../types'
import { api } from '../api'

const STATUS_CONFIG = {
  pending: { label: '대기중', color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
  confirmed: { label: '확정', color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-400' },
  completed: { label: '완료', color: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-400' },
  cancelled: { label: '취소', color: 'bg-gray-100 text-gray-500 border-gray-200', dot: 'bg-gray-400' },
}

const ACTION_BUTTONS: Record<string, { next: string; label: string; color: string }[]> = {
  pending: [
    { next: 'confirmed', label: '예약 확정', color: 'bg-blue-500 hover:bg-blue-600 text-white' },
    { next: 'cancelled', label: '취소', color: 'bg-white hover:bg-red-50 text-red-500 border border-red-200' },
  ],
  confirmed: [
    { next: 'completed', label: '방문 완료', color: 'bg-green-500 hover:bg-green-600 text-white' },
    { next: 'cancelled', label: '취소', color: 'bg-white hover:bg-red-50 text-red-500 border border-red-200' },
  ],
  completed: [],
  cancelled: [],
}

function formatPrice(p: number) {
  return p.toLocaleString('ko-KR') + '원'
}

function formatDuration(m: number) {
  if (m < 60) return `${m}분`
  const h = Math.floor(m / 60), rem = m % 60
  return rem ? `${h}시간 ${rem}분` : `${h}시간`
}

function formatDateLabel(dateStr: string) {
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  if (dateStr === today) return '오늘'
  if (dateStr === tomorrow) return '내일'
  const d = new Date(dateStr)
  return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-50">
      <p className="text-xs text-gray-400 font-medium mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

function BookingCard({
  booking,
  onStatusChange,
}: {
  booking: Booking
  onStatusChange: (id: number, status: string) => Promise<void>
}) {
  const [loading, setLoading] = useState(false)
  const config = STATUS_CONFIG[booking.status]
  const actions = ACTION_BUTTONS[booking.status] || []

  const handleAction = async (next: string) => {
    setLoading(true)
    await onStatusChange(booking.id, next)
    setLoading(false)
  }

  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${
      booking.status === 'cancelled' ? 'opacity-60' : ''
    }`}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-800 text-lg">{booking.booking_time}</span>
          <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium ${config.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
            {config.label}
          </span>
        </div>
        <span className="text-xs text-gray-400">#{booking.id}</span>
      </div>

      <div className="p-4">
        {/* Customer & Service */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-bold text-gray-800">{booking.customer_name}</p>
            <p className="text-sm text-gray-500">{booking.customer_phone}</p>
            {booking.customer_email && (
              <p className="text-xs text-gray-400">{booking.customer_email}</p>
            )}
          </div>
          <div className="text-right">
            <p className="font-semibold text-gray-700">{booking.service_name}</p>
            <p className="text-sm text-rose-500 font-bold">{formatPrice(booking.price)}</p>
            <p className="text-xs text-gray-400">{formatDuration(booking.duration_minutes)}</p>
          </div>
        </div>

        {/* Notes */}
        {booking.notes && (
          <div className="bg-gray-50 rounded-lg px-3 py-2 mb-3">
            <p className="text-xs text-gray-400 mb-0.5">요청 사항</p>
            <p className="text-sm text-gray-600">{booking.notes}</p>
          </div>
        )}

        {/* Actions */}
        {actions.length > 0 && (
          <div className="flex gap-2 mt-3">
            {actions.map(action => (
              <button
                key={action.next}
                onClick={() => handleAction(action.next)}
                disabled={loading}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${action.color}`}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

type FilterStatus = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'
type ViewMode = 'today' | 'upcoming' | 'all'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [designer, setDesigner] = useState<Designer | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [stats, setStats] = useState<BookingStats | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('today')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('designer_info')
    if (stored) setDesigner(JSON.parse(stored))
  }, [])

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      let params: Parameters<typeof api.getMyBookings>[0] = {}

      if (viewMode === 'today') params = { date: today }
      else if (viewMode === 'upcoming') params = { from: today }
      else if (viewMode === 'all') params = {}

      if (filterStatus !== 'all') params.status = filterStatus
      const data = await api.getMyBookings(params)
      setBookings(data)
    } catch {
      // handle silently
    } finally {
      setLoading(false)
    }
  }, [viewMode, filterStatus])

  const fetchStats = useCallback(async () => {
    try {
      const data = await api.getStats()
      setStats(data)
    } catch {
      // handle silently
    }
  }, [])

  useEffect(() => {
    fetchBookings()
    fetchStats()
  }, [fetchBookings, fetchStats])

  const handleStatusChange = async (id: number, status: string) => {
    try {
      const updated = await api.updateBookingStatus(id, status)
      setBookings(prev => prev.map(b => b.id === id ? updated : b))
      fetchStats()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('designer_token')
    localStorage.removeItem('designer_info')
    navigate('/login')
  }

  // Group bookings by date
  const grouped = bookings.reduce<Record<string, Booking[]>>((acc, b) => {
    if (!acc[b.booking_date]) acc[b.booking_date] = []
    acc[b.booking_date].push(b)
    return acc
  }, {})
  const sortedDates = Object.keys(grouped).sort()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500 flex items-center justify-center">
              <span className="text-lg">✂️</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-800 text-base leading-none">예약 관리</h1>
              {designer && <p className="text-xs text-gray-400 mt-0.5">{designer.name} 디자이너</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" target="_blank" className="text-xs px-3 py-1.5 rounded-lg bg-rose-50 text-rose-500 font-medium hover:bg-rose-100 transition-colors">
              예약 페이지
            </a>
            <button
              onClick={handleLogout}
              className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500 font-medium hover:bg-gray-200 transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 w-full flex-1">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard label="오늘 전체" value={stats.today_total} color="text-gray-800" />
            <StatCard label="대기중" value={stats.today_pending} color="text-amber-600" />
            <StatCard label="완료" value={stats.today_completed} color="text-green-600" />
            <StatCard label="예정 예약" value={stats.upcoming} color="text-blue-600" />
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-white rounded-xl border border-gray-100 p-3 mb-4 flex flex-wrap gap-3">
          {/* View Mode */}
          <div className="flex gap-1.5 flex-1 min-w-0">
            {([
              { key: 'today', label: '오늘' },
              { key: 'upcoming', label: '예정' },
              { key: 'all', label: '전체' },
            ] as const).map(v => (
              <button
                key={v.key}
                onClick={() => setViewMode(v.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === v.key ? 'bg-rose-500 text-white' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex gap-1.5 flex-wrap">
            {([
              { key: 'all', label: '전체' },
              { key: 'pending', label: '대기' },
              { key: 'confirmed', label: '확정' },
              { key: 'completed', label: '완료' },
              { key: 'cancelled', label: '취소' },
            ] as const).map(s => (
              <button
                key={s.key}
                onClick={() => setFilterStatus(s.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === s.key
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-500 hover:bg-gray-100 border border-gray-100'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Booking List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">📭</div>
            <p className="font-medium">예약이 없습니다.</p>
            <p className="text-sm mt-1">다른 기간이나 상태를 선택해보세요.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map(date => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-bold text-gray-800">{formatDateLabel(date)}</span>
                  <span className="text-sm text-gray-400">
                    {new Date(date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-rose-100 text-rose-500 rounded-full font-medium">
                    {grouped[date].length}건
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {grouped[date].map(booking => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
