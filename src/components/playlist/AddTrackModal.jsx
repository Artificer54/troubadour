import { useState } from 'react'
import { Music, Search } from 'lucide-react'
import Modal from '../ui/Modal'
import FileUpload from '../ui/FileUpload'
import { useAppStore } from '../../store/useAppStore'

export default function AddTrackModal({ playlist, intensityLevel, onClose }) {
  const audioAssets = useAppStore((s) => s.audioAssets)
  const addTrackToPlaylist = useAppStore((s) => s.addTrackToPlaylist)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const existingIds = new Set(
    (playlist.playlist_tracks ?? [])
      .filter((t) => t.intensity_level === intensityLevel)
      .map((t) => t.asset_id)
  )

  const filtered = audioAssets.filter(
    (a) => a.name.toLowerCase().includes(search.toLowerCase()) && !existingIds.has(a.id)
  )

  const add = async (assetId) => {
    setLoading(true)
    await addTrackToPlaylist(playlist.id, assetId, intensityLevel)
    setLoading(false)
  }

  return (
    <Modal title={`Add Tracks — ${playlist.name}`} onClose={onClose}>
      <div className="space-y-4">
        <FileUpload
          label="Upload new audio file"
          onUploaded={(assets) => {
            assets.forEach((a) => addTrackToPlaylist(playlist.id, a.id, intensityLevel))
          }}
        />

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            className="input-dark w-full pl-8"
            placeholder="Search your library…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
          {filtered.length === 0 && (
            <p className="text-xs text-gray-500 text-center py-4">No tracks found</p>
          )}
          {filtered.map((asset) => (
            <button
              key={asset.id}
              onClick={() => add(asset.id)}
              disabled={loading}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-border transition-colors text-left disabled:opacity-50"
            >
              <Music size={14} className="text-gold shrink-0" />
              <span className="text-sm text-gray-200 truncate">{asset.name}</span>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  )
}
