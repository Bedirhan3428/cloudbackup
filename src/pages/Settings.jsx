import { useEffect, useState } from 'react'
import { api } from '../api'
import { Save, Plus, X, Loader2, CheckCircle2, Eye, EyeOff, Skull, AlertTriangle } from 'lucide-react'

function Section({ title, children }) {
  return (
    <div className="card p-6 mb-5">
      <h2 className="text-sm font-bold text-slate-200 mb-5 pb-3 border-b border-[#162033]">{title}</h2>
      {children}
    </div>
  )
}

function Toggle({ checked, onChange, label, desc }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <div className="text-sm font-medium text-slate-300">{label}</div>
        {desc && <div className="text-xs text-slate-600 mt-0.5">{desc}</div>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full border transition-all duration-200 flex-shrink-0 ${
          checked ? 'bg-blue-600 border-blue-500' : 'bg-bg border-[#162033]'
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
          <span key={t} className="inline-flex items-center gap-1 badge bg-blue-500/8 text-blue-400 border border-blue-500/15 py-1 px-2.5">
            <span className="font-mono text-[11px]">{t}</span>
            <button onClick={() => onRemove(i)} className="text-slate-600 hover:text-red-400 transition-colors ml-0.5">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {tags.length === 0 && <span className="text-xs text-slate-700 italic self-center">{placeholder}</span>}
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
          <Plus className="w-3.5 h-3.5" /> Ekle
        </button>
      </div>
    </div>
  )
}

export default function Settings() {
  const [cfg, setCfg]           = useState(null)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [showKey, setShowKey]   = useState(false)
  const [newAllow, setNewAllow] = useState('')
  const [newBlock, setNewBlock] = useState('')
  const [newPath, setNewPath]   = useState('')

  // Self-Destruct state
  const [agents, setAgents]                 = useState([])
  const [destructTarget, setDestructTarget] = useState(null)
  const [destructStep, setDestructStep]     = useState(0)
  const [destructToast, setDestructToast]   = useState(null)

  useEffect(() => { api.getConfig().then(d => setCfg(d)).catch(() => {}) }, [])
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
      await api.saveConfig(cfg)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {}
    setSaving(false)
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
      setDestructToast('\u{1F480} \u0130mha komutu "' + destructTarget + '" i\u00e7in g\u00f6nderildi!')
      setTimeout(() => setDestructToast(null), 5000)
    } catch (e) {
      setDestructToast('\u274C \u0130mha hatas\u0131: ' + e.message)
      setTimeout(() => setDestructToast(null), 5000)
    }
    cancelDestruct()
  }

  if (!cfg) return (
    <div className="p-8 flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
    </div>
  )

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Ayarlar</h1>
          <p className="text-slate-500 text-sm mt-0.5">Yedekleme konfig&uuml;rasyonu</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'Kaydediliyor...' : saved ? 'Kaydedildi!' : 'Kaydet'}
        </button>
      </div>

      {saved && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          Ayarlar kaydedildi. Agent 30 saniye i&ccedil;inde g&uuml;ncellenecek.
        </div>
      )}

      {/* AI Filter */}
      <Section title="&#x1F916; AI Filtre — Groq Llama 70B">
        <Toggle
          checked={cfg.ai_filter_enabled !== false}
          onChange={v => set('ai_filter_enabled', v)}
          label="AI Filtreyi Aktif Et"
          desc="Yedeklenmesi gereken dosyalar&#x0131; Llama 70B se&ccedil;er"
        />
        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Groq API Key</label>
          <div className="relative">
            <input
              className="inp font-mono pr-10"
              type={showKey ? 'text' : 'password'}
              value={cfg.groq_api_key || ''}
              onChange={e => set('groq_api_key', e.target.value)}
              placeholder="gsk_..."
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400" onClick={() => setShowKey(!showKey)}>
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <a href="https://console.groq.com" target="_blank" rel="noreferrer" className="text-[11px] text-blue-500 hover:text-blue-400 mt-1 inline-block">
            console.groq.com&apos;dan &uuml;cretsiz alabilirsiniz &rarr;
          </a>
        </div>
        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Model</label>
          <select className="inp" value={cfg.ai_model || 'llama-3.3-70b-versatile'} onChange={e => set('ai_model', e.target.value)}>
            <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (&Ouml;nerilen)</option>
            <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (H&#x0131;zl&#x0131;)</option>
            <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
          </select>
        </div>
      </Section>

      {/* Watch paths */}
      <Section title="&#x1F4C1; &#x0130;zlenen Klas&ouml;rler">
        <div className="space-y-2 mb-3">
          {(cfg.watch_paths || []).map((p, i) => (
            <div key={i} className="flex gap-2">
              <input className="inp font-mono" value={p} onChange={e => { const a = [...cfg.watch_paths]; a[i] = e.target.value; set('watch_paths', a) }} />
              <button className="btn-danger p-2.5 flex-shrink-0" onClick={() => set('watch_paths', cfg.watch_paths.filter((_, j) => j !== i))}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input className="inp font-mono" value={newPath} onChange={e => setNewPath(e.target.value)} placeholder={'C:\\Users\\...\\Documents'} onKeyDown={e => e.key==='Enter' && addPath()} />
          <button className="btn-ghost flex-shrink-0 flex items-center gap-1.5" onClick={addPath}><Plus className="w-3.5 h-3.5" />Ekle</button>
        </div>
      </Section>

      {/* Extensions */}
      <Section title="&#x1F50D; Dosya Uzant&#x0131;lar&#x0131;">
        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">
            &#x0130;zin Verilenler <span className="text-slate-700 font-normal normal-case">(bo&#x015F; = hepsi)</span>
          </label>
          <TagList
            tags={cfg.allowed_extensions || []}
            onRemove={i => removeExt('allow', i)}
            placeholder="T&uuml;m uzant&#x0131;lara izin veriliyor"
            onAdd={() => addExt('allow')}
            addValue={newAllow}
            setAddValue={setNewAllow}
          />
        </div>
        <div className="border-t border-[#162033] pt-5">
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">Engellenenler</label>
          <TagList
            tags={cfg.blocked_extensions || []}
            onRemove={i => removeExt('block', i)}
            placeholder="Engellenen uzant&#x0131; yok"
            onAdd={() => addExt('block')}
            addValue={newBlock}
            setAddValue={setNewBlock}
          />
        </div>
      </Section>

      {/* General */}
      <Section title="&#x2699;&#xFE0F; Genel">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Maks. Dosya Boyutu (MB)</label>
            <input className="inp" type="number" min={1} value={cfg.max_file_size_mb || 50} onChange={e => set('max_file_size_mb', +e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Debounce (sn)</label>
            <input className="inp" type="number" min={0.5} step={0.5} value={cfg.debounce_seconds || 2} onChange={e => set('debounce_seconds', +e.target.value)} />
          </div>
        </div>
        <div className="space-y-1 border-t border-[#162033] pt-4">
          <Toggle checked={!!cfg.sync_on_start} onChange={v => set('sync_on_start', v)} label="Ba&#x015F;lang&#x0131;&ccedil;ta Senkronize Et" desc="Agent a&ccedil;&#x0131;l&#x0131;nca mevcut dosyalar&#x0131; y&uuml;kle" />
          <Toggle checked={!!cfg.delete_on_remove} onChange={v => set('delete_on_remove', v)} label="PC'den Silinince Firebase'den de Sil" desc="Dikkatli kullan!" />
        </div>
      </Section>

      {/* Flash Drive */}
      <Section title="&#x1F4BE; Flash S&uuml;r&uuml;c&uuml; Yedekleme">
        <Toggle
          checked={cfg.flash_enabled !== false}
          onChange={v => set('flash_enabled', v)}
          label="Flash S&uuml;r&uuml;c&uuml; Yedeklemeyi Aktif Et"
          desc="USB / flash tak&#x0131;l&#x0131;nca dosyalar&#x0131; otomatik yedekle"
        />
        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
            Maksimum Dosya Boyutu (MB)
          </label>
          <input
            className="inp w-40"
            type="number"
            min={1}
            max={100}
            value={cfg.flash_max_mb ?? 10}
            onChange={e => set('flash_max_mb', +e.target.value)}
          />
          <p className="text-xs text-slate-600 mt-2">
            Bu boyutun &uuml;zerindeki flash dosyalar&#x0131; atlan&#x0131;r. &Ouml;nerilen: 10 MB.
          </p>
        </div>
        <div className="mt-4 p-3 rounded-lg bg-blue-500/5 border border-blue-500/15 text-xs text-slate-500">
          <strong className="text-blue-400">Nas&#x0131;l &ccedil;al&#x0131;&#x015F;&#x0131;r?</strong>
          <br />
          Flash tak&#x0131;l&#x0131;nca dosyalar &ouml;nce PC&apos;deki stage klas&ouml;r&uuml;ne kopyalan&#x0131;r,
          sonra oradan yedeklenir. Flash &ccedil;ekilse bile yedekleme yar&#x0131;da kalmaz.
        </div>
      </Section>

      {/* Firebase */}
      <Section title="&#x1F525; Firebase">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Storage Bucket</label>
            <input className="inp font-mono" value={cfg.firebase?.storage_bucket || ''} onChange={e => set('firebase.storage_bucket', e.target.value)} placeholder="proje.appspot.com" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Credentials JSON Yolu</label>
            <input className="inp font-mono" value={cfg.firebase?.credentials_path || ''} onChange={e => set('firebase.credentials_path', e.target.value)} placeholder="firebase-credentials.json" />
          </div>
        </div>
      </Section>

      {/* ══ SELF-DESTRUCT SECTION ══ */}
      <div className="card p-6 mb-5 border-red-500/20 bg-red-500/[0.02]">
        <h2 className="text-sm font-bold text-red-400 mb-5 pb-3 border-b border-red-500/15 flex items-center gap-2">
          <Skull className="w-4 h-4" />
          Kendini &#x0130;mha — Self Destruct
        </h2>

        <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/15 text-xs text-slate-400 mb-5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-red-400">D&#x0130;KKAT — GER&#x0130; ALINAMAZ!</strong>
              <p className="mt-1 text-slate-500">
                Bu komut, hedef bilgisayardaki agent&apos;&#x0131; kal&#x0131;c&#x0131; olarak siler. Agent .exe dosyas&#x0131;, yap&#x0131;land&#x0131;rma dosyalar&#x0131;
                ve t&uuml;m izler kald&#x0131;r&#x0131;l&#x0131;r. Bu i&#x015F;lem geri al&#x0131;namaz.
              </p>
              <p className="mt-1.5 text-slate-600">
                Ak&#x0131;&#x015F;: Komut g&ouml;nderilir &rarr; Agent heartbeat&apos;te okur &rarr; Batch dosyas&#x0131; olu&#x015F;turur &rarr; Kendini kapat&#x0131;r &rarr; Batch .exe&apos;yi siler &rarr; Batch kendini siler
              </p>
            </div>
          </div>
        </div>

        {agents.length === 0 ? (
          <div className="text-sm text-slate-600 text-center py-4">
            Ba&#x011F;l&#x0131; bilgisayar bulunamad&#x0131;.
          </div>
        ) : (
          <div className="space-y-2">
            {agents.map(a => (
              <div key={a.machine_name} className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-[#162033]">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${a.online ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]' : 'bg-slate-600'}`} />
                  <div>
                    <div className="text-sm font-medium text-slate-300">{a.machine_name}</div>
                    <div className="text-[10px] text-slate-600">
                      {a.online ? '&#x00C7;evrimi&ccedil;i' : '&#x00C7;evrimd&#x0131;&#x015F;&#x0131;'} &bull; {a.files_uploaded || 0} dosya y&uuml;klendi
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => startDestruct(a.machine_name)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                             bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300
                             border border-red-500/20 hover:border-red-500/40 transition-all duration-150"
                >
                  <Skull className="w-3.5 h-3.5" />
                  &#x0130;mha Et
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══ SELF-DESTRUCT CONFIRMATION MODAL ══ */}
      {destructStep > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0d1525] border border-red-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl shadow-red-500/10">

            {destructStep === 1 && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-red-400">&#x0130;mha Onay&#x0131; — 1/2</h3>
                    <p className="text-xs text-slate-500">&quot;{destructTarget}&quot; imha edilecek</p>
                  </div>
                </div>
                <p className="text-sm text-slate-400 mb-5">
                  <strong className="text-red-400">{destructTarget}</strong> bilgisayar&#x0131;ndaki agent kal&#x0131;c&#x0131; olarak silinecek.
                  Agent&apos;&#x0131;n .exe dosyas&#x0131;, konfig&uuml;rasyon dosyalar&#x0131; ve t&uuml;m izleri kald&#x0131;r&#x0131;lacak.
                </p>
                <div className="flex gap-3">
                  <button onClick={cancelDestruct} className="btn-ghost flex-1">&#x0130;ptal</button>
                  <button
                    onClick={() => setDestructStep(2)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold
                               bg-red-500/15 hover:bg-red-500/25 text-red-400 hover:text-red-300
                               border border-red-500/25 hover:border-red-500/40 transition-all"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Evet, Devam Et
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
                    <h3 className="text-base font-bold text-red-400">Son Onay — 2/2</h3>
                    <p className="text-xs text-red-400/60">GER&#x0130; ALINAMAZ</p>
                  </div>
                </div>
                <p className="text-sm text-slate-400 mb-2">
                  Bu i&#x015F;lem <strong className="text-red-400">geri al&#x0131;namaz</strong>. Agent silindikten sonra o bilgisayar&#x0131; tekrar izlemek i&ccedil;in
                  agent&apos;&#x0131; yeniden y&uuml;klemeniz gerekir.
                </p>
                <div className="my-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400/80 font-mono text-center">
                  {destructTarget} &rarr; &#x0130;MHA ED&#x0130;LECEK
                </div>
                <div className="flex gap-3">
                  <button onClick={cancelDestruct} className="btn-ghost flex-1">Vazge&ccedil;</button>
                  <button
                    onClick={executeDestruct}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold
                               bg-red-600 hover:bg-red-500 text-white
                               border border-red-500 hover:border-red-400 transition-all
                               active:scale-[0.98]"
                  >
                    <Skull className="w-4 h-4" />
                    &#x0130;MHA ET
                  </button>
                </div>
              </>
            )}

            {destructStep === 3 && (
              <div className="flex flex-col items-center py-4">
                <Loader2 className="w-8 h-8 animate-spin text-red-400 mb-3" />
                <p className="text-sm text-slate-400">&#x0130;mha komutu g&ouml;nderiliyor...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Self-Destruct Toast */}
      {destructToast && (
        <div className="fixed bottom-6 right-6 bg-[#0d1525] border border-red-500/30 rounded-xl px-5 py-3.5 text-sm
                        shadow-2xl shadow-red-500/10 z-50 text-red-400">
          {destructToast}
        </div>
      )}
    </div>
  )
}
