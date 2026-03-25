import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { BookingFormData, BookingStep, Designer, Service } from '../types'
import { api } from '../api'

const STEPS: { key: BookingStep; label: string }[] = [
  { key: 'service', label: '서비스' },
  { key: 'designer', label: '디자이너' },
  { key: 'datetime', label: '날짜/시간' },
  { key: 'info', label: '고객정보' },
  { key: 'confirm', label: '확인' },
]

const STATUS_COLORS: Record<string, string> = {
  커트: 'bg-blue-100 text-blue-700',
  컬러: 'bg-amber-100 text-amber-700',
  펌: 'bg-purple-100 text-purple-700',
  케어: 'bg-green-100 text-green-700',
}

function formatPrice(price: number) {
  return price.toLocaleString('ko-KR') + '원'
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes}분`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h}시간 ${m}분` : `${h}시간`
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
}

// ─── Step Components ──────────────────────────────────────────────────────────

function ServiceStep({
  services, selected, onSelect,
}: {
  services: Service[]
  selected: Service | null
  onSelect: (s: Service) => void
}) {
  const categories = [...new Set(services.map(s => s.category))]
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-1">서비스를 선택해주세요</h2>
      <p className="text-sm text-gray-500 mb-6">원하시는 시술을 선택하세요.</p>
      {categories.map(cat => (
        <div key={cat} className="mb-6">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[cat] || 'bg-gray-100 text-gray-600'}`}>{cat}</span>
          </h3>
          <div className="grid gap-3">
            {services.filter(s => s.category === cat).map(service => (
              <button
                key={service.id}
                onClick={() => onSelect(service)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  selected?.id === service.id
                    ? 'border-rose-500 bg-rose-50'
                    : 'border-gray-100 bg-white hover:border-rose-200 hover:bg-rose-50/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{service.name}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{service.description}</p>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="font-bold text-rose-600">{formatPrice(service.price)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDuration(service.duration_minutes)}</p>
                  </div>
                </div>
                {selected?.id === service.id && (
                  <div className="mt-2 flex items-center gap-1 text-rose-500 text-sm font-medium">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    선택됨
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function DesignerStep({
  designers, selected, onSelect,
}: {
  designers: Designer[]
  selected: Designer | null
  onSelect: (d: Designer) => void
}) {
  const AVATARS = ['👩‍🎨', '👨‍🎨', '💇‍♀️']
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-1">디자이너를 선택해주세요</h2>
      <p className="text-sm text-gray-500 mb-6">원하시는 디자이너를 선택하세요.</p>
      <div className="grid gap-4">
        {designers.map((designer, i) => (
          <button
            key={designer.id}
            onClick={() => onSelect(designer)}
            className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
              selected?.id === designer.id
                ? 'border-rose-500 bg-rose-50'
                : 'border-gray-100 bg-white hover:border-rose-200 hover:bg-rose-50/30'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-100 to-pink-200 flex items-center justify-center text-2xl flex-shrink-0">
                {AVATARS[i % AVATARS.length]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-gray-800 text-lg">{designer.name}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 font-medium">
                    {designer.specialty}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">{designer.description}</p>
                <p className="text-xs text-gray-400 mt-2">
                  영업시간: {designer.working_start} ~ {designer.working_end}
                </p>
              </div>
            </div>
            {selected?.id === designer.id && (
              <div className="mt-2 flex items-center gap-1 text-rose-500 text-sm font-medium">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                선택됨
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

function DateTimeStep({
  designer, service, date, time, onDateChange, onTimeChange,
}: {
  designer: Designer
  service: Service
  date: string
  time: string
  onDateChange: (d: string) => void
  onTimeChange: (t: string) => void
}) {
  const [slots, setSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  // Build calendar dates (today + next 30 days)
  const calendarDays: Date[] = []
  for (let i = 0; i < 30; i++) {
    const d = new Date()
    d.setDate(today.getDate() + i)
    calendarDays.push(d)
  }

  // Group by week
  const weeks: (Date | null)[][] = []
  let currentWeek: (Date | null)[] = []
  const firstDayOfWeek = calendarDays[0].getDay()
  for (let i = 0; i < firstDayOfWeek; i++) currentWeek.push(null)
  for (const day of calendarDays) {
    currentWeek.push(day)
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null)
    weeks.push(currentWeek)
  }

  useEffect(() => {
    if (!date) return
    setLoadingSlots(true)
    api.getAvailableSlots(designer.id, date, service.id)
      .then(s => { setSlots(s); onTimeChange('') })
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [date])

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-1">날짜와 시간을 선택해주세요</h2>
      <p className="text-sm text-gray-500 mb-6">방문하실 날짜와 시간을 선택하세요.</p>

      {/* Calendar */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-5">
        <div className="grid grid-cols-7 mb-2">
          {['일', '월', '화', '수', '목', '금', '토'].map(d => (
            <div key={d} className={`text-center text-xs font-medium py-1 ${d === '일' ? 'text-rose-400' : d === '토' ? 'text-blue-400' : 'text-gray-400'}`}>{d}</div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((day, di) => {
              if (!day) return <div key={di} />
              const dayStr = day.toISOString().split('T')[0]
              const isSelected = dayStr === date
              const isSunday = di === 0
              return (
                <button
                  key={di}
                  onClick={() => onDateChange(dayStr)}
                  className={`aspect-square rounded-full text-sm font-medium transition-all flex items-center justify-center ${
                    isSelected
                      ? 'bg-rose-500 text-white shadow-md'
                      : isSunday
                      ? 'text-rose-400 hover:bg-rose-50'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {day.getDate()}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* Time Slots */}
      {date && (
        <div>
          <p className="text-sm font-medium text-gray-600 mb-3">
            {formatDate(date)} 가능한 시간
          </p>
          {loadingSlots ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
            </div>
          ) : slots.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>선택 가능한 시간이 없습니다.</p>
              <p className="text-sm mt-1">다른 날짜를 선택해주세요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {slots.map(slot => (
                <button
                  key={slot}
                  onClick={() => onTimeChange(slot)}
                  className={`py-2.5 rounded-lg text-sm font-medium border transition-all ${
                    time === slot
                      ? 'bg-rose-500 text-white border-rose-500 shadow-md'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-rose-300 hover:bg-rose-50'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function InfoStep({
  data, onChange,
}: {
  data: Pick<BookingFormData, 'customer_name' | 'customer_phone' | 'customer_email' | 'notes'>
  onChange: (key: string, value: string) => void
}) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-1">고객 정보를 입력해주세요</h2>
      <p className="text-sm text-gray-500 mb-6">예약 확인을 위해 정확하게 입력해주세요.</p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            이름 <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={data.customer_name}
            onChange={e => onChange('customer_name', e.target.value)}
            placeholder="홍길동"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            연락처 <span className="text-rose-500">*</span>
          </label>
          <input
            type="tel"
            value={data.customer_phone}
            onChange={e => onChange('customer_phone', e.target.value)}
            placeholder="010-0000-0000"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            이메일 <span className="text-gray-400 text-xs font-normal">(선택)</span>
          </label>
          <input
            type="email"
            value={data.customer_email}
            onChange={e => onChange('customer_email', e.target.value)}
            placeholder="example@email.com"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            요청 사항 <span className="text-gray-400 text-xs font-normal">(선택)</span>
          </label>
          <textarea
            value={data.notes}
            onChange={e => onChange('notes', e.target.value)}
            placeholder="원하시는 스타일이나 특이사항을 적어주세요."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent transition-all resize-none"
          />
        </div>
      </div>
    </div>
  )
}

function ConfirmStep({ data }: { data: BookingFormData }) {
  const rows = [
    { label: '서비스', value: data.service ? `${data.service.name} (${formatDuration(data.service.duration_minutes)})` : '' },
    { label: '디자이너', value: data.designer?.name || '' },
    { label: '예약 일시', value: data.date && data.time ? `${formatDate(data.date)} ${data.time}` : '' },
    { label: '금액', value: data.service ? formatPrice(data.service.price) : '' },
    { label: '이름', value: data.customer_name },
    { label: '연락처', value: data.customer_phone },
    { label: '이메일', value: data.customer_email || '-' },
    { label: '요청 사항', value: data.notes || '-' },
  ]
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-1">예약 정보를 확인해주세요</h2>
      <p className="text-sm text-gray-500 mb-6">아래 내용으로 예약을 신청합니다.</p>
      <div className="bg-rose-50 rounded-xl p-5 mb-4 border border-rose-100">
        <div className="space-y-3">
          {rows.map(row => (
            <div key={row.label} className="flex gap-3">
              <span className="text-sm text-gray-500 w-20 flex-shrink-0">{row.label}</span>
              <span className="text-sm font-medium text-gray-800">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-400 text-center">예약 후 변경/취소는 살롱에 직접 연락해주세요.</p>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const INITIAL_FORM: BookingFormData = {
  service: null, designer: null, date: '', time: '',
  customer_name: '', customer_phone: '', customer_email: '', notes: '',
}

const STEP_KEYS: BookingStep[] = ['service', 'designer', 'datetime', 'info', 'confirm']

export default function BookingPage() {
  const [step, setStep] = useState<BookingStep>('service')
  const [form, setForm] = useState<BookingFormData>(INITIAL_FORM)
  const [designers, setDesigners] = useState<Designer[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<{ id: number } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.getDesigners(), api.getServices()])
      .then(([d, s]) => { setDesigners(d); setServices(s) })
      .catch(() => setError('데이터를 불러오는데 실패했습니다. 서버가 실행 중인지 확인해주세요.'))
  }, [])

  const stepIdx = STEP_KEYS.indexOf(step)

  const canNext = () => {
    if (step === 'service') return !!form.service
    if (step === 'designer') return !!form.designer
    if (step === 'datetime') return !!(form.date && form.time)
    if (step === 'info') return !!(form.customer_name.trim() && form.customer_phone.trim())
    return true
  }

  const goNext = async () => {
    if (step === 'confirm') {
      await handleSubmit()
      return
    }
    setStep(STEP_KEYS[stepIdx + 1])
  }

  const handleSubmit = async () => {
    if (!form.service || !form.designer) return
    setLoading(true)
    setError('')
    try {
      const result = await api.createBooking({
        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        customer_email: form.customer_email || undefined,
        designer_id: form.designer.id,
        service_id: form.service.id,
        booking_date: form.date,
        booking_time: form.time,
        notes: form.notes || undefined,
      })
      setSuccess({ id: result.id })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '예약에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">예약 완료!</h2>
          <p className="text-gray-500 mb-2">예약번호: <span className="font-bold text-rose-500">#{success.id}</span></p>
          <p className="text-sm text-gray-400 mb-6">
            디자이너가 예약을 확인 후 연락드릴 예정입니다.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => { setSuccess(null); setForm(INITIAL_FORM); setStep('service') }}
              className="w-full py-3 bg-rose-500 text-white rounded-xl font-semibold hover:bg-rose-600 transition-colors"
            >
              새 예약하기
            </button>
            <p className="text-xs text-gray-400">예약 변경/취소는 살롱에 직접 문의해주세요.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✂️</span>
            <h1 className="text-lg font-bold text-gray-800">헤어살롱 예약</h1>
          </div>
          <Link to="/login" className="text-sm text-gray-400 hover:text-rose-500 transition-colors">
            디자이너 로그인
          </Link>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  i < stepIdx ? 'bg-rose-500 text-white' :
                  i === stepIdx ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {i < stepIdx ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  ) : i + 1}
                </div>
                <span className={`text-xs mt-1 font-medium ${i === stepIdx ? 'text-rose-500' : 'text-gray-400'}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-8 sm:w-12 mx-1 mb-4 transition-all ${i < stepIdx ? 'bg-rose-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {step === 'service' && (
            <ServiceStep services={services} selected={form.service} onSelect={s => setForm(f => ({ ...f, service: s }))} />
          )}
          {step === 'designer' && (
            <DesignerStep designers={designers} selected={form.designer} onSelect={d => setForm(f => ({ ...f, designer: d }))} />
          )}
          {step === 'datetime' && form.designer && form.service && (
            <DateTimeStep
              designer={form.designer}
              service={form.service}
              date={form.date}
              time={form.time}
              onDateChange={d => setForm(f => ({ ...f, date: d, time: '' }))}
              onTimeChange={t => setForm(f => ({ ...f, time: t }))}
            />
          )}
          {step === 'info' && (
            <InfoStep
              data={form}
              onChange={(key, value) => setForm(f => ({ ...f, [key]: value }))}
            />
          )}
          {step === 'confirm' && <ConfirmStep data={form} />}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {stepIdx > 0 && (
            <button
              onClick={() => setStep(STEP_KEYS[stepIdx - 1])}
              className="flex-1 py-3.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
            >
              이전
            </button>
          )}
          <button
            onClick={goNext}
            disabled={!canNext() || loading}
            className={`flex-1 py-3.5 rounded-xl font-semibold transition-all ${
              canNext() && !loading
                ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-200'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                처리 중...
              </span>
            ) : step === 'confirm' ? '예약 신청하기' : '다음'}
          </button>
        </div>
      </div>
    </div>
  )
}
