import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, setKey } from '../api'
import { Cloud, KeyRound, Loader2, ShieldCheck, Cpu, Fingerprint } from 'lucide-react'

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
        setError(res.error || 'ACCESS DENIED. Invalid security key.')
      }
    } catch {
      setError('Uplink failed. Check connection to mainframe.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#050814] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Dynamic Space Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[100px] animate-pulse-glow" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
        
        {/* Grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />
        
        {/* Scanning line */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="w-full h-1 bg-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.5)] animate-scanline" />
        </div>
      </div>

      <div className="relative w-full max-w-md z-10 animate-slide-up">
        {/* Logo Section */}
        <div className="text-center mb-10 flex flex-col items-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="relative w-20 h-20 flex items-center justify-center mb-6">
            <div className="absolute inset-0 border border-cyan-500/30 rounded-full animate-[spin_4s_linear_infinite]" />
            <div className="absolute inset-1 border border-emerald-500/20 rounded-full animate-[spin_3s_linear_infinite_reverse]" />
            <div className="absolute inset-0 bg-cyan-950/40 rounded-full blur-md" />
            <Cpu className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] relative z-10" />
          </div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 tracking-widest drop-shadow-[0_0_10px_rgba(6,182,212,0.3)]">
            ASHFIR-SYS
          </h1>
          <p className="text-cyan-600/70 text-xs font-mono mt-2 tracking-[0.2em] uppercase">
            Secure Backup Mainframe
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#0b1221]/80 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-8 shadow-[0_0_40px_rgba(6,182,212,0.05)] relative overflow-hidden animate-fade-in" style={{ animationDelay: '0.4s' }}>
          
          {/* Card Corner Accents */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500/50 rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-500/50 rounded-tr-xl" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-500/50 rounded-bl-xl" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-500/50 rounded-br-xl" />

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-cyan-500/70 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Fingerprint className="w-3 h-3" /> Identity Key
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-cyan-500/20 blur-md rounded-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-500" />
                <div className="relative flex items-center bg-[#070b14] border border-cyan-900/50 rounded-lg overflow-hidden group-focus-within:border-cyan-500/50 transition-colors">
                  <div className="pl-4 pr-3 py-3 border-r border-cyan-900/50 bg-[#0a101d]">
                    <KeyRound className="w-4 h-4 text-cyan-600" />
                  </div>
                  <input
                    className="w-full bg-transparent text-cyan-100 placeholder-cyan-800/50 px-4 py-3 text-sm font-mono tracking-widest outline-none"
                    placeholder="CB-XXXX-XXXX-XXXX"
                    value={key}
                    onChange={(e) => { setKeyInput(e.target.value.toUpperCase()); setError('') }}
                    autoFocus
                    spellCheck={false}
                  />
                </div>
              </div>
              {error && (
                <p className="mt-3 text-red-400 text-xs font-mono flex items-start gap-2 bg-red-500/10 p-2 rounded border border-red-500/20">
                  <span className="shrink-0 mt-0.5 w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                  {error}
                </p>
              )}
            </div>

            <button 
              className="w-full relative group overflow-hidden rounded-lg disabled:opacity-50 disabled:cursor-not-allowed" 
              disabled={loading || !key.trim()}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-emerald-600 opacity-80 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-20 animate-scanline bg-white" />
              <div className="relative flex items-center justify-center gap-2 py-3.5 px-6 text-white font-mono text-sm tracking-widest font-bold">
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin text-cyan-200" /> AUTHENTICATING...</>
                  : <><ShieldCheck className="w-4 h-4 text-cyan-200" /> INITIALIZE UPLINK</>
                }
              </div>
            </button>
          </form>

          {/* Info Section */}
          <div className="mt-8 pt-6 border-t border-cyan-900/30">
            <p className="text-cyan-700 text-[10px] uppercase tracking-widest text-center mb-3">
              Deploy Agent Node To Acquire Key
            </p>
            <div className="bg-[#050810] rounded p-3 font-mono text-[11px] text-emerald-400 border border-emerald-900/30 flex justify-between items-center group">
              <span>&gt; python install.py</span>
              <div className="w-1.5 h-3 bg-emerald-400 animate-pulse" />
            </div>
          </div>
        </div>

        <div className="text-center mt-8 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/30 border border-cyan-900/50">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
            <span className="text-[9px] text-cyan-600 font-mono tracking-widest uppercase">System Online • Secure Connection</span>
          </div>
        </div>
      </div>
    </div>
  )
}
