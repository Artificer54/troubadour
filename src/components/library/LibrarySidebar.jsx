import { useState, useEffect, useRef } from 'react'
import { Search, Play, Pause, X, Plus, Music2, Tag, ArrowRight, ChevronLeft, FolderPlus, Upload, Loader, FolderInput, Eye, EyeOff } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { previewEngine } from '../../lib/previewEngine'

const INTENSITY_NAMES = ['Calm', 'Tense', 'Intense', 'Frantic', 'Legendary']

function CoverArt({ path, size = 36 }) {
  if (!path) return (
    <div className="shrink-0 flex items-center justify-center bg-panel rounded" style={{ width: size, height: size }}>
      <Music2 size={Math.round(size * 0.4)} className="text-gray-600" />
    </div>
  )
  return (
    <img
      src={`/images/covers/${path}`}
      alt="cover"
      className="shrink-0 rounded object-cover"
      style={{ width: size, height: size }}
      onError={e => { e.target.style.display = 'none' }}
    />
  )
}

function AddToScenarioPopover({ asset, onClose }) {
  const playlists = useAppStore((s) => s.playlists)
  const selectedId = useAppStore((s) => s.selectedScenarioId)
  const addTrack = useAppStore((s) => s.addTrackToPlaylist)

  const selectedPlaylist = playlists.find(p => p.id === selectedId)
  const [chosenLevel, setChosenLevel] = useState(0)
  const [adding, setAdding] = useState(false)
  const [done, setDone] = useState(false)

  const handleAdd = async () => {
    if (!selectedPlaylist) return
    setAdding(true)
    await addTrack(selectedPlaylist.id, asset.id, chosenLevel)
    setAdding(false)
    setDone(true)
    setTimeout(onClose, 700)
  }

  if (!selectedPlaylist) {
    return (
      <div className="absolute right-0 top-7 z-50 bg-panel border border-border rounded-xl shadow-xl p-3 w-48" onClick={e => e.stopPropagation()}>
        <p className="text-xs text-gray-500 text-center">Select a scenario first</p>
        <button onClick={onClose} className="w-full mt-2 text-xs text-gray-600 hover:text-gray-300">Dismiss</button>
      </div>
    )
  }

  return (
    <div className="absolute right-0 top-7 z-50 bg-panel border border-border rounded-xl shadow-xl p-3 w-52 space-y-2" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-200 truncate">{selectedPlaylist.name}</p>
        <button onClick={onClose} className="text-gray-600 hover:text-gray-300 shrink-0"><X size={11}/></button>
      </div>
      {selectedPlaylist.has_intensities && (
        <div className="flex flex-wrap gap-1">
          {Array.from({ length: selectedPlaylist.intensity_count }, (_, i) => (
            <button
              key={i}
              onClick={() => setChosenLevel(i)}
              className={`px-2 py-0.5 rounded text-[11px] border transition-colors ${
                chosenLevel === i ? 'border-gold/50 bg-gold/10 text-gold' : 'border-border text-gray-500 hover:text-gray-300'
              }`}
            >
              {INTENSITY_NAMES[i]}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={handleAdd}
        disabled={adding || done}
        className="btn-gold w-full text-xs disabled:opacity-50"
      >
        {done ? '✓ Added' : adding ? 'Adding…' : `Add to ${selectedPlaylist.has_intensities ? INTENSITY_NAMES[chosenLevel] : selectedPlaylist.name}`}
      </button>
    </div>
  )
}

function TagChip({ tag, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-[10px]">
      {tag}
      {onRemove && (
        <button onClick={onRemove} className="hover:text-red-400"><X size={8}/></button>
      )}
    </span>
  )
}

function TagInput({ assetId, existingTags, onDone }) {
  const addTag = useAppStore((s) => s.addTagToAsset)
  const [val, setVal] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    const t = val.trim().toLowerCase()
    if (!t || existingTags.includes(t)) { setVal(''); return }
    await addTag(assetId, t)
    setVal('')
    onDone?.()
  }

  return (
    <form onSubmit={submit} className="flex gap-1 mt-1" onClick={e => e.stopPropagation()}>
      <input
        autoFocus
        className="input-dark text-[10px] px-2 py-0.5 flex-1 min-w-0"
        value={val}
        onChange={e => setVal(e.target.value)}
        placeholder="tag…"
        onKeyDown={e => e.key === 'Escape' && onDone?.()}
      />
      <button type="submit" className="text-gold text-[10px] px-1 hover:underline">Add</button>
    </form>
  )
}

export default function LibrarySidebar() {
  const audioAssets = useAppStore((s) => s.audioAssets)
  const libraryPreview = useAppStore((s) => s.libraryPreview)
  const playLibraryPreview = useAppStore((s) => s.playLibraryPreview)
  const pauseLibraryPreview = useAppStore((s) => s.pauseLibraryPreview)
  const stopLibraryPreview = useAppStore((s) => s.stopLibraryPreview)
  const removeTag = useAppStore((s) => s.removeTagFromAsset)
  const toggleAssetHidden = useAppStore((s) => s.toggleAssetHidden)
  const setLibraryOpen = useAppStore((s) => s.setLibraryOpen)
  const playlistVolume = useAppStore((s) => s.playlistVolume)
  const addMusicLibrary = useAppStore((s) => s.addMusicLibrary)
  const scanAllLibraries = useAppStore((s) => s.scanAllLibraries)
  const uploadAudio = useAppStore((s) => s.uploadAudio)
  const fetchAudioAssets = useAppStore((s) => s.fetchAudioAssets)
  const musicLibraries = useAppStore((s) => s.musicLibraries)

  const [search, setSearch] = useState('')
  const [activeTags, setActiveTags] = useState([])
  const [addScenarioFor, setAddScenarioFor] = useState(null)
  const [editTagFor, setEditTagFor] = useState(null)
  const [showHidden, setShowHidden] = useState(false)
  const [showPathFor, setShowPathFor] = useState(null)
  const [progress, setProgress] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [duration, setDuration] = useState(0)
  const rafRef = useRef(null)
  const seekBarRef = useRef(null)
  const uploadInputRef = useRef(null)

  // Add Library inline form state
  const [showAddLib, setShowAddLib] = useState(false)
  const [libName, setLibName] = useState('')
  const [libPath, setLibPath] = useState('')
  const [libAdding, setLibAdding] = useState(false)
  const [browsing, setBrowsing] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleBrowsePath = async () => {
    setBrowsing(true)
    try {
      const res = await fetch('/api/libraries/browse-folder', { method: 'POST' })
      const { path } = await res.json()
      if (path) setLibPath(path)
    } catch { /* ignore */ }
    setBrowsing(false)
  }

  const handleAddLib = async () => {
    if (!libName.trim() || !libPath.trim()) return
    setLibAdding(true)
    await addMusicLibrary(libName.trim(), libPath.trim())
    setLibAdding(false)
    setLibName('')
    setLibPath('')
    setShowAddLib(false)
  }

  const handleUploadFiles = async (files) => {
    const audioFiles = [...files].filter(f => f.type.startsWith('audio/'))
    if (!audioFiles.length) return
    setUploading(true)
    for (const file of audioFiles) {
      await uploadAudio(file)
    }
    setUploading(false)
    fetchAudioAssets()
  }

  useEffect(() => { previewEngine.setVolume(playlistVolume) }, [playlistVolume])

  useEffect(() => {
    if (!libraryPreview.isPlaying) { cancelAnimationFrame(rafRef.current); return }
    const tick = () => {
      setElapsed(previewEngine.getCurrentPosition())
      const dur = previewEngine.getCurrentDuration()
      setDuration(dur)
      setProgress(dur > 0 ? previewEngine.getCurrentPosition() / dur : 0)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [libraryPreview.isPlaying])

  useEffect(() => () => stopLibraryPreview(), [])

  // Auto-scan once when libraries are first loaded, then every 5 minutes
  const hasAutoScanned = useRef(false)
  useEffect(() => {
    if (musicLibraries.length === 0 || hasAutoScanned.current) return
    hasAutoScanned.current = true
    scanAllLibraries()
  }, [musicLibraries])

  useEffect(() => {
    const id = setInterval(scanAllLibraries, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  const fmt = (s) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`

  const seekTo = (clientX) => {
    const el = seekBarRef.current
    if (!el || duration <= 0) return
    const rect = el.getBoundingClientRect()
    previewEngine.seekTo(Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * duration)
  }

  const handleSeekMouseDown = (e) => {
    e.preventDefault()
    seekTo(e.clientX)
    const onMove = (ev) => seekTo(ev.clientX)
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const allTags = [...new Set(audioAssets.flatMap(a => a.tags ?? []))].sort()

  const toggleTagFilter = (tag) =>
    setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])

  const getFullPath = (asset) => {
    if (!asset.library_id) return null
    const lib = musicLibraries.find(l => l.id === asset.library_id)
    return lib ? `${lib.path}\\${asset.storage_path}` : null
  }

  const filtered = audioAssets.filter(a => {
    if (!showHidden && a.hidden) return false
    const q = search.toLowerCase()
    const matchesSearch = !q || a.name.toLowerCase().includes(q) || (a.artist ?? '').toLowerCase().includes(q) || (a.album ?? '').toLowerCase().includes(q)
    const matchesTags = activeTags.length === 0 || activeTags.every(t => (a.tags ?? []).includes(t))
    return matchesSearch && matchesTags
  })

  const previewAsset = audioAssets.find(a => a.id === libraryPreview.assetId)

  const handleDragStart = (e, asset) => {
    e.dataTransfer.setData('assetId', asset.id)
    e.dataTransfer.setData('assetName', asset.name)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className="flex flex-col h-full bg-midnight border-r border-border overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-4 pt-3 pb-2 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => setLibraryOpen(false)}
            className="flex items-center gap-1 text-gray-500 hover:text-gold transition-colors text-xs"
          >
            <ChevronLeft size={14}/> Scenarios
          </button>
          <span className="text-border mx-1">·</span>
          <span className="font-fantasy text-gold text-xs tracking-widest uppercase">Library</span>
          <div className="ml-auto flex items-center gap-1.5">
            {audioAssets.some(a => a.hidden) && (
              <button
                onClick={() => setShowHidden(v => !v)}
                title={showHidden ? 'Hide hidden tracks' : 'Show hidden tracks'}
                className={`flex items-center gap-1 text-[10px] transition-colors ${showHidden ? 'text-gold' : 'text-gray-600 hover:text-gray-400'}`}
              >
                {showHidden ? <Eye size={11}/> : <EyeOff size={11}/>}
                {audioAssets.filter(a => a.hidden).length} hidden
              </button>
            )}
            <span className="text-[10px] text-gray-600">{audioAssets.length} tracks</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            className="input-dark w-full pl-7 pr-6 py-1 text-xs"
            placeholder="Search name, artist, album…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300">
              <X size={10}/>
            </button>
          )}
        </div>

        {/* Tag filter pills */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTagFilter(tag)}
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border text-[10px] transition-colors ${
                  activeTags.includes(tag)
                    ? 'bg-gold/15 border-gold/50 text-gold'
                    : 'border-border text-gray-600 hover:border-gold/30 hover:text-gray-400'
                }`}
              >
                <Tag size={8}/>{tag}
              </button>
            ))}
            {activeTags.length > 0 && (
              <button onClick={() => setActiveTags([])} className="text-[10px] text-gray-600 hover:text-gray-400">Clear</button>
            )}
          </div>
        )}
      </div>

      {/* Preview player */}
      <div className={`shrink-0 border-b border-border px-4 py-2 transition-opacity ${libraryPreview.assetId ? 'opacity-100 bg-gold/5' : 'opacity-30 pointer-events-none'}`}>
        <div className="flex items-center gap-2">
          <CoverArt path={previewAsset?.cover_art_path} size={28} />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-gray-200 truncate">{previewAsset?.name ?? 'Nothing playing'}</p>
            {previewAsset?.artist && <p className="text-[10px] text-gray-500 truncate">{previewAsset.artist}</p>}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={pauseLibraryPreview}
              className="w-6 h-6 flex items-center justify-center rounded-full border border-border text-gray-400 hover:text-gold hover:border-gold transition-all"
            >
              {libraryPreview.isPlaying ? <Pause size={11}/> : <Play size={11} className="ml-0.5"/>}
            </button>
            <button onClick={stopLibraryPreview} className="text-gray-600 hover:text-gray-400"><X size={12}/></button>
          </div>
        </div>
        {/* Seekable bar */}
        <div className="mt-1.5">
          <div ref={seekBarRef} className="relative h-2 flex items-center cursor-pointer group/seek" onMouseDown={handleSeekMouseDown}>
            <div className="w-full h-0.5 bg-border rounded-full">
              <div className="h-full bg-gold rounded-full" style={{ width: `${progress * 100}%` }} />
            </div>
          </div>
          <div className="flex justify-between text-[9px] text-gray-700">
            <span>{fmt(elapsed)}</span><span>{fmt(duration)}</span>
          </div>
        </div>
      </div>

      {/* Track list — draggable */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="py-8 text-center text-gray-600 text-xs px-4">
            {audioAssets.length === 0 ? 'Library is empty. Add audio files to the tracks folder.' : 'No matching tracks'}
          </div>
        )}

        {filtered.map(asset => {
          const isActive = libraryPreview.assetId === asset.id
          const fullPath = getFullPath(asset)
          const isPathShown = showPathFor === asset.id
          return (
            <div
              key={asset.id}
              draggable
              onDragStart={e => handleDragStart(e, asset)}
              className={`group flex items-center gap-2 px-3 py-2 border-b border-border/30 cursor-grab active:cursor-grabbing transition-colors ${isActive ? 'bg-gold/8' : 'hover:bg-panel/60'} ${asset.hidden ? 'opacity-40' : ''}`}
              onClick={() => isActive ? pauseLibraryPreview() : playLibraryPreview(asset)}
            >
              {/* Cover with play overlay */}
              <div className="relative shrink-0">
                <CoverArt path={asset.cover_art_path} size={34} />
                <div className={`absolute inset-0 flex items-center justify-center rounded bg-black/50 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  {isActive && libraryPreview.isPlaying
                    ? <Pause size={13} className="text-white"/>
                    : <Play size={13} className="text-white ml-0.5"/>
                  }
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`text-xs truncate font-medium ${isActive ? 'text-gold' : 'text-gray-200'}`}>{asset.name}</p>
                {(asset.artist || asset.album) && (
                  <p className="text-[10px] text-gray-500 truncate">{[asset.artist, asset.album].filter(Boolean).join(' · ')}</p>
                )}
                {/* File path (toggleable) */}
                {isPathShown && (
                  <p className="text-[10px] font-mono text-gray-600 truncate mt-0.5" title={fullPath ?? 'Uploaded track'}>
                    {fullPath ?? 'Uploaded track (no path)'}
                  </p>
                )}
                {/* Tags */}
                <div className="flex flex-wrap gap-0.5 mt-0.5" onClick={e => e.stopPropagation()}>
                  {(asset.tags ?? []).map(tag => (
                    <TagChip key={tag} tag={tag} onRemove={() => removeTag(asset.id, tag)} />
                  ))}
                  {editTagFor === asset.id
                    ? <TagInput assetId={asset.id} existingTags={asset.tags ?? []} onDone={() => setEditTagFor(null)} />
                    : (
                      <button
                        onClick={e => { e.stopPropagation(); setEditTagFor(asset.id) }}
                        className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded border border-dashed border-border text-gray-700 hover:text-gold hover:border-gold/30 text-[10px] transition-colors"
                      >
                        <Plus size={8}/> tag
                      </button>
                    )
                  }
                </div>
              </div>

              {/* Duration */}
              {asset.duration_sec && (
                <span className="text-[10px] text-gray-600 shrink-0">{fmt(asset.duration_sec)}</span>
              )}

              {/* Action buttons */}
              <div className="shrink-0 flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                {/* Show path */}
                <button
                  onClick={() => setShowPathFor(isPathShown ? null : asset.id)}
                  title={isPathShown ? 'Hide path' : 'Show file path'}
                  className={`opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded border border-border transition-all ${isPathShown ? 'text-gold border-gold/50 opacity-100' : 'text-gray-500 hover:text-gold hover:border-gold/50'}`}
                >
                  <FolderInput size={11}/>
                </button>
                {/* Hide/unhide */}
                <button
                  onClick={() => toggleAssetHidden(asset.id, !asset.hidden)}
                  title={asset.hidden ? 'Unhide track' : 'Hide track'}
                  className={`opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded border border-border transition-all ${asset.hidden ? 'text-gold border-gold/50 opacity-100' : 'text-gray-500 hover:text-gold hover:border-gold/50'}`}
                >
                  {asset.hidden ? <Eye size={11}/> : <EyeOff size={11}/>}
                </button>
                {/* Add to scenario */}
                <div className="relative">
                  <button
                    onClick={() => setAddScenarioFor(addScenarioFor === asset.id ? null : asset.id)}
                    title="Add to current scenario"
                    className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded border border-border text-gray-500 hover:text-gold hover:border-gold/50 transition-all"
                  >
                    <ArrowRight size={12}/>
                  </button>
                  {addScenarioFor === asset.id && (
                    <AddToScenarioPopover asset={asset} onClose={() => setAddScenarioFor(null)} />
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer: actions + drag hint */}
      <div className="shrink-0 border-t border-border bg-midnight">
        {/* Add Library form */}
        {showAddLib && (
          <div className="px-3 pt-3 pb-2 border-b border-border space-y-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">New Library</p>
            <input
              type="text"
              value={libName}
              onChange={e => setLibName(e.target.value)}
              placeholder="Display name (e.g. Fantasy Ambience)"
              className="input-dark w-full text-xs py-1.5"
              autoFocus
            />
            <div className="flex gap-1.5">
              <input
                type="text"
                value={libPath}
                onChange={e => setLibPath(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddLib() }}
                placeholder="Folder path (e.g. C:\Music\Ambience)"
                className="input-dark flex-1 text-xs py-1.5 font-mono min-w-0"
              />
              <button
                onClick={handleBrowsePath}
                disabled={browsing}
                title="Browse for folder"
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-border text-xs text-gray-400 hover:text-gold hover:border-gold/50 transition-colors disabled:opacity-50 shrink-0"
              >
                <FolderInput size={13} />
                {browsing ? '…' : 'Browse'}
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddLib}
                disabled={libAdding || !libName.trim() || !libPath.trim()}
                className="px-3 py-1.5 bg-gold text-midnight text-xs font-semibold rounded-lg disabled:opacity-40"
              >
                {libAdding ? 'Adding…' : 'Add'}
              </button>
              <button
                onClick={() => { setShowAddLib(false); setLibName(''); setLibPath('') }}
                className="p-1.5 text-gray-500 hover:text-gray-300"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Action buttons row */}
        <div className="flex items-center gap-1 px-3 py-2">
          <button
            onClick={() => setShowAddLib(v => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-colors ${
              showAddLib ? 'border-gold/50 bg-gold/10 text-gold' : 'border-border text-gray-500 hover:text-gold hover:border-gold/30'
            }`}
          >
            <FolderPlus size={12} />
            Add Library
          </button>
          <button
            onClick={() => uploadInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border border-border text-gray-500 hover:text-gold hover:border-gold/30 transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader size={12} className="animate-spin" /> : <Upload size={12} />}
            {uploading ? 'Uploading…' : 'Upload Tracks'}
          </button>
          <input
            ref={uploadInputRef}
            type="file"
            accept="audio/*"
            multiple
            className="hidden"
            onChange={e => handleUploadFiles(e.target.files)}
          />
          <p className="ml-auto text-[10px] text-gray-700 hidden sm:block">Drag tracks to add</p>
        </div>
      </div>
    </div>
  )
}
