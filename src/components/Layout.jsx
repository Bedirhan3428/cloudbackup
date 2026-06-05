import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Cpu, LayoutDashboard, FolderOpen, Settings, FileText, LogOut, Monitor, HardDrive, Zap, Sparkles, List, Shield } from 'lucide-react'
import { clearKey, api, getKey } from '../api'

const scrambleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+{}|:<>?';

function scrambleText(text) {
  if (!text) return text;
  return text.split('').map(char => {
    if (/\s/.test(char)) return char;
    return scrambleChars.charAt(Math.floor(Math.random() * scrambleChars.length));
  }).join('');
}

function scrambleDOM(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    if (node.nodeValue.trim().length > 0) {
      let parent = node.parentElement;
      let isNoScramble = false;
      while (parent) {
        if (
          parent.classList?.contains('no-scramble') ||
          parent.id === 'privacy_unlock_container' ||
          parent.tagName === 'INPUT' ||
          parent.tagName === 'TEXTAREA'
        ) {
          isNoScramble = true;
          break;
        }
        parent = parent.parentElement;
      }
      if (!isNoScramble) {
        node.nodeValue = scrambleText(node.nodeValue);
      }
    }
  } else {
    for (let i = 0; i < node.childNodes.length; i++) {
      scrambleDOM(node.childNodes[i]);
    }
  }
}

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/files',     icon: FolderOpen,      label: 'Dosyalar' },
  { to: '/incoming-files', icon: List,       label: 'Gelen Dosyalar' },
  { to: '/chat',      icon: Sparkles,        label: 'Intelligence' }, // AI Sayfası
  { to: '/settings',  icon: Settings,        label: 'Ayarlar' },
  { to: '/logs',      icon: FileText,        label: 'Terminal' },
  { to: '/system-map',icon: HardDrive,       label: 'Explorer' },
]

