import { db, storage } from './firebase';
import forge from 'node-forge';
import JSZip from 'jszip';
import {
  doc, getDoc, setDoc, updateDoc, collection, query, orderBy, limit,
  getDocs, deleteDoc, where, startAfter, getCountFromServer
} from 'firebase/firestore';
import {
  ref, listAll, getDownloadURL, deleteObject, getMetadata
} from 'firebase/storage';

export const getKey = () => localStorage.getItem('cb_key')
export const setKey = (k) => localStorage.setItem('cb_key', k)
export const clearKey = () => localStorage.removeItem('cb_key')

// Helper for UI icons
const extIcon = (name) => {
  if (!name) return '📄';
  const ext = name.split('.').pop().toLowerCase();
  const map = {
    'pdf': '📄', 'doc': '📝', 'docx': '📝', 'xls': '📊', 'xlsx': '📊',
    'ppt': '📊', 'pptx': '📊', 'txt': '📄', 'rtf': '📄', 'csv': '📊',
    'png': '🖼️', 'jpg': '🖼️', 'jpeg': '🖼️', 'gif': '🖼️', 'webp': '🖼️',
    'bmp': '🖼️', 'svg': '🖼️', 'ico': '🖼️',
    'zip': '📦', 'rar': '📦', '7z': '📦', 'tar': '📦', 'gz': '📦',
    'mp4': '🎥', 'mov': '🎥', 'avi': '🎥', 'mkv': '🎥',
    'mp3': '🎵', 'wav': '🎵', 'flac': '🎵',
    'py': '🐍', 'js': '📜', 'ts': '📜', 'json': '📜', 'txt': '📄',
    'exe': '⚙️', 'dll': '⚙️',
  };
  return map[ext] || '📄';
};

const humanSize = (s) => {
  if (!s) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  while (s >= 1024 && i < units.length - 1) { s /= 1024; i++ }
  return `${s.toFixed(1)} ${units[i]}`
}

