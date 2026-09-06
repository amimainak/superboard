// ============================================================
// IndexedDB Storage — for recording chunks during a lesson
// ============================================================
// Stores 10-min video chunks in IndexedDB (disk-backed, not RAM)
// during the lesson. At the end, all chunks are bundled into a
// ZIP and downloaded as one file.
//
// Why IndexedDB: Safari on iPad doesn't support the File System
// Access API, so we can't auto-save to a folder. IndexedDB is
// disk-backed (survives tab close), has generous storage limits
// (~50% of free disk on Safari, unlimited on Chrome with
// persistent storage), and doesn't blow up RAM.
// ============================================================

const DB_NAME = 'superboard-recordings'
const STORE_NAME = 'chunks'
const DB_VERSION = 1

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
  })
}

export interface RecordingChunk {
  id: string          // unique ID for this chunk
  lessonId: string    // which lesson this belongs to
  chunkIndex: number  // 0, 1, 2, ...
  blob: Blob          // the actual video data
  size: number
  recordedAt: string  // ISO timestamp
  duration: number    // seconds
}

/**
 * Save a chunk to IndexedDB.
 */
export async function saveChunk(chunk: RecordingChunk): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.put(chunk)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/**
 * Get all chunks for a lesson, ordered by chunkIndex.
 */
export async function getChunks(lessonId: string): Promise<RecordingChunk[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req = store.getAll()
    req.onsuccess = () => {
      const all = req.result as RecordingChunk[]
      resolve(all.filter(c => c.lessonId === lessonId).sort((a, b) => a.chunkIndex - b.chunkIndex))
    }
    req.onerror = () => reject(req.error)
  })
}

/**
 * Delete all chunks for a lesson (after successful ZIP download).
 */
export async function clearChunks(lessonId: string): Promise<void> {
  const db = await openDB()
  const chunks = await getChunks(lessonId)
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    for (const chunk of chunks) {
      store.delete(chunk.id)
    }
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/**
 * Check if there are unsaved chunks from a previous session
 * (e.g., the student closed the tab mid-lesson).
 */
export async function getUnsavedRecordings(): Promise<RecordingChunk[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req = store.getAll()
    req.onsuccess = () => {
      resolve(req.result as RecordingChunk[])
    }
    req.onerror = () => reject(req.error)
  })
}
