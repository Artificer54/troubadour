import { api } from '../api'

export function createLibrarySlice(set, get) {
  return {
    musicLibraries: [],

    fetchMusicLibraries: async () => {
      const res = await api('/api/libraries')
      if (res.ok) set({ musicLibraries: await res.json() })
    },

    addMusicLibrary: async (name, path) => {
      const res = await api('/api/libraries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, path }),
      })
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: 'Unknown error' }))
        get().setAppError(error ?? 'Failed to add library')
        return null
      }
      const lib = await res.json()
      set((s) => ({ musicLibraries: [...s.musicLibraries, lib] }))
      return lib
    },

    updateMusicLibrary: async (id, fields) => {
      const res = await api(`/api/libraries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      })
      if (!res.ok) return
      const lib = await res.json()
      set((s) => ({ musicLibraries: s.musicLibraries.map(l => l.id === id ? lib : l) }))
    },

    removeMusicLibrary: async (id) => {
      await api(`/api/libraries/${id}`, { method: 'DELETE' })
      set((s) => ({
        musicLibraries: s.musicLibraries.filter(l => l.id !== id),
        // Remove assets that belonged to this library from the local asset list
        audioAssets: s.audioAssets.filter(a => a.library_id !== id),
      }))
    },

    scanMusicLibrary: async (id) => {
      const res = await api(`/api/libraries/${id}/scan`, { method: 'POST' })
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: 'Scan failed' }))
        get().setAppError(error)
        return 0
      }
      const { added, assets } = await res.json()
      set({ audioAssets: assets })
      get().fetchMusicLibraries()
      return added
    },

    // Silently scan all enabled libraries (used for auto-scan, no error banners)
    scanAllLibraries: async () => {
      const libs = get().musicLibraries.filter(l => l.enabled)
      if (!libs.length) return
      let anyChange = false
      for (const lib of libs) {
        try {
          const res = await api(`/api/libraries/${lib.id}/scan`, { method: 'POST' })
          if (!res.ok) continue
          const { added, removed, assets } = await res.json()
          if (added || removed) { set({ audioAssets: assets }); anyChange = true }
        } catch { /* silent */ }
      }
      if (anyChange) get().fetchMusicLibraries()
    },
  }
}
