import { useState } from 'react'
import { FolderOpen, Plus, Trash2, RefreshCw, ToggleLeft, ToggleRight, FolderSearch, X, FolderInput } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'

async function browseForFolder() {
  try {
    const res = await fetch('/api/libraries/browse-folder', { method: 'POST' })
    const { path } = await res.json()
    return path || null
  } catch {
    return null
  }
}

export default function LibraryManager() {
  const musicLibraries     = useAppStore((s) => s.musicLibraries)
  const addMusicLibrary    = useAppStore((s) => s.addMusicLibrary)
  const removeMusicLibrary = useAppStore((s) => s.removeMusicLibrary)
  const updateMusicLibrary = useAppStore((s) => s.updateMusicLibrary)
  const scanMusicLibrary   = useAppStore((s) => s.scanMusicLibrary)

  const [showAdd, setShowAdd]   = useState(false)
  const [newName, setNewName]   = useState('')
  const [newPath, setNewPath]   = useState('')
  const [newType, setNewType]   = useState('music')
  const [browsing, setBrowsing] = useState(false)
  const [scanning, setScanning] = useState(null)
  const [scanResult, setScanResult] = useState({})

  const handleBrowse = async () => {
    setBrowsing(true)
    const picked = await browseForFolder()
    setBrowsing(false)
    if (picked) setNewPath(picked)
  }

  const handleAdd = async () => {
    if (!newName.trim() || !newPath.trim()) return
    const lib = await addMusicLibrary(newName.trim(), newPath.trim(), newType)
    if (lib) {
      setNewName('')
      setNewPath('')
      setNewType('music')
      setShowAdd(false)
    }
  }

  const handleScan = async (id) => {
    setScanning(id)
    setScanResult((r) => ({ ...r, [id]: null }))
    const added = await scanMusicLibrary(id)
    setScanning(null)
    setScanResult((r) => ({ ...r, [id]: added }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-gray-500 uppercase tracking-widest">Music Libraries</p>
        <button
          onClick={() => setShowAdd(v => !v)}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gold transition-colors"
        >
          <Plus size={12} />
          Add library
        </button>
      </div>

      <p className="text-xs text-gray-500">
        Point Troubadour at any folder on this machine. Files are read in place — nothing is copied.
        Remote clients (phone, tablet) stream audio from the server automatically.
      </p>

      {/* Add form */}
      {showAdd && (
        <div className="p-3 rounded-lg border border-border bg-midnight/40 space-y-2">
          <p className="text-xs font-medium text-gray-300">New Library</p>
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Display name (e.g. Fantasy Ambience)"
            className="input-dark w-full text-xs py-1.5"
          />
          {/* Track type selector */}
          <div className="flex gap-1.5">
            {[
              { id: 'music',    label: 'Music',    color: 'text-gold border-gold/60 bg-gold/10' },
              { id: 'ambience', label: 'Ambience', color: 'text-green-400 border-green-500/60 bg-green-500/10' },
              { id: 'sfx',      label: 'SFX',      color: 'text-blue-400 border-blue-500/60 bg-blue-500/10' },
            ].map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setNewType(t.id)}
                className={`px-2.5 py-1 rounded-full border text-[11px] font-medium transition-colors ${
                  newType === t.id ? t.color : 'border-border text-gray-500 hover:text-gray-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={newPath}
              onChange={e => setNewPath(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
              placeholder={`Folder path (e.g. C:\\Users\\You\\Music\\TTRPG)`}
              className="input-dark flex-1 text-xs py-1.5 font-mono min-w-0"
            />
            <button
              onClick={handleBrowse}
              disabled={browsing}
              title="Browse for folder"
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-border text-xs text-gray-400 hover:text-gold hover:border-gold/50 transition-colors disabled:opacity-50 shrink-0"
            >
              <FolderInput size={13} />
              {browsing ? '…' : 'Browse'}
            </button>
          </div>
          <p className="text-[10px] text-gray-600">
            Click Browse to open a folder picker, or type the full path manually.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!newName.trim() || !newPath.trim()}
              className="px-3 py-1.5 bg-gold text-midnight text-xs font-semibold rounded-lg disabled:opacity-40"
            >
              Add
            </button>
            <button
              onClick={() => { setShowAdd(false); setNewName(''); setNewPath('') }}
              className="p-1.5 text-gray-500 hover:text-gray-300"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Default tracks dir note */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/40 bg-midnight/30">
        <FolderOpen size={13} className="text-gold shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-300 font-medium">Default Upload Folder</p>
          <p className="text-[10px] text-gray-500 truncate">Uploaded files are stored in the app's <code className="text-gray-400">tracks/</code> folder</p>
        </div>
        <span className="text-[10px] text-green-400 shrink-0">Built-in</span>
      </div>

      {/* Library list */}
      {musicLibraries.length === 0 && !showAdd && (
        <p className="text-xs text-gray-600 py-1">
          No external libraries added yet. Click <span className="text-gray-400">Add library</span> to register a folder.
        </p>
      )}

      <div className="space-y-2">
        {musicLibraries.map((lib) => (
          <div key={lib.id} className="p-3 rounded-lg border border-border bg-midnight/30 space-y-1.5">
            <div className="flex items-start gap-2">
              <FolderSearch size={14} className={`shrink-0 mt-0.5 ${lib.enabled ? 'text-gold' : 'text-gray-600'}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${lib.enabled ? 'text-gray-200' : 'text-gray-500'}`}>
                  {lib.name}
                </p>
                <p className="text-[10px] font-mono text-gray-600 truncate">{lib.path}</p>
              </div>

              {/* Toggle enabled */}
              <button
                onClick={() => updateMusicLibrary(lib.id, { enabled: !lib.enabled })}
                title={lib.enabled ? 'Disable library' : 'Enable library'}
                className="shrink-0 text-gray-500 hover:text-gold transition-colors"
              >
                {lib.enabled
                  ? <ToggleRight size={18} className="text-gold" />
                  : <ToggleLeft size={18} />
                }
              </button>

              {/* Remove */}
              <button
                onClick={() => removeMusicLibrary(lib.id)}
                title="Remove library"
                className="shrink-0 text-gray-600 hover:text-red-400 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>

            <div className="flex items-center gap-2 pl-5">
              {[
                { id: 'music',    label: 'Music',    color: 'text-gold border-gold/50 bg-gold/10' },
                { id: 'ambience', label: 'Ambience', color: 'text-green-400 border-green-500/50 bg-green-500/10' },
                { id: 'sfx',      label: 'SFX',      color: 'text-blue-400 border-blue-500/50 bg-blue-500/10' },
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => updateMusicLibrary(lib.id, { default_track_type: t.id })}
                  title={`Set default type to ${t.label}`}
                  className={`px-2 py-0.5 rounded-full border text-[10px] transition-colors ${
                    (lib.default_track_type ?? 'music') === t.id ? t.color : 'border-border text-gray-600 hover:text-gray-400'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pl-5">
              <span className="text-[10px] text-gray-600">
                {lib.asset_count} {lib.asset_count === 1 ? 'track' : 'tracks'} registered
              </span>
              <button
                onClick={() => handleScan(lib.id)}
                disabled={scanning === lib.id}
                className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gold transition-colors disabled:opacity-50"
              >
                <RefreshCw size={10} className={scanning === lib.id ? 'animate-spin' : ''} />
                {scanning === lib.id ? 'Scanning…' : 'Scan for new files'}
              </button>
            </div>

            {scanResult[lib.id] !== undefined && scanResult[lib.id] !== null && (
              <p className="pl-5 text-[10px] text-green-400">
                {scanResult[lib.id] === 0 ? 'No new files found.' : `Added ${scanResult[lib.id]} new track${scanResult[lib.id] !== 1 ? 's' : ''}.`}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
