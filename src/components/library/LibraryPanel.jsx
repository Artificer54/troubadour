import { useState, useEffect, useRef } from 'react'
import { Search, Play, Pause, X, Plus, Music2, Tag, ChevronDown, SkipForward } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { previewEngine } from '../../lib/previewEngine'

function CoverArt({ path, size = 40, className = '' }) {
  if (!path) return (
    <div className={`shrink-0 flex items-center justify-center bg-panel rounded ${className}`} style={{ width: size, height: size }}>
      <Music2 size={size * 0.4} className="text-gray-600" />
    </div>
  )
  return (
    <img
      src={`/images/covers/${path}`}
      alt="cover"
      className={`shrink-0 rounded object-cover ${className}`}
      style={{ width: size, height: size }}
      onError={(e) => { e.target.style.display = 'none' }}
    />
  )
}

function AddToScenarioPopover({ asset, onClose }) {
  const playlists = useAppStore((s) => s.playlists)
  const addTrack = useAppStore((s) => s.addTrackToPlaylist)
  const [selectedPlaylist, setSelectedPlaylist] = useState('')
  const [selectedLevel, setSelectedLevel] = useState(0)
  const [adding, setAdding] = useState(false)
  const [done, setDone] = useState(false)

  const INTENSITY_NAMES = ['Calm', 'Tense', 'Intense', 'Frantic', 'Legendary']
  const pl = playlists.find(p => p.id === selectedPlaylist)

  const handleAdd = async () => {
    if (!selectedPlaylist) return
    setAdding(true)
    await addTrack(selectedPlaylist, asset.id, selectedLevel)
    setAdding(false)
    setDone(true)
    setTimeout(onClose, 800)
  }

  return (
    <div className="absolute right-0 top-8 z-50 bg-panel border border-border rounded-xl shadow-xl p-3 w-56 space-y-2" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-300">Add to Scenario</span>
        <button onClick={onClose} className="text-gray-600 hover:text-gray-300"><X size={12}/></button>
      </div>
      <select
        className="input-dark w-full text-xs"
        value={selectedPlaylist}
        onChange={e => { setSelectedPlaylist(e.target.value); setSelectedLevel(0) }}
      >
        <option value="">Select scenario…</option>
        {playlists.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      {pl && pl.has_intensities && (
        <select
          className="input-dark w-full text-xs"
          value={selectedLevel}
          onChange={e => setSelectedLevel(+e.target.value)}
        >
          {Array.from({ length: pl.intensity_count }, (_, i) => (
            <option key={i} value={i}>{INTENSITY_NAMES[i]}</option>
          ))}
        </select>
      )}
      <button
        onClick={handleAdd}
        disabled={!selectedPlaylist || adding || done}
        className="btn-gold w-full text-xs disabled:opacity-50"
      >
        {done ? '✓ Added' : adding ? 'Adding…' : 'Add Track'}
      </button>
    </div>
  )
}

function TagChip({ tag, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-[10px]">
      {tag}
      {onRemove && (
        <button onClick={onRemove} className="hover:text-red-400 transition-colors">
          <X size={9}/>
        </button>
      )}
    </span>
  )
}

function TagInput({ assetId, existingTags, onDone }) {
  const addTag = useAppStore((s) => s.addTagToAsset)
  const [val, setVal] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    const t = val.trim()
    if (!t) return
    if (existingTags.includes(t.toLowerCase())) { setVal(''); return }
    await addTag(assetId, t)
    setVal('')
    onDone?.()
  }

  return (
    <form onSubmit={submit} className="flex gap-1">
      <input
        autoFocus
        className="input-dark text-[10px] px-2 py-0.5 flex-1 min-w-0"
        value={val}
        onChange={e => setVal(e.target.value)}
        placeholder="tag name…"
        onKeyDown={e => e.key === 'Escape' && onDone?.()}
      />
      <button type="submit" className="text-gold text-[10px] px-2 hover:underline">Add</button>
    </form>
  )
}

