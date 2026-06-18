import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { audioEngine } from '../lib/audioEngine'

// ── SFX URL cache ─────────────────────────────────────────────
const _sfxUrlCache = new Map()
const SFX_CACHE_TTL = 4 * 60 * 1000

async function getSignedSfxUrl(storagePath) {
  const cached = _sfxUrlCache.get(storagePath)
  if (cached && Date.now() < cached.expiresAt) return cached.url
  const { data } = await supabase.storage.from('audio').createSignedUrl(storagePath, 300)
  if (!data?.signedUrl) return null
  _sfxUrlCache.set(storagePath, { url: data.signedUrl, expiresAt: Date.now() + SFX_CACHE_TTL })
  return data.signedUrl
}

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

// Initialize intensity colors from localStorage immediately on module load
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

// Keep THEMES as an alias so existing imports of THEMES still work
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
        // New multi-preset format
        const activeId = localStorage.getItem('troubadour-active-preset')
        const presets = JSON.parse(localStorage.getItem('troubadour-custom-presets') ?? 'null')
        if (presets && activeId) {
          const preset = presets.find(p => p.id === activeId)
          if (preset) return preset.colors
        }
        // Legacy single-preset fallback
        return JSON.parse(localStorage.getItem('troubadour-custom-theme') ?? 'null') ?? DEFAULT_CUSTOM_COLORS
      } catch { return DEFAULT_CUSTOM_COLORS }
    })()
    Object.entries(colors).forEach(([k, hex]) => root.style.setProperty(`--color-${k}`, hexToSpacedRgb(hex)))
  }
}

