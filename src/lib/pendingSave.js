// Holds an unsaved meditation (metadata + audio Blob) in IndexedDB while the
// user leaves the site to sign in with Google, so it can be saved on return.
const DB_NAME = 'your-inner-voice'
const STORE = 'pending'
const KEY = 'meditation'
const MAX_AGE_MS = 24 * 60 * 60 * 1000

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function withStore(mode, fn) {
  const db = await openDb()
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode)
      const result = fn(tx.objectStore(STORE))
      tx.oncomplete = () => resolve(result?.result)
      tx.onerror = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

export async function stashPendingMeditation(meditation, audioBlob) {
  try {
    await withStore('readwrite', (s) => s.put({ meditation, audioBlob, savedAt: Date.now() }, KEY))
    return true
  } catch {
    return false
  }
}

export async function takePendingMeditation() {
  try {
    const entry = await withStore('readonly', (s) => s.get(KEY))
    if (!entry) return null
    await withStore('readwrite', (s) => s.delete(KEY))
    if (Date.now() - (entry.savedAt ?? 0) > MAX_AGE_MS) return null
    return entry
  } catch {
    return null
  }
}

export async function putBackPendingMeditation(entry) {
  try {
    await withStore('readwrite', (s) => s.put(entry, KEY))
  } catch {
    /* ignore */
  }
}
