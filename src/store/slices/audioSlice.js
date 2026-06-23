import { audioEngine } from '../../lib/audioEngine'
import { previewEngine } from '../../lib/previewEngine'
import { storage } from '../../lib/storage'

function smartShuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Library assets stream via ID so the server resolves the library path.
// Uploaded tracks use the static /tracks/ route directly.
export function getTrackUrl(asset) {
  if (asset.library_id) return `/api/assets/stream/${asset.id}`
  return `/tracks/${asset.storage_path}`
}

export function createAudioSlice(set, get) {
  return {
    activePlaylistId: null,
    selectedScenarioId: null,
    activeIntensity: 0,
    isPlaying: false,
    isTransitioning: false,
    shuffle: true,
    currentTrack: null,
    playedInCycle: [],
    lastIntensityIndex: storage.get('last-intensity', 0),
    _trackStartTime: null,
    _trackAccumulatedMs: 0,

    pinnedStartTracks: storage.get('pinned-tracks', {}),
    setPinnedStartTrack: (playlistId, intensityLevel, trackId) => {
      const key = `${playlistId}_${intensityLevel}`
      const current = get().pinnedStartTracks
      let updated
      if (current[key] === trackId) {
        const { [key]: _, ...rest } = current
        updated = rest
      } else {
        updated = { ...current, [key]: trackId }
      }
      storage.set('pinned-tracks', updated)
      set({ pinnedStartTracks: updated })
    },

    libraryOpen: false,
    setLibraryOpen: (v) => set({ libraryOpen: v }),

    setSelectedScenario: (id) => set({ selectedScenarioId: id }),
    setActivePlaylist: (id) => set({ activePlaylistId: id, activeIntensity: 0, isPlaying: false }),

    setActiveIntensity: (level) => {
      storage.set('last-intensity', level)
      set({ activeIntensity: level, playedInCycle: [], lastIntensityIndex: level })
      const state = get()
      if (state.isPlaying) state._playNext()
    },

    toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),

    startPlaylist: async (playlist, intensityLevel) => {
      const tracks = (playlist.playlist_tracks ?? []).filter((t) => t.intensity_level === intensityLevel)
      if (!tracks.length) {
        set({ appError: `No tracks at this intensity level. Add some tracks first!` })
        return
      }

      storage.set('last-intensity', intensityLevel)
      set({
        activePlaylistId: playlist.id,
        selectedScenarioId: playlist.id,
        activeIntensity: intensityLevel,
        isPlaying: true,
        playedInCycle: [],
        isTransitioning: true,
        lastIntensityIndex: intensityLevel,
      })

      const pinnedKey = `${playlist.id}_${intensityLevel}`
      const pinnedId = get().pinnedStartTracks[pinnedKey]
      const pinnedTrack = pinnedId ? tracks.find((t) => t.id === pinnedId) : null

      if (pinnedTrack) {
        set({ currentTrack: pinnedTrack, playedInCycle: [pinnedTrack.id], _trackStartTime: Date.now(), _trackAccumulatedMs: 0 })
        const fadeDuration = get().fadeDuration
        setTimeout(() => set({ isTransitioning: false }), fadeDuration + 200)
        const url = getTrackUrl(pinnedTrack.audio_assets)
        const onPinnedEnd = () => {
          const s = get()
          if (!s.isPlaying) return
          if (s.loopSingle) { s._playNext([pinnedTrack]); return }
          if (s.loopUntilEnabled) {
            const elapsed = Date.now() - (s._trackStartTime ?? Date.now())
            const total = s._trackAccumulatedMs + elapsed
            if (total < s.loopUntilMinutes * 60_000) {
              set({ _trackAccumulatedMs: total, _trackStartTime: Date.now() })
              audioEngine.playTrack(url, pinnedTrack.id, onPinnedEnd)
              return
            }
          }
          s._playNext()
        }
        audioEngine.playTrack(url, pinnedTrack.id, onPinnedEnd)
      } else {
        await get()._playNext(tracks)
      }
    },

    _playNext: async (tracksOverride = null) => {
      const state = get()
      const playlist = state.playlists.find((p) => p.id === state.activePlaylistId)
      if (!playlist) return

      const tracks = tracksOverride ?? (playlist.playlist_tracks ?? []).filter(
        (t) => t.intensity_level === state.activeIntensity
      )
      if (!tracks.length) return

      let available = tracks.filter((t) => !state.playedInCycle.includes(t.id))
      if (!available.length) {
        set({ playedInCycle: [] })
        available = tracks
      }

      const chosen = state.shuffle ? smartShuffle(available)[0] : available[0]
      set((s) => ({
        playedInCycle: [...s.playedInCycle, chosen.id],
        currentTrack: chosen,
        isTransitioning: true,
        _trackStartTime: Date.now(),
        _trackAccumulatedMs: 0,
      }))

      const fadeDuration = get().fadeDuration
      setTimeout(() => set({ isTransitioning: false }), fadeDuration + 200)

      const url = getTrackUrl(chosen.audio_assets)
      const onEnd = () => {
        const s = get()
        if (!s.isPlaying) return
        if (s.loopSingle) { s._playNext([chosen]); return }
        if (s.loopUntilEnabled) {
          const elapsed = Date.now() - (s._trackStartTime ?? Date.now())
          const total = s._trackAccumulatedMs + elapsed
          if (total < s.loopUntilMinutes * 60_000) {
            set({ _trackAccumulatedMs: total, _trackStartTime: Date.now() })
            audioEngine.playTrack(url, chosen.id, onEnd)
            return
          }
        }
        s._playNext()
      }
      audioEngine.playTrack(url, chosen.id, onEnd)
    },

    pauseResume: () => {
      const s = get()
      if (s.isPlaying) {
        audioEngine.fadeAndPause(600)
        set({ isPlaying: false })
      } else {
        audioEngine.resumeTrack()
        set({ isPlaying: true })
      }
    },

    stopPlayback: () => {
      audioEngine.stopAll()
      set({ isPlaying: false, currentTrack: null, playedInCycle: [], isTransitioning: false, activePlaylistId: null })
    },

    skipTrack: () => {
      const s = get()
      if (s.isPlaying) {
        set({ _trackAccumulatedMs: 0, _trackStartTime: null })
        s._playNext()
      }
    },

    startPlaylistAtTrack: (playlist, intensityLevel, trackId) => {
      const tracks = (playlist.playlist_tracks ?? []).filter((t) => t.intensity_level === intensityLevel)
      const track = tracks.find((t) => t.id === trackId)
      if (!track) return

      storage.set('last-intensity', intensityLevel)
      set({
        activePlaylistId: playlist.id,
        selectedScenarioId: playlist.id,
        activeIntensity: intensityLevel,
        isPlaying: true,
        playedInCycle: [trackId],
        isTransitioning: true,
        currentTrack: track,
        lastIntensityIndex: intensityLevel,
        _trackStartTime: Date.now(),
        _trackAccumulatedMs: 0,
      })
      const fadeDuration = get().fadeDuration
      setTimeout(() => set({ isTransitioning: false }), fadeDuration + 200)
      const url = getTrackUrl(track.audio_assets)
      const onAtEnd = () => {
        const s = get()
        if (!s.isPlaying) return
        if (s.loopSingle) { s._playNext([track]); return }
        if (s.loopUntilEnabled) {
          const elapsed = Date.now() - (s._trackStartTime ?? Date.now())
          const total = s._trackAccumulatedMs + elapsed
          if (total < s.loopUntilMinutes * 60_000) {
            set({ _trackAccumulatedMs: total, _trackStartTime: Date.now() })
            audioEngine.playTrack(url, track.id, onAtEnd)
            return
          }
        }
        s._playNext()
      }
      audioEngine.playTrack(url, track.id, onAtEnd)
    },

    // Library preview
    libraryPreview: { assetId: null, isPlaying: false },
    playLibraryPreview: (asset) => {
      const url = getTrackUrl(asset)
      set({ libraryPreview: { assetId: asset.id, isPlaying: true } })
      previewEngine.play(url, () => set({ libraryPreview: { assetId: null, isPlaying: false } }))
    },
    pauseLibraryPreview: () => {
      const s = get()
      if (s.libraryPreview.isPlaying) {
        previewEngine.pause()
        set({ libraryPreview: { ...s.libraryPreview, isPlaying: false } })
      } else {
        previewEngine.resume()
        set({ libraryPreview: { ...s.libraryPreview, isPlaying: true } })
      }
    },
    stopLibraryPreview: () => {
      previewEngine.stop()
      set({ libraryPreview: { assetId: null, isPlaying: false } })
    },
  }
}
