import { db, storage } from './firebase';
import { 
  doc, getDoc, setDoc, updateDoc, collection, query, orderBy, limit, getDocs, deleteDoc 
} from 'firebase/firestore';
import { 
  ref, listAll, getDownloadURL, deleteObject, getMetadata 
} from 'firebase/storage';

export const getKey = () => localStorage.getItem('cb_key')
export const setKey = (k) => localStorage.setItem('cb_key', k)
export const clearKey = () => localStorage.removeItem('cb_key')

// Helper for UI icons
const extIcon = (name) => {
  const ext = name.split('.').pop().toLowerCase();
  const map = {
    'pdf': '📄', 'doc': '📝', 'docx': '📝', 'xls': '📊', 'xlsx': '📊',
    'png': '🖼️', 'jpg': '🖼️', 'jpeg': '🖼️', 'gif': '🖼️',
    'zip': '📦', 'rar': '📦', '7z': '📦',
    'mp4': '🎥', 'avi': '🎥', 'mp3': '🎵',
    'py': '🐍', 'js': '📜', 'txt': '📄'
  };
  return map[ext] || '📄';
};

const humanSize = (s) => {
    if (!s) return '0B'
    for (const u of ['B', 'KB', 'MB', 'GB']) {
        if (s < 1024) return `${s.toFixed(1)}${u}`
        s /= 1024
    }
    return `${s.toFixed(1)}TB`
}

export const api = {
  // Giriş kontrolü (Firestore'da doküman var mı bakıyoruz)
  auth: async (key) => {
    try {
      const d = await getDoc(doc(db, 'accounts', key));
      return { ok: d.exists() };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },

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

  getFiles: async (params = {}) => {
    const key = getKey();
    const { search = '', ext = '' } = params;
    const rootRef = ref(storage, `backups/${key}`);
    
    // Not: Firebase Storage'da tüm dosyaları recursive listeleme (listAll) 
    // her zaman verimli değildir ama mevcut "per_page" mantığına benzer çalışır.
    const res = await listAll(rootRef); 
    // listAll sadece direkt altındakileri getirir. Recursive için her klasöre girmek gerekir.
    // Ancak mevcut server recursive prefixes kullanıyordu.
    
    // Firestore'da dosya indexi tutsaydık daha hızlı olurdu. 
    // Şimdilik listAll ile basit bir liste yapalım veya "Recursive List" implement edelim.
    let allFiles = [];
    
    async function walk(folderRef) {
        const list = await listAll(folderRef);
        for (const item of list.items) {
            const meta = await getMetadata(item);
            const m = meta.customMetadata || {};
            const name = item.name;
            
            if (search && !name.toLowerCase().includes(search.toLowerCase())) continue;
            if (ext && !name.toLowerCase().endsWith(ext.toLowerCase())) continue;

            allFiles.push({
                icon: extIcon(name),
                name,
                path: item.fullPath,
                size: meta.size,
                size_human: humanSize(meta.size),
                updated: meta.updated,
                backup_time: m.backup_time || null,
                original_path: m.original_path || '',
                machine: m.source_machine || '—',
                ai_reason: m.ai_reason || '',
                ai_confidence: m.ai_confidence || '',
                source_label: m.source_label || '',
            });
        }
        for (const prefix of list.prefixes) {
            await walk(prefix);
        }
    }

    await walk(rootRef);
    allFiles.sort((a, b) => new Date(b.updated) - new Date(a.updated));

    return {
        files: allFiles.slice(0, 50), // basit limit
        total: allFiles.length,
        total_size_human: humanSize(allFiles.reduce((acc, f) => acc + f.size, 0))
    };
  },

  browseFiles: async (dir = '') => {
    const key = getKey();
    // Normalize path for browsing
    const normalizedDir = dir.replace(/\\/g, '/').replace(/^\/|\/$/g, '');
    const pathInStorage = normalizedDir ? `backups/${key}/${normalizedDir}` : `backups/${key}`;
    const folderRef = ref(storage, pathInStorage);
    
    const res = await listAll(folderRef);
    
    const folders = res.prefixes.map(p => p.name);
    const files = await Promise.all(res.items.map(async (item) => {
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
    }));

    return {
        current_dir: dir,
        folders: folders,
        files: files,
        total_files: files.length,
        total_folders: folders.length
    };
  },

  getDownloadUrl: async (path) => {
    const u = await getDownloadURL(ref(storage, path));
    return { url: u };
  },

  deleteFile: async (path) => {
    await deleteObject(ref(storage, path));
  },

  getAgents: async () => {
    const key = getKey();
    const d = await getDoc(doc(db, 'accounts', key, 'data', 'agents'));
    const agents = d.exists() ? d.data() : {};
    const now = Date.now();

    return {
        agents: Object.values(agents).map(a => ({
            ...a,
            online: a.last_seen ? (now - new Date(a.last_seen).getTime()) < 90000 : false
        }))
    };
  },

  selfDestruct: async (machine_name) => {
    const key = getKey();
    await updateDoc(doc(db, 'accounts', key, 'data', 'self_destruct'), {
        [machine_name]: {
            status: 'pending',
            issued_at: new Date().toISOString(),
            acknowledged_at: null
        }
    });
    return { ok: true };
  },

  cancelSelfDestruct: async (machine_name) => {
    const key = getKey();
    // Firebase delete field equivalent: setting to null or using deleteField()
    // For simplicity, we can set to null or just update status
    await updateDoc(doc(db, 'accounts', key, 'data', 'self_destruct'), {
        [machine_name]: null
    });
    return { ok: true };
  },

  getLogs: async (lines = 100) => {
    const key = getKey();
    const q = query(
        collection(db, 'accounts', key, 'logs'), 
        orderBy('ts', 'desc'), 
        limit(lines)
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data().text);
  },

  getStats: async () => {
    // Stats calculation can be heavy on client side without a server.
    // For now, we can calculate from agents list or leave as aggregate.
    const agentsRes = await api.getAgents();
    return {
        agent_count: agentsRes.agents.length,
        total_files: 0, // Storage listAll recursive is slow for stats
        total_size_human: '—'
    };
  }
}