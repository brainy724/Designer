import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../api'

export default function LoginPage() {
  const [login_id, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token, designer } = await api.login(login_id, password)
      localStorage.setItem('designer_token', token)
      localStorage.setItem('designer_info', JSON.stringify(designer))
      navigate('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-500 rounded-2xl shadow-lg shadow-rose-200 mb-4">
            <span className="text-3xl">✂️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">디자이너 로그인</h1>
          <p className="text-gray-500 mt-1 text-sm">예약 관리 대시보드에 접속합니다.</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">아이디</label>
              <input
                type="text"
                value={login_id}
                onChange={e => setLoginId(e.target.value)}
                placeholder="아이디를 입력하세요"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-rose-500 text-white rounded-xl font-semibold hover:bg-rose-600 transition-colors shadow-lg shadow-rose-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  로그인 중...
                </span>
              ) : '로그인'}
            </button>
          </form>

          {/* Demo hint */}
          <div className="mt-5 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-xs text-gray-500 font-medium mb-2">테스트 계정</p>
            <div className="space-y-1 text-xs text-gray-400">
              <p>김지수: <code className="text-gray-600">jisu</code> / <code className="text-gray-600">1234</code></p>
              <p>이민준: <code className="text-gray-600">minjun</code> / <code className="text-gray-600">1234</code></p>
              <p>박소연: <code className="text-gray-600">soyeon</code> / <code className="text-gray-600">1234</code></p>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-gray-400 hover:text-rose-500 transition-colors">
            ← 예약 페이지로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  )
}
