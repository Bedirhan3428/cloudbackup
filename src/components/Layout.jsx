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
  const [privacyLockoutSecs, setPrivacyLockoutSecs] = useState(0)

  useEffect(() => {
    const checkLockout = () => {
      const lockoutUntil = Number(localStorage.getItem('privacy_lockout_until') || 0);
      if (lockoutUntil > Date.now()) {
        setPrivacyLockoutSecs(Math.ceil((lockoutUntil - Date.now()) / 1000));
      } else {
        setPrivacyLockoutSecs(0);
      }
    };
    checkLockout();
    const t = setInterval(checkLockout, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    api.getConfig().then(async (d) => {
      if (d.privacy_password_hash) {
        setPrivacyHash(d.privacy_password_hash)
        const token = localStorage.getItem('privacy_unlocked_token')
        if (!token) {
          setPrivacyLocked(true)
        } else {
          try {
            const verifyRes = await api.checkPrivacyToken(token)
            if (verifyRes.ok) {
              setPrivacyLocked(false)
            } else {
              setPrivacyLocked(true)
              localStorage.removeItem('privacy_unlocked_token')
            }
          } catch {
            setPrivacyLocked(true)
          }
        }
      }
    }).catch(() => {})
  }, [])

  // Periodically verify the token validity
  useEffect(() => {
    if (!privacyHash) return;
    const interval = setInterval(async () => {
      const token = localStorage.getItem('privacy_unlocked_token')
      if (!token) {
        setPrivacyLocked(true)
      } else {
        try {
          const verifyRes = await api.checkPrivacyToken(token)
          if (!verifyRes.ok) {
            setPrivacyLocked(true)
            localStorage.removeItem('privacy_unlocked_token')
          }
        } catch {
          setPrivacyLocked(true)
        }
      }
    }, 30000); // check every 30s
    return () => clearInterval(interval);
  }, [privacyHash]);

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
    const lockoutUntil = Number(localStorage.getItem('privacy_lockout_until') || 0);
    if (Date.now() < lockoutUntil) {
      return;
    }
    if (!privacyInput.trim()) {
      setPrivacyError('Şifre boş olamaz.')
      return
    }
    try {
      const res = await api.verifyPrivacyPassword(privacyInput.trim())
      if (res.ok) {
        localStorage.setItem('privacy_unlocked_token', res.token)
        setPrivacyLocked(false)
        setPrivacyInput('')
        setPrivacyError('')
        localStorage.removeItem('privacy_failed_attempts')
        localStorage.removeItem('privacy_lockout_until')
        window.location.reload()
      } else {
        const failed = Number(localStorage.getItem('privacy_failed_attempts') || 0) + 1;
        localStorage.setItem('privacy_failed_attempts', failed);
        if (failed >= 5) {
          const blockTime = Date.now() + 30000;
          localStorage.setItem('privacy_lockout_until', blockTime);
          setPrivacyError('Çok fazla hatalı deneme. 30 saniye engellendiniz.');
        } else {
          setPrivacyError(`Hatalı şifre. Kalan hak: ${5 - failed}`);
        }
      }
    } catch (err) {
      setPrivacyError('Bağlantı hatası: ' + err.message);
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

        {/* Privacy Lock Card */}
        {privacyHash && (
          <div className="px-4 py-3 border-b border-cyan-900/30 no-scramble">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[8px] font-mono font-bold tracking-widest uppercase ${privacyLocked ? 'text-red-400' : 'text-emerald-400'}`}>
                {privacyLocked ? '🔒 VERİ KİLİTLİ' : '🔓 GİZLİLİK AÇIK'}
              </span>
              {!privacyLocked && (
                <button 
                  onClick={() => {
                    localStorage.removeItem('privacy_unlocked_token');
                    window.location.reload();
                  }}
                  className="text-[8px] font-mono text-cyan-700 hover:text-red-400 transition-colors uppercase font-bold"
                >
                  KİLİTLE
                </button>
              )}
            </div>
            
            {privacyLocked ? (
              <div className="space-y-1.5">
                <input
                  type="password"
                  className="inp text-[10px] font-mono text-center tracking-widest py-1 bg-[#050810]"
                  value={privacyInput}
                  onChange={e => setPrivacyInput(e.target.value)}
                  placeholder="Şifre Girin"
                  disabled={privacyLockoutSecs > 0}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && privacyLockoutSecs === 0) {
                      handlePrivacyUnlock()
                    }
                  }}
                />
                {privacyError && (
                  <div className="text-[8px] font-mono text-red-400 text-center">
                    {privacyError}
                  </div>
                )}
                <button
                  onClick={handlePrivacyUnlock}
                  disabled={privacyLockoutSecs > 0}
                  className="w-full btn-primary py-1 px-2 text-[8px] font-mono font-bold flex items-center justify-center gap-1 border-red-500/25 text-red-400 bg-red-500/5 hover:bg-red-500/10"
                >
                  <Zap className="w-2.5 h-2.5" />
                  {privacyLockoutSecs > 0 ? `ENGELLENDİ (${privacyLockoutSecs}s)` : 'KİLİT AÇ'}
                </button>
              </div>
            ) : (
              <div className="text-[9px] font-mono text-cyan-600/70 italic">
                Gizlilik şifresi aktif.
              </div>
            )}
          </div>
        )}

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
    </div>
  )
}