// ── Store ──────────────────────────────────────────────────────
export const useAppStore = create((set, get) => ({
  // Auth
  user: null,
  setUser: (user) => set({ user }),

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
      // Custom requires an active preset — handled by applyCustomPreset instead
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
      // Migrate legacy single custom theme
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
    const { data, error } = await supabase
      .from('playlists')
      .select(`*, playlist_tracks(*, audio_assets(*))`)
      .order('created_at', { ascending: false })
    if (!error) set({ playlists: data ?? [] })
  },

  createPlaylist: async ({ name, hasIntensities, intensityCount }) => {
    const { data, error } = await supabase
      .from('playlists')
      .insert({ user_id: get().user?.id, name, has_intensities: hasIntensities, intensity_count: intensityCount })
      .select()
      .single()
    if (error) { get().setAppError('Failed to create scenario: ' + error.message); return null }
    const newScenario = { ...data, playlist_tracks: [] }
    set((s) => ({ playlists: [newScenario, ...s.playlists], selectedScenarioId: data.id }))
    return data
  },

  updatePlaylist: async (id, { name, description }) => {
    // Try with description; fall back gracefully if column doesn't exist yet
    let error
    if (description !== undefined) {
      const res = await supabase.from('playlists').update({ name, description }).eq('id', id)
      error = res.error
      if (error?.message?.includes('description')) {
        const retry = await supabase.from('playlists').update({ name }).eq('id', id)
        error = retry.error
        if (!error) get().setAppError('Saved name only — run the DB migration to enable descriptions.')
      }
    } else {
      const res = await supabase.from('playlists').update({ name }).eq('id', id)
      error = res.error
    }
    if (error) { get().setAppError('Failed to update scenario: ' + error.message); return }
    set((s) => ({
      playlists: s.playlists.map((p) =>
        p.id === id ? { ...p, name, ...(description !== undefined ? { description } : {}) } : p
      ),
    }))
  },

  deletePlaylist: async (id) => {
    const s = get()
    if (s.activePlaylistId === id) s.stopPlayback()
    if (s.selectedScenarioId === id) {
      const remaining = s.playlists.filter((p) => p.id !== id)
      set({ selectedScenarioId: remaining[0]?.id ?? null })
    }
    await supabase.from('playlists').delete().eq('id', id)
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

  setSelectedScenario: (id) => set({ selectedScenarioId: id }),
  setActivePlaylist: (id) => set({ activePlaylistId: id, activeIntensity: 0, isPlaying: false }),

  setActiveIntensity: (level) => {
    set({ activeIntensity: level, playedInCycle: [] })
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
    set({
      activePlaylistId: playlist.id,
      selectedScenarioId: playlist.id,
      activeIntensity: intensityLevel,
      isPlaying: true,
      playedInCycle: [],
      isTransitioning: true,
    })
    await get()._playNext(tracks)
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

    const signedUrl = await getSignedSfxUrl(chosen.audio_assets.storage_path)
    if (signedUrl) {
      audioEngine.playTrack(signedUrl, chosen.id, () => {
        const s = get()
        if (!s.isPlaying) return
        if (s.loopSingle) s._playNext([chosen])
        else s._playNext()
      })
    }
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

  // ── Audio Assets ───────────────────────────────────────────
  audioAssets: [],
  fetchAudioAssets: async () => {
    const { data } = await supabase.from('audio_assets').select('*').order('name')
    if (data) set({ audioAssets: data })
  },

  uploadAudio: async (file) => {
    const userId = get().user?.id
    if (!userId) return null

    const buffer = await file.arrayBuffer()
    const hash = await hashBuffer(buffer)

    const { data: existing } = await supabase
      .from('audio_assets').select('*').eq('user_id', userId).eq('file_hash', hash).single()
    if (existing) return existing

    const ext = file.name.split('.').pop()
    const storagePath = `${userId}/${hash}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('audio').upload(storagePath, file, { contentType: file.type, upsert: false })

    if (uploadError && uploadError.message !== 'The resource already exists') {
      console.error('Upload error', uploadError)
      return null
    }

    const { data: asset } = await supabase
      .from('audio_assets')
      .insert({ user_id: userId, name: file.name.replace(/\.[^.]+$/, ''), storage_path: storagePath, file_hash: hash, mime_type: file.type, file_size: file.size })
      .select().single()

    if (asset) set((s) => ({ audioAssets: [...s.audioAssets, asset] }))
    return asset
  },

  addTrackToPlaylist: async (playlistId, assetId, intensityLevel) => {
    const playlist = get().playlists.find((p) => p.id === playlistId)
    const tracks = (playlist?.playlist_tracks ?? []).filter((t) => t.intensity_level === intensityLevel)
    const position = tracks.length

    const { data } = await supabase
      .from('playlist_tracks')
      .insert({ playlist_id: playlistId, asset_id: assetId, intensity_level: intensityLevel, position })
      .select('*, audio_assets(*)')
      .single()

    if (data) {
      set((s) => ({
        playlists: s.playlists.map((p) =>
          p.id === playlistId ? { ...p, playlist_tracks: [...(p.playlist_tracks ?? []), data] } : p
        ),
      }))
    }
  },

  removeTrackFromPlaylist: async (trackId, playlistId) => {
    await supabase.from('playlist_tracks').delete().eq('id', trackId)
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
    const { data } = await supabase
      .from('sfx_panels').select(`*, sfx_buttons(*, sfx_button_files(*, audio_assets(*)))`).order('position')
    if (data) set({ sfxPanels: data })
  },

  createSfxPanel: async (panelType, name) => {
    const panels = get().sfxPanels.filter((p) => p.panel_type === panelType)
    const { data, error } = await supabase
      .from('sfx_panels')
      .insert({ user_id: get().user?.id, panel_type: panelType, name, position: panels.length })
      .select().single()
    if (error) { get().setAppError('Failed to create panel: ' + error.message); return }
    if (data) set((s) => ({ sfxPanels: [...s.sfxPanels, { ...data, sfx_buttons: [] }] }))
  },

  deleteSfxPanel: async (id) => {
    await supabase.from('sfx_panels').delete().eq('id', id)
    set((s) => ({ sfxPanels: s.sfxPanels.filter((p) => p.id !== id) }))
  },

  sfxButtons: [],
  fetchSfxButtons: async () => {
    const { data } = await supabase
      .from('sfx_buttons').select(`*, sfx_button_files(*, audio_assets(*)), sfx_panels(*)`).order('name')
    if (data) set({ sfxButtons: data })
  },

  createSfxButton: async ({ panelId, name, color, assetIds }) => {
    const panel = get().sfxPanels.find((p) => p.id === panelId)
    const position = (panel?.sfx_buttons ?? []).length

    const { data: btn, error: btnError } = await supabase
      .from('sfx_buttons').insert({ user_id: get().user?.id, panel_id: panelId, name, color, position }).select().single()
    if (btnError) { get().setAppError('Failed to create button: ' + btnError.message); return null }
    if (!btn) return null

    if (assetIds?.length) {
      await supabase.from('sfx_button_files').insert(assetIds.map((asset_id) => ({ button_id: btn.id, asset_id })))
    }

    await get().fetchSfxPanels()
    await get().fetchSfxButtons()
    return btn
  },

  duplicateSfxButton: async (buttonId, targetPanelId, newName) => {
    const btn = get().sfxButtons.find((b) => b.id === buttonId)
    if (!btn) return

    const { data: newBtn } = await supabase
      .from('sfx_buttons').insert({ panel_id: targetPanelId, name: newName ?? `${btn.name} (copy)`, color: btn.color }).select().single()
    if (!newBtn) return

    const fileInserts = (btn.sfx_button_files ?? []).map((f) => ({ button_id: newBtn.id, asset_id: f.asset_id }))
    if (fileInserts.length) await supabase.from('sfx_button_files').insert(fileInserts)

    await get().fetchSfxPanels()
    await get().fetchSfxButtons()
  },

  deleteSfxButton: async (id) => {
    await supabase.from('sfx_buttons').delete().eq('id', id)
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
    const signedUrl = await getSignedSfxUrl(chosen.audio_assets.storage_path)
    if (signedUrl) audioEngine.playSfx(signedUrl)
  },

  addAssetToSfxButton: async (buttonId, assetId) => {
    await supabase.from('sfx_button_files').insert({ button_id: buttonId, asset_id: assetId })
    await get().fetchSfxPanels()
    await get().fetchSfxButtons()
  },
}))
