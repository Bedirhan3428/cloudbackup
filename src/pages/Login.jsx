import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, setKey } from '../api'
import { Cloud, KeyRound, Loader2, ShieldCheck } from 'lucide-react'

export default function Login() {
  const [key, setKeyInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const nav = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!key.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await api.auth(key.trim())
      if (res.ok) {
        setKey(key.trim())
        nav('/dashboard')
      } else {
        setError(res.error || 'Geçersiz key. Lütfen kontrol edin.')
      }
    } catch {
      setError('Sunucuya bağlanılamadı. Server çalışıyor mu?')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 mb-5">
            <Cloud className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">CloudBackup</h1>
          <p className="text-slate-500 text-sm mt-1.5">Hesabınıza erişmek için key girin</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Hesap Key
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  className="inp pl-10 font-mono tracking-wider"
                  placeholder="CB-XXXX-XXXX-XXXX"
                  value={key}
                  onChange={(e) => { setKeyInput(e.target.value.toUpperCase()); setError('') }}
                  autoFocus
                  spellCheck={false}
                />
              </div>
              {error && (
                <p className="mt-2 text-red-400 text-xs flex items-center gap-1.5">
                  <span className="w-1 h-1 bg-red-400 rounded-full inline-block" />
                  {error}
                </p>
              )}
            </div>

            <button className="btn-primary w-full flex items-center justify-center gap-2 py-3" disabled={loading || !key.trim()}>
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" />Doğrulanıyor...</>
                : <><ShieldCheck className="w-4 h-4" />Bağlan</>
              }
            </button>
          </form>

          {/* Info */}
          <div className="mt-6 pt-5 border-t border-[#162033]">
            <p className="text-slate-600 text-xs text-center">
              Key almak için agenti yükleyin:
            </p>
            <div className="mt-2 bg-bg rounded-lg p-3 font-mono text-xs text-blue-400 border border-[#162033]">
              python install.py
            </div>
          </div>
        </div>

        <p className="text-center text-slate-700 text-xs mt-6">
          CloudBackup — Sessiz, akıllı yedekleme
        </p>
      </div>
    </div>
  )
}
