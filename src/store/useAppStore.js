import { create } from 'zustand'
import { audioEngine } from '../lib/audioEngine'
import { previewEngine } from '../lib/previewEngine'

async function hashBuffer(buffer) {
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function smartShuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getTrackUrl(storagePath) {
  return `/tracks/${storagePath}`
}

// ── Color helpers ──────────────────────────────────────────────
export function hexToSpacedRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r} ${g} ${b}`
}

export function rgbArrayToHex([r, g, b]) {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
}

// ── Intensity colors ───────────────────────────────────────────
export const DEFAULT_INTENSITY_COLORS = ['#60a5fa', '#facc15', '#fb923c', '#f87171', '#c084fc']

export function applyIntensityColors(colors) {
  if (typeof document === 'undefined') return
  let el = document.getElementById('troubadour-intensity-css')
  if (!el) {
    el = document.createElement('style')
    el.id = 'troubadour-intensity-css'
    document.head.appendChild(el)
  }
  const toRgba = (hex, a) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r},${g},${b},${a})`
  }
  el.textContent = colors.map((hex, i) => `
    .intensity-${i} { color: ${hex} !important; border-color: ${hex} !important; }
    .intensity-${i}-glow { box-shadow: 0 0 14px 3px ${toRgba(hex, 0.55)} !important; }
    .intensity-${i}-ring { box-shadow: 0 0 0 2px ${hex} !important; }
    .intensity-${i}-bg-dot { background: ${hex} !important; }
  `).join('\n')
}

const _storedIntensityColors = (() => {
  try { return JSON.parse(localStorage.getItem('troubadour-intensity-colors') ?? 'null') ?? DEFAULT_INTENSITY_COLORS }
  catch { return DEFAULT_INTENSITY_COLORS }
})()
applyIntensityColors(_storedIntensityColors)

// ── Theme ──────────────────────────────────────────────────────
export const DEFAULT_CUSTOM_COLORS = {
  accent:   '#d4af37',
  ember:    '#c0392b',
  darkbg:   '#111827',
  midnight: '#0d0d1a',
  panel:    '#1a1f2e',
  border:   '#2d3348',
}

export const PRESET_THEMES = {
  darkfantasy: { label: 'Dark Fantasy' },
  arcane:      { label: 'Arcane' },
  battlefield: { label: 'Battlefield' },
  celestial:   { label: 'Celestial' },
  bloodmoon:   { label: 'Blood Moon' },
  deepsea:     { label: 'Deep Sea' },
  sunset:      { label: 'Sunset' },
  neonvoid:    { label: 'Neon Void' },
}

export const THEMES = PRESET_THEMES

const THEME_VARS = {
  darkfantasy: { accent:'212 175 55', darkbg:'17 24 39', midnight:'13 13 26', panel:'26 31 46', border:'45 51 72', ember:'192 57 43' },
  arcane:      { accent:'168 85 247', darkbg:'13 8 24',  midnight:'10 5 20',  panel:'22 13 38', border:'42 29 69', ember:'124 58 237' },
  battlefield: { accent:'132 204 22', darkbg:'15 26 10', midnight:'9 15 5',   panel:'20 31 14', border:'37 48 22', ember:'180 83 9' },
  celestial:   { accent:'147 197 253',darkbg:'10 15 30', midnight:'6 11 24',  panel:'15 22 40', border:'30 45 74', ember:'96 165 250' },
  bloodmoon:   { accent:'220 38 38',  darkbg:'18 5 5',   midnight:'12 3 3',   panel:'28 8 8',   border:'65 18 18', ember:'249 115 22' },
  deepsea:     { accent:'34 211 238', darkbg:'5 18 22',  midnight:'3 12 15',  panel:'8 28 36',  border:'15 55 70', ember:'52 211 153' },
  sunset:      { accent:'251 146 60', darkbg:'20 10 5',  midnight:'14 7 3',   panel:'30 15 8',  border:'70 35 15', ember:'239 68 68' },
  neonvoid:    { accent:'0 255 200',  darkbg:'4 4 8',    midnight:'2 2 5',    panel:'8 8 14',   border:'22 22 38', ember:'180 0 255' },
}

