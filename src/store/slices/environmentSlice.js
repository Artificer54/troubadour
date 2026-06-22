import { audioEngine } from '../../lib/audioEngine'

function getTrackUrl(asset) {
  if (asset.library_id) return `/api/assets/stream/${asset.id}`
  return `/tracks/${asset.storage_path}`
}

export function createEnvironmentSlice(set, get) {
  return {
    environments: [],
    activeEnvironmentIds: [],    // environments currently playing
    activePresetIds: {},         // { environmentId: presetId | null }
    // Per-track live volume overrides: { trackId: 0-1 }
    _envTrackVolumes: {},

    fetchEnvironments: async () => {
      try {
        const res = await fetch('/api/environments')
        const data = await res.json()
        set({ environments: data })
      } catch (e) {
        console.error('Failed to fetch environments', e)
      }
    },

    createEnvironment: async (name, color) => {
      const res = await fetch('/api/environments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color }),
      })
      const created = await res.json()
      set((s) => ({ environments: [...s.environments, created] }))
      return created
    },

    updateEnvironment: async (id, fields) => {
      const res = await fetch(`/api/environments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      })
      const updated = await res.json()
      set((s) => ({ environments: s.environments.map(e => e.id === id ? updated : e) }))
    },

    deleteEnvironment: async (id) => {
      // Stop playback first
      const state = get()
      if (state.activeEnvironmentIds.includes(id)) {
        get().deactivateEnvironment(id)
      }
      await fetch(`/api/environments/${id}`, { method: 'DELETE' })
      set((s) => ({
        environments: s.environments.filter(e => e.id !== id),
        activeEnvironmentIds: s.activeEnvironmentIds.filter(eid => eid !== id),
        activePresetIds: Object.fromEntries(Object.entries(s.activePresetIds).filter(([k]) => k !== id)),
      }))
    },

    addTrackToEnvironment: async (environmentId, assetId) => {
      const res = await fetch(`/api/environments/${environmentId}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId }),
      })
      const updated = await res.json()
      set((s) => ({ environments: s.environments.map(e => e.id === environmentId ? updated : e) }))
    },

    removeTrackFromEnvironment: async (environmentId, trackId) => {
      // Stop the track in engine if playing
      audioEngine.stopEnvironmentTrack(trackId)
      const res = await fetch(`/api/environments/${environmentId}/tracks/${trackId}`, { method: 'DELETE' })
      const updated = await res.json()
      set((s) => ({ environments: s.environments.map(e => e.id === environmentId ? updated : e) }))
    },

    createPreset: async (environmentId, { name, fadeDuration, tracks }) => {
      const res = await fetch(`/api/environments/${environmentId}/presets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, fadeDuration, tracks }),
      })
      const updated = await res.json()
      set((s) => ({ environments: s.environments.map(e => e.id === environmentId ? updated : e) }))
      return updated
    },

    updatePreset: async (environmentId, presetId, fields) => {
      const res = await fetch(`/api/environments/${environmentId}/presets/${presetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      })
      const updated = await res.json()
      set((s) => ({ environments: s.environments.map(e => e.id === environmentId ? updated : e) }))
    },

    deletePreset: async (environmentId, presetId) => {
      const res = await fetch(`/api/environments/${environmentId}/presets/${presetId}`, { method: 'DELETE' })
      const updated = await res.json()
      // If the deleted preset was active, clear it
      set((s) => ({
        environments: s.environments.map(e => e.id === environmentId ? updated : e),
        activePresetIds: s.activePresetIds[environmentId] === presetId
          ? { ...s.activePresetIds, [environmentId]: null }
          : s.activePresetIds,
      }))
    },

    activateEnvironment: (environmentId) => {
      const state = get()
      const env = state.environments.find(e => e.id === environmentId)
      if (!env) return

      const envVolume = state.environmentVolumes?.[environmentId] ?? 1.0

      // Start all tracks in the environment (or active preset's tracks)
      const activePresetId = state.activePresetIds[environmentId]
      const preset = env.environment_presets?.find(p => p.id === activePresetId)

      env.environment_tracks?.forEach(track => {
        let vol = (state._envTrackVolumes[track.id] ?? 1.0) * envVolume
        if (preset) {
          const presetTrack = preset.preset_tracks?.find(pt => pt.environment_track_id === track.id)
          if (presetTrack) {
            if (!presetTrack.active) return // skip inactive tracks
            vol = (presetTrack.volume ?? 1.0) * envVolume
          }
        }
        const url = getTrackUrl(track.audio_assets)
        audioEngine.startEnvironmentTrack(url, track.id, vol)
      })

      set((s) => ({
        activeEnvironmentIds: s.activeEnvironmentIds.includes(environmentId)
          ? s.activeEnvironmentIds
          : [...s.activeEnvironmentIds, environmentId],
      }))
    },

    deactivateEnvironment: (environmentId) => {
      const state = get()
      const env = state.environments.find(e => e.id === environmentId)
      if (!env) return

      env.environment_tracks?.forEach(track => {
        audioEngine.stopEnvironmentTrack(track.id)
      })

      set((s) => ({
        activeEnvironmentIds: s.activeEnvironmentIds.filter(id => id !== environmentId),
      }))
    },

    applyPreset: (environmentId, presetId) => {
      const state = get()
      const env = state.environments.find(e => e.id === environmentId)
      if (!env) return
      const preset = env.environment_presets?.find(p => p.id === presetId)
      if (!preset) return

      const envVolume = state.environmentVolumes?.[environmentId] ?? 1.0
      const isActive = state.activeEnvironmentIds.includes(environmentId)

      set((s) => ({ activePresetIds: { ...s.activePresetIds, [environmentId]: presetId } }))

      if (!isActive) return

      // Build lists of track IDs/volumes for the engine
      const activeTrackIds = []
      const volumes = []

      // First stop tracks not in preset or marked inactive
      env.environment_tracks?.forEach(track => {
        const presetTrack = preset.preset_tracks?.find(pt => pt.environment_track_id === track.id)
        if (presetTrack && presetTrack.active) {
          activeTrackIds.push(track.id)
          volumes.push((presetTrack.volume ?? 1.0) * envVolume)
        } else {
          audioEngine.stopEnvironmentTrack(track.id, preset.fade_duration ?? 1500)
        }
      })

      // Tell engine to crossfade to new volumes for active tracks
      audioEngine.applyEnvironmentPreset(activeTrackIds, volumes, preset.fade_duration ?? 1500)

      // Start any tracks not yet running
      activeTrackIds.forEach((trackId, i) => {
        if (!audioEngine._environmentHowls.has(trackId)) {
          const track = env.environment_tracks?.find(t => t.id === trackId)
          if (track) {
            const url = getTrackUrl(track.audio_assets)
            audioEngine.startEnvironmentTrack(url, trackId, volumes[i], preset.fade_duration ?? 1500)
          }
        }
      })
    },

    setLiveTrackVolume: (environmentId, trackId, volume) => {
      set((s) => ({ _envTrackVolumes: { ...s._envTrackVolumes, [trackId]: volume } }))
      const state = get()
      const envVolume = state.environmentVolumes?.[environmentId] ?? 1.0
      audioEngine.setEnvironmentTrackVolume(trackId, volume * envVolume)
    },

    // Called when environmentVolumes changes for an active environment
    reapplyEnvironmentVolume: (environmentId) => {
      const state = get()
      if (!state.activeEnvironmentIds.includes(environmentId)) return
      const envVolume = state.environmentVolumes?.[environmentId] ?? 1.0
      const env = state.environments.find(e => e.id === environmentId)
      if (!env) return
      env.environment_tracks?.forEach(track => {
        const vol = (state._envTrackVolumes[track.id] ?? 1.0) * envVolume
        audioEngine.setEnvironmentTrackVolume(track.id, vol)
      })
    },

    // Save current live state as a named preset
    saveCurrentAsPreset: async (environmentId, name, fadeDuration = 1500) => {
      const state = get()
      const env = state.environments.find(e => e.id === environmentId)
      if (!env) return

      const tracks = env.environment_tracks?.map(track => ({
        environmentTrackId: track.id,
        volume: state._envTrackVolumes[track.id] ?? 1.0,
        active: audioEngine._environmentHowls.has(track.id) ? 1 : 0,
      })) ?? []

      return get().createPreset(environmentId, { name, fadeDuration, tracks })
    },
  }
}
