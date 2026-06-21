import { create } from 'zustand'
import { createSettingsSlice } from './slices/settingsSlice'
import { createAudioSlice } from './slices/audioSlice'
import { createPlaylistSlice } from './slices/playlistSlice'
import { createAssetSlice } from './slices/assetSlice'
import { createSfxSlice } from './slices/sfxSlice'
import { createLibrarySlice } from './slices/librarySlice'

// Re-export theme helpers so existing component imports keep working
export {
  hexToSpacedRgb,
  rgbArrayToHex,
  DEFAULT_INTENSITY_COLORS,
  DEFAULT_CUSTOM_COLORS,
  PRESET_THEMES,
  THEMES,
  applyIntensityColors,
  applyTheme,
} from './theme'

export const useAppStore = create((set, get) => ({
  // Global error state
  appError: null,
  setAppError: (msg) => set({ appError: msg }),
  clearAppError: () => set({ appError: null }),

  ...createSettingsSlice(set, get),
  ...createAudioSlice(set, get),
  ...createPlaylistSlice(set, get),
  ...createAssetSlice(set, get),
  ...createSfxSlice(set, get),
  ...createLibrarySlice(set, get),
}))
