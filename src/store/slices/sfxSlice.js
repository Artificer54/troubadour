import { api } from '../api'
import { audioEngine } from '../../lib/audioEngine'
import { getTrackUrl } from './audioSlice'

export function createSfxSlice(set, get) {
  return {
    sfxPanels: [],
    fetchSfxPanels: async () => {
      const res = await api('/api/sfx/panels')
      if (res.ok) set({ sfxPanels: await res.json() })
    },

    createSfxPanel: async (panelType, name) => {
      const res = await api('/api/sfx/panels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ panel_type: panelType, name }),
      })
      if (!res.ok) { get().setAppError('Failed to create panel'); return }
      const data = await res.json()
      set((s) => ({ sfxPanels: [...s.sfxPanels, data] }))
    },

    deleteSfxPanel: async (id) => {
      await api(`/api/sfx/panels/${id}`, { method: 'DELETE' })
      set((s) => ({ sfxPanels: s.sfxPanels.filter((p) => p.id !== id) }))
    },

    sfxButtons: [],
    fetchSfxButtons: async () => {
      const res = await api('/api/sfx/buttons')
      if (res.ok) set({ sfxButtons: await res.json() })
    },

    createSfxButton: async ({ panelId, name, color, assetIds }) => {
      const res = await api('/api/sfx/buttons', {
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
      const res = await api(`/api/sfx/buttons/${buttonId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_panel_id: targetPanelId, new_name: newName }),
      })
      if (!res.ok) return
      const { panels, buttons } = await res.json()
      set({ sfxPanels: panels, sfxButtons: buttons })
    },

    deleteSfxButton: async (id) => {
      await api(`/api/sfx/buttons/${id}`, { method: 'DELETE' })
      set((s) => ({
        sfxButtons: s.sfxButtons.filter((b) => b.id !== id),
        sfxPanels: s.sfxPanels.map((p) => ({
          ...p, sfx_buttons: (p.sfx_buttons ?? []).filter((b) => b.id !== id),
        })),
      }))
    },

    triggerSfxButton: (button) => {
      const files = button.sfx_button_files ?? []
      if (!files.length) return
      const chosen = files[Math.floor(Math.random() * files.length)]
      const url = getTrackUrl(chosen.audio_assets)
      audioEngine.playSfx(url)
    },

    addAssetToSfxButton: async (buttonId, assetId) => {
      const res = await api(`/api/sfx/buttons/${buttonId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset_id: assetId }),
      })
      if (!res.ok) return
      const { panels, buttons } = await res.json()
      set({ sfxPanels: panels, sfxButtons: buttons })
    },
  }
}
