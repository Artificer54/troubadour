import { storage } from '../../lib/storage'
import { audioEngine } from '../../lib/audioEngine'
import {
  applyTheme,
  applyIntensityColors,
  DEFAULT_INTENSITY_COLORS,
  DEFAULT_CUSTOM_COLORS,
} from '../theme'

export function createSettingsSlice(set, get) {
  return {
    // Volume
    playlistVolume: 0.8,
    sfxVolume: 0.9,
    setPlaylistVolume: (v) => { audioEngine.setPlaylistVolume(v); set({ playlistVolume: v }) },
    setSfxVolume: (v) => { audioEngine.setSfxVolume(v); set({ sfxVolume: v }) },

    // Audio settings
    fadeDuration: 1500,
    setFadeDuration: (ms) => { audioEngine.setCrossfadeDuration(ms); set({ fadeDuration: ms }) },
    loopSingle: false,
    toggleLoopSingle: () => set((s) => ({ loopSingle: !s.loopSingle })),

    // Theme
    activeTheme: storage.getStr('theme', 'darkfantasy'),
    setTheme: (name) => {
      applyTheme(name, null)
      storage.setStr('theme', name)
      set({ activeTheme: name })
    },

    // Custom presets
    customPresets: (() => {
      const saved = storage.get('custom-presets', null)
      if (saved?.length) return saved
      const legacy = storage.get('custom-theme', null)
      if (legacy) return [{ id: 'default', name: 'My Theme', colors: { ...DEFAULT_CUSTOM_COLORS, ...legacy } }]
      return []
    })(),
    activeCustomPresetId: storage.getStr('active-preset', null),

    createCustomPreset: (name) => {
      const id = Date.now().toString(36)
      const colors = { ...DEFAULT_CUSTOM_COLORS }
      const presets = [...get().customPresets, { id, name, colors }]
      storage.set('custom-presets', presets)
      set({ customPresets: presets })
      get().applyCustomPreset(id)
      return id
    },

    deleteCustomPreset: (id) => {
      const presets = get().customPresets.filter(p => p.id !== id)
      storage.set('custom-presets', presets)
      const wasActive = get().activeCustomPresetId === id
      const updates = { customPresets: presets }
      if (wasActive) {
        const next = presets[0]
        if (next) {
          applyTheme('custom', next.colors)
          storage.setStr('active-preset', next.id)
          updates.activeCustomPresetId = next.id
        } else {
          applyTheme('darkfantasy', null)
          storage.setStr('theme', 'darkfantasy')
          storage.remove('active-preset')
          updates.activeTheme = 'darkfantasy'
          updates.activeCustomPresetId = null
        }
      }
      set(updates)
    },

    renameCustomPreset: (id, name) => {
      const presets = get().customPresets.map(p => p.id === id ? { ...p, name } : p)
      storage.set('custom-presets', presets)
      set({ customPresets: presets })
    },

    updateCustomPresetColor: (id, key, hex) => {
      const presets = get().customPresets.map(p =>
        p.id === id ? { ...p, colors: { ...p.colors, [key]: hex } } : p
      )
      storage.set('custom-presets', presets)
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
      storage.setStr('theme', 'custom')
      storage.setStr('active-preset', id)
      set({ activeTheme: 'custom', activeCustomPresetId: id })
    },

    // Intensity colors
    intensityColors: storage.get('intensity-colors', null) ?? DEFAULT_INTENSITY_COLORS,
    setIntensityColor: (index, hex) => {
      const colors = [...get().intensityColors]
      colors[index] = hex
      storage.set('intensity-colors', colors)
      applyIntensityColors(colors)
      set({ intensityColors: colors })
    },
    resetIntensityColors: () => {
      storage.remove('intensity-colors')
      applyIntensityColors(DEFAULT_INTENSITY_COLORS)
      set({ intensityColors: DEFAULT_INTENSITY_COLORS })
    },
  }
}