export function applyTheme(name, customOverride) {
  const root = document.documentElement
  root.setAttribute('data-theme', name)

  if (name !== 'custom') {
    const vars = THEME_VARS[name] ?? THEME_VARS.darkfantasy
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(`--color-${k}`, v))
  } else {
    const colors = customOverride ?? (() => {
      try {
        const activeId = localStorage.getItem('troubadour-active-preset')
        const presets = JSON.parse(localStorage.getItem('troubadour-custom-presets') ?? 'null')
        if (presets && activeId) {
          const preset = presets.find(p => p.id === activeId)
          if (preset) return preset.colors
        }
        return JSON.parse(localStorage.getItem('troubadour-custom-theme') ?? 'null') ?? DEFAULT_CUSTOM_COLORS
      } catch { return DEFAULT_CUSTOM_COLORS }
    })()
    Object.entries(colors).forEach(([k, hex]) => root.style.setProperty(`--color-${k}`, hexToSpacedRgb(hex)))
  }
}

// ── Store ──────────────────────────────────────────────────────
export const useAppStore = create((set, get) => ({
  appError: null,
  setAppError: (msg) => set({ appError: msg }),
  clearAppError: () => set({ appError: null }),

  // Volume
  playlistVolume: 0.8,
  sfxVolume: 0.9,
  setPlaylistVolume: (v) => { audioEngine.setPlaylistVolume(v); set({ playlistVolume: v }) },
  setSfxVolume: (v) => { audioEngine.setSfxVolume(v); set({ sfxVolume: v }) },

  // Settings
  fadeDuration: 1500,
  setFadeDuration: (ms) => { audioEngine.setCrossfadeDuration(ms); set({ fadeDuration: ms }) },
  loopSingle: false,
  toggleLoopSingle: () => set((s) => ({ loopSingle: !s.loopSingle })),

  // Theme
  activeTheme: localStorage.getItem('troubadour-theme') ?? 'darkfantasy',
  setTheme: (name) => {
    if (name === 'custom') {
      applyTheme('custom', null)
    } else {
      applyTheme(name, null)
    }
    localStorage.setItem('troubadour-theme', name)
    set({ activeTheme: name })
  },

  // ── Custom presets ─────────────────────────────────────────────
  customPresets: (() => {
    try {
      const saved = JSON.parse(localStorage.getItem('troubadour-custom-presets') ?? 'null')
      if (saved?.length) return saved
      const legacy = JSON.parse(localStorage.getItem('troubadour-custom-theme') ?? 'null')
      if (legacy) return [{ id: 'default', name: 'My Theme', colors: { ...DEFAULT_CUSTOM_COLORS, ...legacy } }]
    } catch {}
    return []
  })(),
  activeCustomPresetId: (() => {
    try { return localStorage.getItem('troubadour-active-preset') ?? null } catch { return null }
  })(),

  createCustomPreset: (name) => {
    const id = Date.now().toString(36)
    const colors = { ...DEFAULT_CUSTOM_COLORS }
    const presets = [...get().customPresets, { id, name, colors }]
    localStorage.setItem('troubadour-custom-presets', JSON.stringify(presets))
    set({ customPresets: presets })
    get().applyCustomPreset(id)
    return id
  },

  deleteCustomPreset: (id) => {
    const presets = get().customPresets.filter(p => p.id !== id)
    localStorage.setItem('troubadour-custom-presets', JSON.stringify(presets))
    const wasActive = get().activeCustomPresetId === id
    const updates = { customPresets: presets }
    if (wasActive) {
      const next = presets[0]
      if (next) {
        applyTheme('custom', next.colors)
        localStorage.setItem('troubadour-active-preset', next.id)
        updates.activeCustomPresetId = next.id
      } else {
        applyTheme('darkfantasy', null)
        localStorage.setItem('troubadour-theme', 'darkfantasy')
        localStorage.removeItem('troubadour-active-preset')
        updates.activeTheme = 'darkfantasy'
        updates.activeCustomPresetId = null
      }
    }
    set(updates)
  },

  renameCustomPreset: (id, name) => {
    const presets = get().customPresets.map(p => p.id === id ? { ...p, name } : p)
    localStorage.setItem('troubadour-custom-presets', JSON.stringify(presets))
    set({ customPresets: presets })
  },

  updateCustomPresetColor: (id, key, hex) => {
    const presets = get().customPresets.map(p =>
      p.id === id ? { ...p, colors: { ...p.colors, [key]: hex } } : p
    )
    localStorage.setItem('troubadour-custom-presets', JSON.stringify(presets))
    set({ customPresets: presets })
    if (get().activeCustomPresetId === id) {
      const preset = presets.find(p => p.id === id)
      if (preset) applyTheme('custom', preset.colors)
    }
  },

  applyCustomPreset: (id) => {
    const preset = get().customPresets.find(p => p.id === id)
    if (!preset) return
    applyTheme('custom', preset.colors)
    localStorage.setItem('troubadour-theme', 'custom')
    localStorage.setItem('troubadour-active-preset', id)
    set({ activeTheme: 'custom', activeCustomPresetId: id })
  },

  // Intensity colors
  intensityColors: _storedIntensityColors,
  setIntensityColor: (index, hex) => {
    const colors = [...get().intensityColors]
    colors[index] = hex
    localStorage.setItem('troubadour-intensity-colors', JSON.stringify(colors))
    applyIntensityColors(colors)
    set({ intensityColors: colors })
  },
  resetIntensityColors: () => {
    localStorage.removeItem('troubadour-intensity-colors')
    applyIntensityColors(DEFAULT_INTENSITY_COLORS)
    set({ intensityColors: DEFAULT_INTENSITY_COLORS })
  },

  // ── Scenarios (playlists) ──────────────────────────────────
  playlists: [],
  fetchPlaylists: async () => {
    const res = await fetch('/api/playlists')
    if (res.ok) set({ playlists: await res.json() })
  },

  createPlaylist: async ({ name, hasIntensities, intensityCount, scenarioType }) => {
    const res = await fetch('/api/playlists', {
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
    const res = await fetch(`/api/playlists/${id}`, {
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
      const res = await fetch('/api/images/upload', { method: 'POST', body: form })
      if (!res.ok) return null
      const { filename, original } = await res.json()
      return { filename, original }
    } catch {
      return null
    }
  },

  reprocessBackground: async (playlistId, blur, darkness) => {
    const res = await fetch('/api/images/reprocess', {
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
    await fetch(`/api/playlists/${id}`, { method: 'DELETE' })
    set((s) => ({ playlists: s.playlists.filter((p) => p.id !== id) }))
  },

  // ── Playback ───────────────────────────────────────────────
  activePlaylistId: null,
  selectedScenarioId: null,
  activeIntensity: 0,
  isPlaying: false,
  isTransitioning: false,
  shuffle: true,
  currentTrack: null,
  playedInCycle: [],
  lastIntensityIndex: (() => {
    try { return parseInt(localStorage.getItem('troubadour-last-intensity') ?? '0') } catch { return 0 }
  })(),

  // pinnedStartTracks: { [playlistId_level]: trackId }
  pinnedStartTracks: (() => {
    try { return JSON.parse(localStorage.getItem('troubadour-pinned-tracks') ?? '{}') } catch { return {} }
  })(),

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
    localStorage.setItem('troubadour-pinned-tracks', JSON.stringify(updated))
    set({ pinnedStartTracks: updated })
  },

  libraryOpen: false,
  setLibraryOpen: (v) => set({ libraryOpen: v }),

  setSelectedScenario: (id) => set({ selectedScenarioId: id }),
  setActivePlaylist: (id) => set({ activePlaylistId: id, activeIntensity: 0, isPlaying: false }),

  setActiveIntensity: (level) => {
    localStorage.setItem('troubadour-last-intensity', String(level))
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

    localStorage.setItem('troubadour-last-intensity', String(intensityLevel))
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
      set({ currentTrack: pinnedTrack, playedInCycle: [pinnedTrack.id] })
      const fadeDuration = get().fadeDuration
      setTimeout(() => set({ isTransitioning: false }), fadeDuration + 200)
      const url = getTrackUrl(pinnedTrack.audio_assets.storage_path)
      audioEngine.playTrack(url, pinnedTrack.id, () => {
        const s = get()
        if (!s.isPlaying) return
        if (s.loopSingle) s._playNext([pinnedTrack])
        else s._playNext()
      })
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
    set((s) => ({ playedInCycle: [...s.playedInCycle, chosen.id], currentTrack: chosen, isTransitioning: true }))

    const fadeDuration = get().fadeDuration
    setTimeout(() => set({ isTransitioning: false }), fadeDuration + 200)

    const url = getTrackUrl(chosen.audio_assets.storage_path)
    audioEngine.playTrack(url, chosen.id, () => {
      const s = get()
      if (!s.isPlaying) return
      if (s.loopSingle) s._playNext([chosen])
      else s._playNext()
    })
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
    if (s.isPlaying) s._playNext()
  },

  startPlaylistAtTrack: (playlist, intensityLevel, trackId) => {
    const tracks = (playlist.playlist_tracks ?? []).filter((t) => t.intensity_level === intensityLevel)
    const track = tracks.find((t) => t.id === trackId)
    if (!track) return

    localStorage.setItem('troubadour-last-intensity', String(intensityLevel))
    set({
      activePlaylistId: playlist.id,
      selectedScenarioId: playlist.id,
      activeIntensity: intensityLevel,
      isPlaying: true,
      playedInCycle: [trackId],
      isTransitioning: true,
      currentTrack: track,
      lastIntensityIndex: intensityLevel,
    })
    const fadeDuration = get().fadeDuration
    setTimeout(() => set({ isTransitioning: false }), fadeDuration + 200)
    const url = `/tracks/${track.audio_assets.storage_path}`
    audioEngine.playTrack(url, track.id, () => {
      const s = get()
      if (!s.isPlaying) return
      if (s.loopSingle) s._playNext([track])
      else s._playNext()
    })
  },

  // ── Library Preview ────────────────────────────────────────
  libraryPreview: { assetId: null, isPlaying: false },

  playLibraryPreview: (asset) => {
    const url = `/tracks/${asset.storage_path}`
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

  // ── Tags ───────────────────────────────────────────────────
  addTagToAsset: async (assetId, tag) => {
    const res = await fetch(`/api/tags/asset/${assetId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag }),
    })
    if (!res.ok) return
    const tags = await res.json()
    set((s) => ({ audioAssets: s.audioAssets.map((a) => a.id === assetId ? { ...a, tags } : a) }))
  },

  removeTagFromAsset: async (assetId, tag) => {
    const res = await fetch(`/api/tags/asset/${assetId}/${encodeURIComponent(tag)}`, { method: 'DELETE' })
    if (!res.ok) return
    const tags = await res.json()
    set((s) => ({ audioAssets: s.audioAssets.map((a) => a.id === assetId ? { ...a, tags } : a) }))
  },

  // ── Audio Assets ───────────────────────────────────────────
  audioAssets: [],
  fetchAudioAssets: async () => {
    const res = await fetch('/api/assets')
    if (res.ok) set({ audioAssets: await res.json() })
  },

  openLibraryFolder: async () => {
    await fetch('/api/assets/open-folder', { method: 'POST' })
  },

  scanLibraryFolder: async () => {
    const res = await fetch('/api/assets/scan', { method: 'POST' })
    if (!res.ok) return 0
    const { added, assets } = await res.json()
    set({ audioAssets: assets })
    return added
  },

  uploadAudio: async (file) => {
    const buffer = await file.arrayBuffer()
    const hash = await hashBuffer(buffer)

    const form = new FormData()
    form.append('file', file)
    form.append('file_hash', hash)

    const res = await fetch('/api/assets/upload', { method: 'POST', body: form })
    if (!res.ok) { console.error('Upload failed'); return null }
    const asset = await res.json()

    set((s) => {
      const exists = s.audioAssets.some(a => a.id === asset.id)
      return exists ? {} : { audioAssets: [...s.audioAssets, asset] }
    })
    return asset
  },

  addTrackToPlaylist: async (playlistId, assetId, intensityLevel) => {
    const res = await fetch(`/api/playlists/${playlistId}/tracks`, {
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
    await fetch(`/api/playlists/tracks/${trackId}`, { method: 'DELETE' })
    set((s) => ({
      playlists: s.playlists.map((p) =>
        p.id === playlistId
          ? { ...p, playlist_tracks: p.playlist_tracks.filter((t) => t.id !== trackId) }
          : p
      ),
    }))
  },

  // ── SFX ───────────────────────────────────────────────────
  sfxPanels: [],
  fetchSfxPanels: async () => {
    const res = await fetch('/api/sfx/panels')
    if (res.ok) set({ sfxPanels: await res.json() })
  },

  createSfxPanel: async (panelType, name) => {
    const res = await fetch('/api/sfx/panels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ panel_type: panelType, name }),
    })
    if (!res.ok) { get().setAppError('Failed to create panel'); return }
    const data = await res.json()
    set((s) => ({ sfxPanels: [...s.sfxPanels, data] }))
  },

  deleteSfxPanel: async (id) => {
    await fetch(`/api/sfx/panels/${id}`, { method: 'DELETE' })
    set((s) => ({ sfxPanels: s.sfxPanels.filter((p) => p.id !== id) }))
  },

  sfxButtons: [],
  fetchSfxButtons: async () => {
    const res = await fetch('/api/sfx/buttons')
    if (res.ok) set({ sfxButtons: await res.json() })
  },

  createSfxButton: async ({ panelId, name, color, assetIds }) => {
    const res = await fetch('/api/sfx/buttons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ panel_id: panelId, name, color, asset_ids: assetIds }),
    })
    if (!res.ok) { get().setAppError('Failed to create button'); return null }
    const { panels, buttons } = await res.json()
    set({ sfxPanels: panels, sfxButtons: buttons })
    return buttons.find(b => b.panel_id === panelId && b.name === name) ?? null
  },

  duplicateSfxButton: async (buttonId, targetPanelId, newName) => {
    const res = await fetch(`/api/sfx/buttons/${buttonId}/duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_panel_id: targetPanelId, new_name: newName }),
    })
    if (!res.ok) return
    const { panels, buttons } = await res.json()
    set({ sfxPanels: panels, sfxButtons: buttons })
  },

  deleteSfxButton: async (id) => {
    await fetch(`/api/sfx/buttons/${id}`, { method: 'DELETE' })
    set((s) => ({
      sfxButtons: s.sfxButtons.filter((b) => b.id !== id),
      sfxPanels: s.sfxPanels.map((p) => ({
        ...p, sfx_buttons: (p.sfx_buttons ?? []).filter((b) => b.id !== id),
      })),
    }))
  },

  triggerSfxButton: async (button) => {
    const files = button.sfx_button_files ?? []
    if (!files.length) return
    const chosen = files[Math.floor(Math.random() * files.length)]
    const url = getTrackUrl(chosen.audio_assets.storage_path)
    audioEngine.playSfx(url)
  },

  addAssetToSfxButton: async (buttonId, assetId) => {
    const res = await fetch(`/api/sfx/buttons/${buttonId}/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asset_id: assetId }),
    })
    if (!res.ok) return
    const { panels, buttons } = await res.json()
    set({ sfxPanels: panels, sfxButtons: buttons })
  },
}))