export default function LibraryPanel() {
  const audioAssets = useAppStore((s) => s.audioAssets)
  const libraryPreview = useAppStore((s) => s.libraryPreview)
  const playLibraryPreview = useAppStore((s) => s.playLibraryPreview)
  const pauseLibraryPreview = useAppStore((s) => s.pauseLibraryPreview)
  const stopLibraryPreview = useAppStore((s) => s.stopLibraryPreview)
  const removeTag = useAppStore((s) => s.removeTagFromAsset)
  const setAssetType = useAppStore((s) => s.setAssetType)
  const playlistVolume = useAppStore((s) => s.playlistVolume)

  const [search, setSearch] = useState('')
  const [activeTags, setActiveTags] = useState([])
  const [addScenarioFor, setAddScenarioFor] = useState(null)
  const [editTagFor, setEditTagFor] = useState(null)
  const [progress, setProgress] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [duration, setDuration] = useState(0)
  const rafRef = useRef(null)
  const seekBarRef = useRef(null)

  // Sync preview volume with store
  useEffect(() => {
    previewEngine.setVolume(playlistVolume)
  }, [playlistVolume])

  // RAF for preview progress
  useEffect(() => {
    if (!libraryPreview.isPlaying) {
      cancelAnimationFrame(rafRef.current)
      return
    }
    const tick = () => {
      const pos = previewEngine.getCurrentPosition()
      const dur = previewEngine.getCurrentDuration()
      setElapsed(pos)
      setDuration(dur)
      setProgress(dur > 0 ? pos / dur : 0)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [libraryPreview.isPlaying])

  // Stop preview when panel unmounts
  useEffect(() => () => stopLibraryPreview(), [])

  const fmt = (s) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const seekTo = (clientX) => {
    const el = seekBarRef.current
    if (!el || duration <= 0) return
    const rect = el.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    previewEngine.seekTo(ratio * duration)
  }

  const handleSeekMouseDown = (e) => {
    e.preventDefault()
    seekTo(e.clientX)
    const onMove = (ev) => seekTo(ev.clientX)
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  // Collect all unique tags across library
  const allTags = [...new Set(audioAssets.flatMap(a => a.tags ?? []))].sort()

  const toggleTagFilter = (tag) => {
    setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  const filtered = audioAssets.filter(a => {
    const q = search.toLowerCase()
    const matchesSearch = !q ||
      a.name.toLowerCase().includes(q) ||
      (a.artist ?? '').toLowerCase().includes(q) ||
      (a.album ?? '').toLowerCase().includes(q)
    const matchesTags = activeTags.length === 0 || activeTags.every(t => (a.tags ?? []).includes(t))
    return matchesSearch && matchesTags
  })

  const previewAsset = audioAssets.find(a => a.id === libraryPreview.assetId)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header / Search */}
      <div className="shrink-0 px-5 pt-5 pb-3 border-b border-border space-y-3">
        <div className="flex items-center gap-2">
          <Music2 size={16} className="text-gold shrink-0" />
          <h2 className="font-fantasy text-gold text-lg tracking-wide">Music Library</h2>
          <span className="ml-auto text-xs text-gray-500">{audioAssets.length} tracks</span>
        </div>

        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            className="input-dark w-full pl-8 text-sm"
            placeholder="Search by name, artist, album…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
              <X size={12}/>
            </button>
          )}
        </div>

        {/* Tag filter pills */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTagFilter(tag)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] transition-colors ${
                  activeTags.includes(tag)
                    ? 'bg-gold/15 border-gold/50 text-gold'
                    : 'border-border text-gray-500 hover:border-gold/30 hover:text-gray-300'
                }`}
              >
                <Tag size={9}/>{tag}
              </button>
            ))}
            {activeTags.length > 0 && (
              <button onClick={() => setActiveTags([])} className="text-[10px] text-gray-600 hover:text-gray-300 ml-1">
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Preview player bar */}
      <div className={`shrink-0 border-b border-border px-5 py-3 transition-all ${libraryPreview.assetId ? 'bg-gold/5' : 'opacity-40 pointer-events-none'}`}>
        <div className="flex items-center gap-3">
          <CoverArt path={previewAsset?.cover_art_path} size={36} />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-200 truncate">{previewAsset?.name ?? 'Nothing playing'}</p>
            {previewAsset?.artist && <p className="text-[10px] text-gray-500 truncate">{previewAsset.artist}</p>}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={pauseLibraryPreview}
              className="flex items-center justify-center w-8 h-8 rounded-full border border-border text-gray-300 hover:text-gold hover:border-gold transition-all"
            >
              {libraryPreview.isPlaying ? <Pause size={14}/> : <Play size={14} className="ml-0.5"/>}
            </button>
            <button
              onClick={stopLibraryPreview}
              className="text-gray-600 hover:text-gray-300 transition-colors"
            >
              <X size={14}/>
            </button>
          </div>
        </div>

        {/* Seekable progress */}
        <div className="mt-2">
          <div
            ref={seekBarRef}
            className="relative h-3 flex items-center cursor-pointer group/seek"
            onMouseDown={handleSeekMouseDown}
          >
            <div className="w-full h-1 bg-border rounded-full">
              <div className="h-full bg-gold rounded-full" style={{ width: `${progress * 100}%` }} />
            </div>
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-gold rounded-full opacity-0 group-hover/seek:opacity-100 pointer-events-none"
              style={{ left: `calc(${progress * 100}% - 5px)` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
            <span>{fmt(elapsed)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>
      </div>

      {/* Track list */}
      <div className="flex-1 overflow-y-auto py-1">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-center px-8">
            <Music2 size={32} className="text-gray-700" />
            <p className="text-gray-500 text-sm">
              {audioAssets.length === 0
                ? 'Your library is empty. Add audio files to the tracks folder.'
                : 'No matching tracks'}
            </p>
          </div>
        )}

        {filtered.map(asset => {
          const isPreviewActive = libraryPreview.assetId === asset.id
          return (
            <div
              key={asset.id}
              className={`group flex items-center gap-3 px-5 py-2.5 border-b border-border/40 transition-colors cursor-pointer ${
                isPreviewActive ? 'bg-gold/8' : 'hover:bg-panel/60'
              }`}
              onClick={() => {
                if (isPreviewActive) {
                  pauseLibraryPreview()
                } else {
                  playLibraryPreview(asset)
                }
              }}
            >
              {/* Cover art */}
              <div className="relative shrink-0">
                <CoverArt path={asset.cover_art_path} size={40} />
                <div className={`absolute inset-0 flex items-center justify-center rounded bg-black/50 transition-opacity ${
                  isPreviewActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}>
                  {isPreviewActive && libraryPreview.isPlaying
                    ? <Pause size={16} className="text-white" />
                    : <Play size={16} className="text-white ml-0.5" />
                  }
                </div>
              </div>

              {/* Track info */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm truncate font-medium ${isPreviewActive ? 'text-gold' : 'text-gray-200'}`}>
                  {asset.name}
                </p>
                {(asset.artist || asset.album) && (
                  <p className="text-[11px] text-gray-500 truncate">
                    {[asset.artist, asset.album].filter(Boolean).join(' · ')}
                  </p>
                )}
                {/* Tags */}
                <div className="flex flex-wrap gap-1 mt-1" onClick={e => e.stopPropagation()}>
                  {(asset.tags ?? []).map(tag => (
                    <TagChip key={tag} tag={tag} onRemove={() => removeTag(asset.id, tag)} />
                  ))}
                  {editTagFor === asset.id ? (
                    <TagInput assetId={asset.id} existingTags={asset.tags ?? []} onDone={() => setEditTagFor(null)} />
                  ) : (
                    <button
                      onClick={() => setEditTagFor(asset.id)}
                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border border-dashed border-border text-gray-600 hover:text-gold hover:border-gold/40 text-[10px] transition-colors"
                    >
                      <Plus size={9}/> tag
                    </button>
                  )}
                </div>
              </div>

              {/* Duration */}
              {asset.duration_sec && (
                <span className="text-[11px] text-gray-600 shrink-0">
                  {fmt(asset.duration_sec)}
                </span>
              )}

              {/* Track type selector */}
              <div className="shrink-0" onClick={e => e.stopPropagation()}>
                <select
                  value={asset.track_type ?? 'music'}
                  onChange={e => setAssetType(asset.id, e.target.value)}
                  className="input-dark text-[10px] px-1.5 py-0.5 rounded cursor-pointer"
                  style={{
                    color: asset.track_type === 'ambience' ? '#4ade80' : asset.track_type === 'sfx' ? '#38bdf8' : 'rgb(var(--color-ember))',
                  }}
                  title="Track type"
                >
                  <option value="music">Music</option>
                  <option value="ambience">Ambience</option>
                  <option value="sfx">SFX</option>
                </select>
              </div>

              {/* Add to scenario */}
              <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => setAddScenarioFor(addScenarioFor === asset.id ? null : asset.id)}
                  className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[11px] text-gray-500 hover:text-gold transition-all px-2 py-1 rounded border border-border hover:border-gold/40"
                  title="Add to scenario"
                >
                  <Plus size={11}/> Scenario
                </button>
                {addScenarioFor === asset.id && (
                  <AddToScenarioPopover
                    asset={asset}
                    onClose={() => setAddScenarioFor(null)}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
