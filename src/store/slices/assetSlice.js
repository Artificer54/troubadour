import { api } from '../api'

async function hashBuffer(buffer) {
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function createAssetSlice(set, get) {
  return {
    audioAssets: [],

    fetchAudioAssets: async () => {
      const res = await api('/api/assets')
      if (res.ok) set({ audioAssets: await res.json() })
    },

    uploadAudio: async (file) => {
      const buffer = await file.arrayBuffer()
      const hash = await hashBuffer(buffer)

      const form = new FormData()
      form.append('file', file)
      form.append('file_hash', hash)

      const res = await api('/api/assets/upload', { method: 'POST', body: form })
      if (!res.ok) {
        get().setAppError('Upload failed — check server logs')
        return null
      }
      const asset = await res.json()

      set((s) => {
        const exists = s.audioAssets.some(a => a.id === asset.id)
        return exists ? {} : { audioAssets: [...s.audioAssets, asset] }
      })
      return asset
    },

    openLibraryFolder: async () => {
      await api('/api/assets/open-folder', { method: 'POST' })
    },

    scanLibraryFolder: async () => {
      const res = await api('/api/assets/scan', { method: 'POST' })
      if (!res.ok) return 0
      const { added, assets } = await res.json()
      set({ audioAssets: assets })
      return added
    },

    deleteAudioAsset: async (id) => {
      const res = await api(`/api/assets/${id}`, { method: 'DELETE' })
      if (!res.ok) return
      set((s) => ({ audioAssets: s.audioAssets.filter(a => a.id !== id) }))
    },

    addTagToAsset: async (assetId, tag) => {
      const res = await api(`/api/tags/asset/${assetId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag }),
      })
      if (!res.ok) return
      const tags = await res.json()
      set((s) => ({ audioAssets: s.audioAssets.map((a) => a.id === assetId ? { ...a, tags } : a) }))
    },

    renameAsset: async (id, name) => {
      const res = await api(`/api/assets/${id}/name`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) return
      set((s) => ({ audioAssets: s.audioAssets.map((a) => a.id === id ? { ...a, name } : a) }))
    },

    toggleAssetHidden: async (id, hidden) => {
      const res = await api(`/api/assets/${id}/hidden`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hidden }),
      })
      if (!res.ok) return
      set((s) => ({ audioAssets: s.audioAssets.map((a) => a.id === id ? { ...a, hidden: hidden ? 1 : 0 } : a) }))
    },

    removeTagFromAsset: async (assetId, tag) => {
      const res = await api(`/api/tags/asset/${assetId}/${encodeURIComponent(tag)}`, { method: 'DELETE' })
      if (!res.ok) return
      const tags = await res.json()
      set((s) => ({ audioAssets: s.audioAssets.map((a) => a.id === assetId ? { ...a, tags } : a) }))
    },
  }
}