export default function Layout() {
  const navigate = useNavigate()
  const [agents, setAgents] = useState([])

  // Privacy Protection State
  const [privacyLocked, setPrivacyLocked] = useState(false)
  const [privacyHash, setPrivacyHash] = useState(null)
  const [privacyInput, setPrivacyInput] = useState('')
  const [privacyError, setPrivacyError] = useState('')

  useEffect(() => {
    api.getConfig().then(d => {
      if (d.privacy_password_hash) {
        setPrivacyHash(d.privacy_password_hash)
        if (localStorage.getItem('privacy_unlocked') !== 'true') {
          setPrivacyLocked(true)
        }
      }
    }).catch(() => {})
  }, [])

  // Global Obfuscator Effect
  useEffect(() => {
    if (!privacyLocked) return;

    let observer = null;
    
    // Initial run
    scrambleDOM(document.body);

    observer = new MutationObserver(() => {
      observer.disconnect();
      scrambleDOM(document.body);
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    const interval = setInterval(() => {
      if (observer) observer.disconnect();
      scrambleDOM(document.body);
      if (observer) {
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          characterData: true
        });
      }
    }, 100);

    return () => {
      if (observer) observer.disconnect();
      clearInterval(interval);
    };
  }, [privacyLocked]);

  async function handlePrivacyUnlock() {
    setPrivacyError('')
    if (!privacyInput.trim()) {
      setPrivacyError('Şifre boş olamaz.')
      return
    }
    const hash = await sha256(privacyInput.trim())
    if (hash === privacyHash) {
      localStorage.setItem('privacy_unlocked', 'true')
      setPrivacyLocked(false)
      setPrivacyInput('')
      setPrivacyError('')
      window.location.reload()
    } else {
      setPrivacyError('Hatalı şifre. Lütfen tekrar deneyin.')
    }
  }

  useEffect(() => {
    const load = () => api.getAgents().then(d => setAgents(d.agents || [])).catch(() => {})
    load()
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [])

  function logout() {
    clearKey()
    navigate('/login')
  }

  const onlineCount = agents.filter(a => a.online).length

  return (
    <div className="flex min-h-screen bg-[#050814]">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col fixed inset-y-0 left-0 z-30 bg-[#070b14]/90 backdrop-blur-xl border-r border-cyan-900/30">
        
        {/* Logo */}
        <div className="px-5 py-5 border-b border-cyan-900/30">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 border border-cyan-500/30 rounded-lg animate-pulse-glow" />
              <div className="w-8 h-8 rounded-lg bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center relative z-10">
                <Cpu className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 text-sm tracking-widest">ASHFIR</span>
          </div>
        </div>

        {/* Key badge */}
        <div className="px-4 py-2.5 border-b border-cyan-900/30">
          <div className="font-mono text-[9px] text-cyan-600/50 bg-[#050810] rounded px-2 py-1.5 truncate border border-cyan-900/20 tracking-wider">
            {getKey()}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-mono font-bold tracking-wider uppercase transition-all duration-200 ` +
                (isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                  : 'text-cyan-700 hover:text-cyan-400 hover:bg-cyan-500/5 border border-transparent')
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Agent status */}
        <div className="px-4 py-3 border-t border-cyan-900/30">
          <div className="text-[9px] font-mono font-bold text-cyan-700 uppercase tracking-[0.2em] mb-2">
            Connected Nodes
          </div>
          {agents.length === 0 ? (
            <div className="flex items-center gap-2 text-[10px] text-cyan-800 font-mono">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-900" />
              No agents linked
            </div>
          ) : (
            <div className="space-y-1.5">
              {agents.slice(0, 3).map(a => (
                <div key={a.machine_name} className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${a.online ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-cyan-900'}`} />
                  <div className="min-w-0">
                    <div className="text-[10px] text-cyan-400/80 truncate font-mono">{a.machine_name}</div>
                    <div className="text-[9px] text-cyan-700 font-mono">{a.files_uploaded} files</div>
                  </div>
                </div>
              ))}
              {agents.length > 3 && <div className="text-[9px] text-cyan-700 font-mono">+{agents.length - 3} more</div>}
            </div>
          )}
          {onlineCount > 0 && (
            <div className="mt-2 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-emerald-400" />
              <span className="text-[9px] text-emerald-400 font-mono font-bold tracking-wider">{onlineCount} ONLINE</span>
            </div>
          )}
        </div>

        {/* Logout */}
        <div className="px-3 pb-4">
          <button
            onClick={logout}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-mono text-cyan-800 hover:text-red-400 hover:bg-red-500/5 w-full transition-all border border-transparent hover:border-red-500/20 tracking-wider uppercase font-bold"
          >
            <LogOut className="w-4 h-4" />
            Disconnect
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="ml-56 flex-1 h-screen overflow-auto relative">
        {/* Subtle grid background */}
        <div className="fixed inset-0 ml-56 pointer-events-none grid-bg opacity-50" />
        <div className="relative z-10">
          <Outlet />
        </div>
      </div>

      {/* Privacy lock screen modal */}
      {privacyLocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md no-scramble animate-fade-in" id="privacy_unlock_container">
          <div className="card p-6 border-red-500/20 bg-[#0b1221]/95 w-full max-w-md shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-amber-500 to-red-500" />
            
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(239,68,68,0.25)] animate-pulse">
                <Shield className="w-6 h-6 text-red-400" />
              </div>
              <h2 className="text-sm font-mono font-bold tracking-widest text-red-400 uppercase">
                GİZLİLİK VE VERİ KİLİDİ AKTİF
              </h2>
              <p className="text-[10px] text-red-500/60 font-mono mt-1 uppercase tracking-wider">
                PRIVACY DECRYPTION REQUIRED
              </p>
            </div>

            <p className="text-xs text-cyan-300 mb-5 text-center leading-relaxed font-mono">
              Web sitesindeki veri isimleri, başlıklar ve dosyalar kilitlenmiştir. İçeriği görüntülemek için lütfen Gizlilik Şifresini girin.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[9px] font-mono font-bold text-cyan-600 uppercase tracking-widest mb-1.5">
                  GİZLİLİK ŞİFRESİ
                </label>
                <input
                  type="password"
                  className="inp text-center tracking-widest font-mono text-cyan-100"
                  value={privacyInput}
                  onChange={e => setPrivacyInput(e.target.value)}
                  placeholder="••••••"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handlePrivacyUnlock()
                    }
                  }}
                />
              </div>

              {privacyError && (
                <div className="p-2.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-mono text-center animate-slide-up">
                  {privacyError}
                </div>
              )}

              <button
                onClick={handlePrivacyUnlock}
                className="w-full btn-primary flex items-center justify-center gap-2 border-red-500/25 hover:border-red-500/40 text-red-400 hover:text-red-300 bg-red-500/5 hover:bg-red-500/10 transition-all font-mono text-xs"
              >
                <Zap className="w-4 h-4 text-red-400" />
                VERİ KİLİDİNİ AÇ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
