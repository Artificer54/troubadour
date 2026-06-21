import { api } from '../api'

export function createPlaylistSlice(set, get) {
  return {
    playlists: [],

    fetchPlaylists: async () => {
      const res = await api('/api/playlists')
      if (res.ok) set({ playlists: await res.json() })
    },

    createPlaylist: async ({ name, hasIntensities, intensityCount, scenarioType }) => {
      const res = await api('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, has_intensities: hasIntensities, intensity_count: intensityCount, scenario_type: scenarioType ?? 'scene' }),
      })
      if (!res.ok) { get().setAppError('Failed to create scenario'); return null }
      const data = await res.json()
      set((s) => ({ playlists: [data, ...s.playlists], selectedScenarioId: data.id }))
      return data
    },

    updatePlaylist: async (id, fields) => {
      const res = await api(`/api/playlists/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      })
      if (!res.ok) { get().setAppError('Failed to update scenario'); return }
      const data = await res.json()
      set((s) => ({
        playlists: s.playlists.map((p) => p.id === id ? { ...p, ...data } : p),
      }))
    },

    uploadScenarioImage: async (file, blur = 12, darkness = 55) => {
      try {
        const form = new FormData()
        form.append('file', file)
        form.append('blur', String(blur))
        form.append('darkness', String(darkness))
        const res = await api('/api/images/upload', { method: 'POST', body: form })
        if (!res.ok) return null
        const { filename, original } = await res.json()
        return { filename, original }
      } catch {
        return null
      }
    },

    reprocessBackground: async (playlistId, blur, darkness) => {
      const res = await api('/api/images/reprocess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlistId, blur, darkness }),
      })
      if (!res.ok) return
      const { playlist } = await res.json()
      set((s) => ({
        playlists: s.playlists.map((p) => p.id === playlistId ? { ...p, ...playlist } : p),
      }))
    },

    deletePlaylist: async (id) => {
      const s = get()
      if (s.activePlaylistId === id) s.stopPlayback()
      if (s.selectedScenarioId === id) {
        const remaining = s.playlists.filter((p) => p.id !== id)
        set({ selectedScenarioId: remaining[0]?.id ?? null })
      }
      await api(`/api/playlists/${id}`, { method: 'DELETE' })
      set((s) => ({ playlists: s.playlists.filter((p) => p.id !== id) }))
    },

    addTrackToPlaylist: async (playlistId, assetId, intensityLevel) => {
      const res = await api(`/api/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset_id: assetId, intensity_level: intensityLevel }),
      })
      if (!res.ok) return
      const data = await res.json()
      set((s) => ({
        playlists: s.playlists.map((p) =>
          p.id === playlistId ? { ...p, playlist_tracks: [...(p.playlist_tracks ?? []), data] } : p
        ),
      }))
    },

    removeTrackFromPlaylist: async (trackId, playlistId) => {
      await api(`/api/playlists/tracks/${trackId}`, { method: 'DELETE' })
      set((s) => ({
        playlists: s.playlists.map((p) =>
          p.id === playlistId
            ? { ...p, playlist_tracks: p.playlist_tracks.filter((t) => t.id !== trackId) }
            : p
        ),
      }))
    },
  }
}