export const api = {
  // ── Giriş kontrolü ──────────────────────────────────────────
  auth: async (key) => {
    try {
      const d = await getDoc(doc(db, 'accounts', key));
      return { ok: d.exists() };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },

  // ── Config ──────────────────────────────────────────────────
  getConfig: async () => {
    const key = getKey();
    const d = await getDoc(doc(db, 'accounts', key, 'data', 'config'));
    if (!d.exists()) throw new Error('Config bulunamadı');
    return d.data();
  },

  saveConfig: async (cfg) => {
    const key = getKey();
    await setDoc(doc(db, 'accounts', key, 'data', 'config'), cfg);
  },

  // ── Stats — Firestore'dan okur (hızlı) ──────────────────────
  // Agent her yüklemede bu dokümanı günceller.
  getStats: async () => {
    const key = getKey();
    const [agentsRes, statsDoc] = await Promise.all([
      api.getAgents(),
      getDoc(doc(db, 'accounts', key, 'data', 'stats')),
    ]);
    const s = statsDoc.exists() ? statsDoc.data() : {};
    return {
      agent_count: agentsRes.agents.length,
      total_files: s.total_files || 0,
      total_size_human: humanSize(s.total_size || 0),
      ext_stats: s.ext_stats || {},
    };
  },

  // ── Dosya Listesi — Firestore index'inden okur (hızlı) ──────
  // Agent her yüklemede accounts/{key}/files/{hash} yazar.
  getFiles: async (params = {}) => {
    const key = getKey();
    const { search = '', ext = '', per_page = 50 } = params;

    let q = query(
      collection(db, 'accounts', key, 'files'),
      orderBy('backup_time', 'desc'),
      limit(per_page)
    );

    const snap = await getDocs(q);
    let files = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        icon: extIcon(data.name),
        name: data.name || '',
        path: data.path || '',
        size: data.size || 0,
        size_human: data.size_human || humanSize(data.size || 0),
        in_zip: data.in_zip || false,
        encrypted_aes_key: data.encrypted_aes_key || null,
        zip_name: data.zip_name || null,
        updated: data.updated || data.backup_time || '',
        backup_time: data.backup_time || '',
        original_path: data.original_path || '',
        machine: data.machine || '—',
        ai_reason: data.ai_reason || '',
        ai_confidence: data.ai_confidence || '',
        source_label: data.source_label || '',
        ext: data.ext || '',
      };
    });

    // Client-side filtreleme (Firestore'da full-text search yok)
    if (search) {
      const s = search.toLowerCase();
      files = files.filter(f =>
        f.name.toLowerCase().includes(s) ||
        f.original_path.toLowerCase().includes(s) ||
        f.machine.toLowerCase().includes(s)
      );
    }
    if (ext) {
      files = files.filter(f => f.name.toLowerCase().endsWith(ext.toLowerCase()));
    }

    return {
      files,
      total: snap.size,
      total_size_human: humanSize(files.reduce((acc, f) => acc + (f.size || 0), 0)),
    };
  },

  // ── Klasör Gezinme — Storage listAll (yapı gezimi) ──────────
  // Bu sayfa gerçek Storage yapısını gösterdiği için Storage kullanmak zorunda.
  // Ama metadata çekimi paralel yapılır.
  browseFiles: async (dir = '') => {
    const key = getKey();
    const normalizedDir = dir.replace(/\\/g, '/').replace(/^\/|\/$/g, '');
    const pathInStorage = normalizedDir
      ? `backups/${key}/${normalizedDir}`
      : `backups/${key}`;
    const folderRef = ref(storage, pathInStorage);

    const res = await listAll(folderRef);
    const folders = res.prefixes.map(p => p.name);

    // Metadata'ları paralel çek
    const files = await Promise.all(
      res.items.map(async (item) => {
        try {
          const meta = await getMetadata(item);
          const m = meta.customMetadata || {};
          return {
            icon: extIcon(item.name),
            name: item.name,
            path: item.fullPath,
            size: meta.size,
            size_human: humanSize(meta.size),
            updated: meta.updated,
            backup_time: m.backup_time || null,
            original_path: m.original_path || '',
            machine: m.source_machine || '—',
            ai_reason: m.ai_reason || '',
            ai_confidence: m.ai_confidence || '',
          };
        } catch {
          return {
            icon: '📄', name: item.name, path: item.fullPath,
            size: 0, size_human: '?', updated: '', backup_time: null,
            original_path: '', machine: '—', ai_reason: '', ai_confidence: '',
          };
        }
      })
    );

    const total_size = files.reduce((a, f) => a + (f.size || 0), 0);

    return {
      current_dir: dir,
      folders,
      files,
      total_files: files.length,
      total_folders: folders.length,
      total_size_human: humanSize(total_size),
    };
  },

  // ── İndirme URL ──────────────────────────────────────────────
  getDownloadUrl: async (path) => {
    const u = await getDownloadURL(ref(storage, path));
    return { url: u };
  },

  downloadAndDecryptFile: async (fileObj) => {
    if (!fileObj.in_zip || !fileObj.encrypted_aes_key) {
      const { url } = await api.getDownloadUrl(fileObj.path);
      return url;
    }

    const privKey = localStorage.getItem('ashfir_private_key');
    if (!privKey) throw new Error('Lütfen Ayarlar sayfasından RSA Private Key giriniz.');

    let aesKey;
    try {
      const privateKeyObj = forge.pki.privateKeyFromPem(privKey);
      const encryptedAesKeyBytes = forge.util.decode64(fileObj.encrypted_aes_key);
      const decryptedAesKeyBytes = privateKeyObj.decrypt(encryptedAesKeyBytes, 'RSA-OAEP');
      
      aesKey = new Uint8Array(decryptedAesKeyBytes.length);
      for (let i = 0; i < decryptedAesKeyBytes.length; i++) {
        aesKey[i] = decryptedAesKeyBytes.charCodeAt(i);
      }
    } catch (e) {
      throw new Error('RSA Şifre çözme hatası. Private Key yanlış.');
    }

    const { url } = await api.getDownloadUrl(fileObj.path);
    const response = await fetch(url);
    const encBuffer = await response.arrayBuffer();

    const encArray = new Uint8Array(encBuffer);
    const nonce = encArray.slice(0, 16);
    const ciphertextWithTag = encArray.slice(16);

    let decryptedZipBuffer;
    try {
      const cryptoKey = await window.crypto.subtle.importKey(
        'raw', aesKey, { name: 'AES-GCM' }, false, ['decrypt']
      );
      decryptedZipBuffer = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: nonce }, cryptoKey, ciphertextWithTag
      );
    } catch (e) {
      throw new Error('AES Şifre çözme hatası.');
    }

    const zip = new JSZip();
    await zip.loadAsync(decryptedZipBuffer);
    
    let targetZipFile = null;
    zip.forEach((relativePath, zipEntry) => {
      if (relativePath.endsWith(fileObj.name) || relativePath.includes(fileObj.name)) {
        targetZipFile = zipEntry;
      }
    });

    if (!targetZipFile) throw new Error('Dosya zip içinde bulunamadı.');

    const fileBlob = await targetZipFile.async('blob');
    return URL.createObjectURL(fileBlob);
  },

  // ── Silme — Storage + Firestore index ───────────────────────
  deleteFile: async (path) => {
    const key = getKey();

    // Storage'dan sil
    await deleteObject(ref(storage, path));

    // Firestore index'inden de sil
    try {
      const q = query(
        collection(db, 'accounts', key, 'files'),
        where('path', '==', path),
        limit(1)
      );
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
      }

      // Stats'ı güncelle (total_files -1)
      const statsRef = doc(db, 'accounts', key, 'data', 'stats');
      const statsDoc = await getDoc(statsRef);
      if (statsDoc.exists()) {
        const s = statsDoc.data();
        const fileSize = snap.docs[0]?.data()?.size || 0;
        const fileExt = snap.docs[0]?.data()?.ext || '';
        const updates = {
          total_files: Math.max(0, (s.total_files || 1) - 1),
          total_size: Math.max(0, (s.total_size || 0) - fileSize),
        };
        if (fileExt && s.ext_stats && s.ext_stats[fileExt]) {
          updates[`ext_stats.${fileExt}`] = Math.max(0, s.ext_stats[fileExt] - 1);
        }
        await updateDoc(statsRef, updates);
      }
    } catch (e) {
      // Index yoksa da Storage'dan silindi, devam et
      console.warn('Firestore index silme hatası:', e);
    }
  },

  // ── Agentlar ─────────────────────────────────────────────────
  getAgents: async () => {
    const key = getKey();
    const d = await getDoc(doc(db, 'accounts', key, 'data', 'agents'));
    const agents = d.exists() ? d.data() : {};
    const now = Date.now();

    return {
      agents: Object.values(agents).map(a => ({
        ...a,
        online: a.last_seen
          ? (now - new Date(a.last_seen).getTime()) < 90000
          : false,
      })),
    };
  },

  // ── Self-Destruct ─────────────────────────────────────────────
  selfDestruct: async (machine_name) => {
    const key = getKey();
    await setDoc(
      doc(db, 'accounts', key, 'data', 'self_destruct'),
      {
        [machine_name]: {
          status: 'pending',
          issued_at: new Date().toISOString(),
          acknowledged_at: null,
        },
      },
      { merge: true }
    );
    return { ok: true };
  },

  cancelSelfDestruct: async (machine_name) => {
    const key = getKey();
    // deleteField() kullanmak yerine status'u cancelled yap
    await setDoc(
      doc(db, 'accounts', key, 'data', 'self_destruct'),
      { [machine_name]: { status: 'cancelled' } },
      { merge: true }
    );
    return { ok: true };
  },

  // ── Loglar ───────────────────────────────────────────────────
  getLogs: async (lines = 100) => {
    const key = getKey();
    const q = query(
      collection(db, 'accounts', key, 'logs'),
      orderBy('ts', 'desc'),
      limit(lines)
    );
    const snap = await getDocs(q);
    return {
      logs: snap.docs.map(d => ({ id: d.id, ...d.data() })),
    };
  },
};