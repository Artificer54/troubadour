const PREFIX = 'troubadour-'

export const storage = {
  getStr: (key, fallback = null) => {
    try { return localStorage.getItem(PREFIX + key) ?? fallback } catch { return fallback }
  },
  get: (key, fallback = null) => {
    try {
      const v = localStorage.getItem(PREFIX + key)
      return v !== null ? JSON.parse(v) : fallback
    } catch { return fallback }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(PREFIX + key, typeof value === 'string' ? value : JSON.stringify(value))
    } catch {}
  },
  setStr: (key, value) => {
    try { localStorage.setItem(PREFIX + key, value) } catch {}
  },
  remove: (key) => {
    try { localStorage.removeItem(PREFIX + key) } catch {}
  },
}
