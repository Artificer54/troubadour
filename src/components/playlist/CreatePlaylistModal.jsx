import { useState, useRef } from 'react'
import { Search, Music, Image, X, Check, ChevronRight, ChevronLeft, Upload, FolderOpen, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import Modal from '../ui/Modal'
import FileUpload from '../ui/FileUpload'
import ScenarioTypeIcon from '../ui/ScenarioTypeIcon'
import { useAppStore } from '../../store/useAppStore'

const SCENARIO_TYPES = [
  { value: 'scene',    label: 'Scene' },
  { value: 'combat',  label: 'Combat' },
  { value: 'location',label: 'Location' },
]

const INTENSITY_NAMES = ['Calm', 'Tense', 'Intense', 'Frantic', 'Legendary']

export default function CreatePlaylistModal({ onClose }) {
  const createPlaylist      = useAppStore((s) => s.createPlaylist)
  const uploadScenarioImage = useAppStore((s) => s.uploadScenarioImage)
  const updatePlaylist      = useAppStore((s) => s.updatePlaylist)
  const addTrackToPlaylist  = useAppStore((s) => s.addTrackToPlaylist)
  const audioAssets         = useAppStore((s) => s.audioAssets)
  const intensityColors     = useAppStore((s) => s.intensityColors)
  const openLibraryFolder   = useAppStore((s) => s.openLibraryFolder)
  const scanLibraryFolder   = useAppStore((s) => s.scanLibraryFolder)

  // Step 0 = setup, steps 1..N = per-intensity tracks, step N+1 = confirm
  const [step, setStep]               = useState(0)
  const [name, setName]               = useState('')
  const [scenarioType, setScenarioType] = useState('scene')
  const [hasIntensities, setHasIntensities] = useState(true)
  const [intensityCount, setIntensityCount] = useState(3)
  const [bgImageFile, setBgImageFile] = useState(null)
  const [bgPreview, setBgPreview]     = useState(null)
  const [blur, setBlur]               = useState(12)
  const [darkness, setDarkness]       = useState(55)
  const [pendingTracks, setPendingTracks] = useState({}) // { [level]: Set<assetId> }
  const [search, setSearch]           = useState('')
  const [loading, setLoading]         = useState(false)
  const [scanning, setScanning]       = useState(false)
  const [scanResult, setScanResult]   = useState(null)
  const [showUpload, setShowUpload]   = useState(false)
  const fileInputRef = useRef()

  const levelCount = hasIntensities ? intensityCount : 1
  // step 0 = setup, steps 1..levelCount = tracks per level, step levelCount+1 = confirm
  const totalSteps = levelCount + 2
  const confirmStep = levelCount + 1

  const currentLevel = step - 1 // 0-indexed intensity level for current track-selection step

  const toggleTrack = (assetId) => {
    setPendingTracks((prev) => {
      const set = new Set(prev[currentLevel] ?? [])
      if (set.has(assetId)) set.delete(assetId)
      else set.add(assetId)
      return { ...prev, [currentLevel]: set }
    })
  }

  const handleImageFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    setBgImageFile(file)
    setBgPreview(URL.createObjectURL(file))
  }

  const handleImageDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    handleImageFile(file)
  }

  const clearImage = () => {
    setBgImageFile(null)
    setBgPreview(null)
  }

  const goNext = () => {
    if (step === 0 && !name.trim()) return
    setSearch('')
    setStep((s) => s + 1)
  }

  const goBack = () => {
    setSearch('')
    setStep((s) => s - 1)
  }

  const handleCreate = async () => {
    if (!name.trim()) return
    setLoading(true)
    try {
      const created = await createPlaylist({ name: name.trim(), hasIntensities, intensityCount: levelCount, scenarioType })
      if (!created) return

      if (bgImageFile) {
        const result = await uploadScenarioImage(bgImageFile, blur, darkness)
        if (result) await updatePlaylist(created.id, {
          background_image: result.filename,
          background_image_original: result.original,
          bg_blur: blur,
          bg_darkness: darkness,
        })
      }

      for (const [level, ids] of Object.entries(pendingTracks)) {
        for (const assetId of ids) {
          await addTrackToPlaylist(created.id, assetId, parseInt(level))
        }
      }
    } finally {
      setLoading(false)
    }
    onClose()
  }

  const handleScan = async () => {
    setScanning(true)
    setScanResult(null)
    const added = await scanLibraryFolder()
    setScanResult(added)
    setScanning(false)
  }

  const filteredAssets = audioAssets.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  )

  const selectedInLevel = new Set(pendingTracks[currentLevel] ?? [])
  const totalTracks = Object.values(pendingTracks).reduce((sum, s) => sum + (s?.size ?? 0), 0)

  // ── Step 0: Setup ──────────────────────────────────────────────────────────
  if (step === 0) {
    return (
      <Modal title="New Scenario" onClose={onClose}>
        <div className="space-y-5">
          {/* Scenario type */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Scenario Type</label>
            <div className="flex gap-2">
              {SCENARIO_TYPES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setScenarioType(value)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-lg border-2 text-xs font-medium transition-all ${
                    scenarioType === value
                      ? 'border-gold bg-gold/10 text-gold'
                      : 'border-border text-gray-500 hover:border-gray-400 hover:text-gray-300'
                  }`}
                >
                  <ScenarioTypeIcon type={value} size={18} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Scenario Name</label>
            <input
              className="input-dark w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tavern, Boss Battle, Dungeon Crawl"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && goNext()}
            />
          </div>

          {/* Background image */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block flex items-center gap-1.5">
              <Image size={11} /> Background Image <span className="normal-case text-gray-600">(optional)</span>
            </label>
            {bgPreview ? (
              <div className="space-y-3">
                <div className="relative rounded-lg overflow-hidden h-28 group">
                  <img src={bgPreview} alt="preview" className="w-full h-full object-cover" />
                  <button
                    onClick={clearImage}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-red-900/80 text-white rounded-full p-1 transition-colors"
                  >
                    <X size={12} />
                  </button>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                  <span className="absolute bottom-2 left-3 text-[10px] text-white/70">{bgImageFile?.name}</span>
                </div>
                <div className="space-y-2 px-1">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs text-gray-400">Blur</label>
                      <span className="text-xs font-mono text-gold">{blur}px</span>
                    </div>
                    <input type="range" min="0" max="30" step="1" value={blur}
                      onChange={(e) => setBlur(+e.target.value)} className="w-full accent-gold" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs text-gray-400">Overlay</label>
                      <span className="text-xs font-mono text-gold">{darkness}%</span>
                    </div>
                    <input type="range" min="0" max="90" step="5" value={darkness}
                      onChange={(e) => setDarkness(+e.target.value)} className="w-full accent-gold" />
                  </div>
                  <p className="text-[10px] text-gray-600">Blur baked into image on create — overlay applies live</p>
                </div>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-border hover:border-gold rounded-lg p-4 text-center cursor-pointer transition-colors group"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleImageDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageFile(e.target.files[0])}
                />
                <Upload size={16} className="mx-auto mb-1 text-gray-500 group-hover:text-gold transition-colors" />
                <p className="text-xs text-gray-400 group-hover:text-gray-200">Drop or click to add a background image</p>
                <p className="text-[10px] text-gray-600 mt-0.5">PNG, JPG, WEBP • max 10MB</p>
              </div>
            )}
          </div>

          {/* Intensities toggle */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => setHasIntensities((v) => !v)}
              className={`relative w-10 h-5 rounded-full transition-colors ${hasIntensities ? 'bg-gold' : 'bg-border'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${hasIntensities ? 'translate-x-5' : ''}`} />
            </div>
            <div>
              <span className="text-sm text-gray-300">Multiple Intensities</span>
              <p className="text-[10px] text-gray-500">Calm → Tense → Intense for dynamic music</p>
            </div>
          </label>

          {/* Intensity count buttons */}
          {hasIntensities && (
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Number of Intensity Levels</label>
              <div className="flex gap-2">
                {[2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setIntensityCount(n)}
                    className={`flex-1 py-2 rounded-lg border-2 font-semibold text-sm transition-all ${
                      intensityCount === n
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-border text-gray-500 hover:border-gray-400 hover:text-gray-300'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 mt-2 flex-wrap">
                {INTENSITY_NAMES.slice(0, intensityCount).map((n, i) => (
                  <span key={n} className="text-[10px] px-2 py-0.5 rounded-full border" style={{ color: intensityColors[i], borderColor: intensityColors[i] }}>{n}</span>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button
              type="button"
              onClick={goNext}
              disabled={!name.trim()}
              className="btn-gold flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              Next <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </Modal>
    )
  }

  // ── Steps 1..levelCount: Track selection per intensity ─────────────────────
  if (step >= 1 && step <= levelCount) {
    const levelName  = hasIntensities ? INTENSITY_NAMES[currentLevel] : 'Tracks'
    const levelColor = hasIntensities ? intensityColors[currentLevel] : intensityColors[0]

    return (
      <Modal title="Add Tracks" onClose={onClose}>
        <div className="space-y-3">
          {/* Level header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-semibold px-3 py-1 rounded-full border"
                style={{ color: levelColor, borderColor: levelColor, background: `${levelColor}18` }}
              >
                {levelName}
              </span>
              <span className="text-xs text-gray-500">
                {hasIntensities ? `intensity ${step} of ${levelCount}` : 'all tracks'}
              </span>
            </div>
            <span className="text-xs text-gray-500">{selectedInLevel.size} selected</span>
          </div>

          {/* Library folder actions */}
          <div className="flex gap-2">
            <button
              onClick={openLibraryFolder}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg border border-border text-gray-500 hover:text-gold hover:border-gold text-xs transition-colors"
            >
              <FolderOpen size={12} /> Open Folder
            </button>
            <button
              onClick={handleScan}
              disabled={scanning}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg border border-border text-gray-500 hover:text-gold hover:border-gold text-xs transition-colors disabled:opacity-50"
            >
              <RefreshCw size={12} className={scanning ? 'animate-spin' : ''} />
              {scanning ? 'Scanning…' : 'Scan Library'}
            </button>
          </div>
          {scanResult !== null && (
            <p className="text-xs text-center -mt-1">
              {scanResult > 0
                ? <span className="text-green-400">{scanResult} new file{scanResult !== 1 ? 's' : ''} found</span>
                : <span className="text-gray-600">Library is up to date</span>}
            </p>
          )}

          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              className="input-dark w-full pl-8 text-sm"
              placeholder="Search library…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Asset list */}
          <div className="max-h-44 overflow-y-auto space-y-0.5 pr-1">
            {filteredAssets.length === 0 && (
              <p className="text-xs text-gray-500 text-center py-6">
                {audioAssets.length === 0
                  ? 'Library is empty — open the folder, add audio files, then scan.'
                  : 'No matching tracks'}
              </p>
            )}
            {filteredAssets.map((asset) => {
              const selected = selectedInLevel.has(asset.id)
              return (
                <button
                  key={asset.id}
                  onClick={() => toggleTrack(asset.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                    selected ? 'border' : 'hover:bg-border'
                  }`}
                  style={selected ? { background: `${levelColor}15`, borderColor: `${levelColor}50` } : {}}
                >
                  {selected
                    ? <Check size={13} style={{ color: levelColor }} className="shrink-0" />
                    : <Music size={13} className="text-gray-500 shrink-0" />
                  }
                  <span className="text-sm truncate" style={selected ? { color: levelColor } : { color: '#d1d5db' }}>{asset.name}</span>
                </button>
              )
            })}
          </div>

          {/* Upload fallback */}
          <div className="border-t border-border pt-2">
            <button
              onClick={() => setShowUpload((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-400 transition-colors w-full"
            >
              <Upload size={11} /> Upload files directly
              {showUpload ? <ChevronUp size={11} className="ml-auto" /> : <ChevronDown size={11} className="ml-auto" />}
            </button>
            {showUpload && (
              <div className="mt-2">
                <FileUpload label="Upload audio file to library" onUploaded={() => {}} />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={goBack} className="btn-secondary flex items-center gap-1.5">
              <ChevronLeft size={14} /> Back
            </button>
            <button type="button" onClick={goNext} className="btn-secondary flex-1 text-gray-400">
              Skip
            </button>
            <button
              type="button"
              onClick={goNext}
              className="btn-gold flex-1 flex items-center justify-center gap-2"
            >
              Next <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </Modal>
    )
  }

  // ── Confirm step ───────────────────────────────────────────────────────────
  return (
    <Modal title="Ready to Create" onClose={onClose}>
      <div className="space-y-4">
        {/* Summary */}
        <div className="bg-midnight rounded-xl p-4 space-y-3">
          {bgPreview && (
            <div className="rounded-lg overflow-hidden h-20 mb-3">
              <img src={bgPreview} alt="background" className="w-full h-full object-cover opacity-80" />
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Scenario</p>
            <p className="text-gold font-fantasy text-lg">{name}</p>
          </div>

          {hasIntensities ? (
            <div className="space-y-1.5">
              {Array.from({ length: intensityCount }, (_, i) => {
                const count = pendingTracks[i]?.size ?? 0
                return (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: intensityColors[i] }}>{INTENSITY_NAMES[i]}</span>
                    <span className="text-xs text-gray-500">
                      {count > 0 ? `${count} track${count !== 1 ? 's' : ''}` : <span className="text-gray-600 italic">empty — add later</span>}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Tracks</span>
              <span className="text-xs text-gray-500">
                {totalTracks > 0 ? `${totalTracks} track${totalTracks !== 1 ? 's' : ''}` : <span className="text-gray-600 italic">none — add later</span>}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={goBack} className="btn-secondary flex items-center gap-1.5">
            <ChevronLeft size={14} /> Back
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={loading}
            className="btn-gold flex-1 disabled:opacity-50"
          >
            {loading ? 'Creating…' : 'Create Scenario'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
