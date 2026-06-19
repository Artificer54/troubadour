import { useState } from 'react'
import { Music, Search, FolderOpen, RefreshCw, Upload, ChevronDown, ChevronUp } from 'lucide-react'
import Modal from '../ui/Modal'
import FileUpload from '../ui/FileUpload'
import { useAppStore } from '../../store/useAppStore'

export default function AddTrackModal({ playlist, intensityLevel, onClose }) {
  const audioAssets         = useAppStore((s) => s.audioAssets)
  const addTrackToPlaylist  = useAppStore((s) => s.addTrackToPlaylist)
  const openLibraryFolder   = useAppStore((s) => s.openLibraryFolder)
  const scanLibraryFolder   = useAppStore((s) => s.scanLibraryFolder)
  const [search, setSearch]         = useState('')
  const [loading, setLoading]       = useState(false)
  const [scanning, setScanning]     = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const [showUpload, setShowUpload] = useState(false)

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

  const handleScan = async () => {
    setScanning(true)
    setScanResult(null)
    const added = await scanLibraryFolder()
    setScanResult(added)
    setScanning(false)
  }

  return (
    <Modal title={`Add Tracks — ${playlist.name}`} onClose={onClose}>
      <div className="space-y-4">
        {/* Library folder actions */}
        <div className="flex gap-2">
          <button
            onClick={openLibraryFolder}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border text-gray-400 hover:text-gold hover:border-gold text-xs transition-colors"
          >
            <FolderOpen size={13} />
            Open Library Folder
          </button>
          <button
            onClick={handleScan}
            disabled={scanning}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border text-gray-400 hover:text-gold hover:border-gold text-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={scanning ? 'animate-spin' : ''} />
            {scanning ? 'Scanning…' : 'Scan for New Files'}
          </button>
        </div>

        {scanResult !== null && (
          <p className="text-xs text-center text-gray-500">
            {scanResult > 0
              ? <span className="text-green-400">{scanResult} new file{scanResult !== 1 ? 's' : ''} added to library</span>
              : 'No new files found — library is up to date'}
          </p>
        )}

        <p className="text-[10px] text-gray-600 text-center -mt-1">
          Copy audio files into the library folder, then scan to register them.
        </p>

        {/* Search library */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            className="input-dark w-full pl-8"
            placeholder="Search your library…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
          {filtered.length === 0 && (
            <p className="text-xs text-gray-500 text-center py-4">
              {audioAssets.length === 0
                ? 'Library is empty — open the library folder and add audio files, then scan.'
                : 'No matching tracks found'}
            </p>
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

        {/* Upload as fallback */}
        <div className="border-t border-border pt-3">
          <button
            onClick={() => setShowUpload((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-400 transition-colors w-full"
          >
            <Upload size={11} />
            Upload files directly
            {showUpload ? <ChevronUp size={11} className="ml-auto" /> : <ChevronDown size={11} className="ml-auto" />}
          </button>
          {showUpload && (
            <div className="mt-2">
              <FileUpload
                label="Upload audio file to library"
                onUploaded={(assets) => {
                  assets.forEach((a) => addTrackToPlaylist(playlist.id, a.id, intensityLevel))
                }}
              />
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
