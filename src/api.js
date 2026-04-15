// Backend URL — Render üzerindeki canlı sunucun
const BASE = "https://cloudbackup-server.onrender.com/api";

export const getKey = () => localStorage.getItem('cb_key')
export const setKey = (k) => localStorage.setItem('cb_key', k)
export const clearKey = () => localStorage.removeItem('cb_key')

async function req(path, opts = {}) {
  const key = getKey()
  // URL Yapısı: https://cloudbackup-server.onrender.com/api/CB-XXXX/path
  const url = `${BASE}/${key}${path}`

  const res = await fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...opts.headers },
  })

  const data = await res.json().catch(() => ({ error: res.statusText }))
  if (!res.ok) throw new Error(data.error || res.statusText)
  return data
}

export const api = {
  // Giriş kontrolü
  auth: (key) =>
    fetch(`${BASE}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    }).then((r) => r.json()),

  getConfig: () => req('/config'),
  saveConfig: (cfg) => req('/config', { method: 'POST', body: JSON.stringify(cfg) }),

  getFiles: (params = {}) => req('/files?' + new URLSearchParams(params)),
  browseFiles: (dir = '') => req('/files/browse?dir=' + encodeURIComponent(dir)),
  getDownloadUrl: (path) => req('/files/download?path=' + encodeURIComponent(path)),
  deleteFile: (path) => req('/files/delete', { method: 'DELETE', body: JSON.stringify({ path }) }),

  getAgents: () => req('/agents'),
  selfDestruct: (machine_name) => req('/agents/self-destruct', { method: 'POST', body: JSON.stringify({ machine_name }) }),
  cancelSelfDestruct: (machine_name) => req('/agents/self-destruct', { method: 'DELETE', body: JSON.stringify({ machine_name }) }),
  getLogs: (lines = 100) => req('/logs?lines=' + lines),
  getStats: () => req('/stats'),
}