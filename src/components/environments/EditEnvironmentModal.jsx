import { useState, useRef } from 'react'
import { X, Search, Plus, Trash2, Image } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'

export default function EditEnvironmentModal({ environment, onClose }) {
  const audioAssets                    = useAppStore((s) => s.audioAssets)
  const updateEnvironment              = useAppStore((s) => s.updateEnvironment)
  const deleteEnvironment              = useAppStore((s) => s.deleteEnvironment)
  const addTrackToEnvironment          = useAppStore((s) => s.addTrackToEnvironment)
  const removeTrackFromEnvironment     = useAppStore((s) => s.removeTrackFromEnvironment)
  const updatePreset                   = useAppStore((s) => s.updatePreset)
  const uploadEnvironmentImage         = useAppStore((s) => s.uploadEnvironmentImage)
  const reprocessEnvironmentBackground = useAppStore((s) => s.reprocessEnvironmentBackground)

  const [name, setName]     = useState(environment.name)
  const [search, setSearch] = useState('')
  const [busy, setBusy]     = useState(false)
  const [tab, setTab]       = useState('tracks') // 'tracks' | 'presets' | 'image'

  // Image state
  const [bgImageFile, setBgImageFile] = useState(null)
  const [bgPreview, setBgPreview]     = useState(
    environment.background_image ? `/images/${environment.background_image}` : null
  )
  const [removeImage, setRemoveImage] = useState(false)
  const [blur, setBlur]               = useState(environment.bg_blur ?? 12)
  const [darkness, setDarkness]       = useState(environment.bg_darkness ?? 55)
  const [imageError, setImageError]   = useState(null)
  const fileInputRef = useRef()

  const existingAssetIds = new Set(environment.environment_tracks?.map(t => t.asset_id) ?? [])
  const filtered = audioAssets.filter(
    (a) => !a.hidden && !existingAssetIds.has(a.id) &&
      a.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleImageFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    setBgImageFile(file)
    setBgPreview(URL.createObjectURL(file))
    setRemoveImage(false)
  }

  const clearImage = () => {
    setBgImageFile(null)
    setBgPreview(null)
    setRemoveImage(true)
  }

  const handleSave = async () => {
    setBusy(true)
    setImageError(null)

    const fields = { name }
    const hasExistingImage = !!environment.background_image

    if (bgImageFile) {
      const result = await uploadEnvironmentImage(bgImageFile, blur, darkness)
      if (!result) {
        setImageError('Image processing failed. Try a different image.')
        setBusy(false)
        return
      }
      fields.background_image          = result.filename
      fields.background_image_original = result.original
      fields.bg_blur                   = blur
      fields.bg_darkness               = darkness
    } else if (removeImage) {
      fields.background_image          = null
      fields.background_image_original = null
      fields.bg_blur                   = null
      fields.bg_darkness               = null
    } else if (hasExistingImage) {
      const blurChanged     = blur     !== (environment.bg_blur     ?? 12)
      const darknessChanged = darkness !== (environment.bg_darkness ?? 55)
      if (blurChanged || !environment.background_image_original) {
        await reprocessEnvironmentBackground(environment.id, blur, darkness)
        // darkness is stored in reprocess call; name/color updated below
      } else if (darknessChanged) {
        fields.bg_darkness = darkness
      }
    }

    await updateEnvironment(environment.id, fields)
    setBusy(false)
    onClose()
  }

  const handleDelete = async () => {
    if (!confirm(`Delete environment "${environment.name}"? This cannot be undone.`)) return
    await deleteEnvironment(environment.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="panel-card w-full max-w-lg flex flex-col gap-0 overflow-hidden" style={{ maxHeight: '85vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-dark text-sm font-semibold bg-transparent border-transparent focus:border-gold px-0 flex-1"
            placeholder="Environment name"
          />
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors ml-3">
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 py-2 border-b border-border shrink-0">
          {[
            { key: 'tracks',  label: 'Tracks' },
            { key: 'presets', label: 'Presets' },
            { key: 'image',   label: 'Photo' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`tab-btn ${tab === key ? 'tab-btn-active' : 'tab-btn-inactive'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {tab === 'tracks' && (
            <div className="flex flex-col h-full">
              {environment.environment_tracks?.length > 0 && (
                <div className="px-5 py-3 border-b border-border">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Current Tracks</p>
                  <div className="flex flex-col gap-1">
                    {environment.environment_tracks.map(track => (
                      <div key={track.id} className="group flex items-center gap-2 py-1">
                        <span className="flex-1 text-xs text-gray-300 truncate">{track.audio_assets?.name}</span>
                        <button
                          onClick={() => removeTrackFromEnvironment(environment.id, track.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="px-5 py-3 flex flex-col gap-2 flex-1 overflow-y-auto min-h-0">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest shrink-0">Add Tracks</p>
                <div className="relative shrink-0">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search assets…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input-dark w-full pl-7 text-xs py-1.5"
                  />
                </div>
                <div className="flex flex-col gap-0.5 overflow-y-auto">
                  {filtered.slice(0, 80).map(a => (
                    <button
                      key={a.id}
                      onClick={() => addTrackToEnvironment(environment.id, a.id)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-border text-left text-xs text-gray-300 transition-colors group"
                    >
                      <Plus size={11} className="text-gray-600 group-hover:text-gold shrink-0" />
                      <span className="truncate">{a.name}</span>
                    </button>
                  ))}
                  {filtered.length === 0 && (
                    <p className="text-xs text-gray-600 py-2">No assets found</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === 'presets' && (
            <div className="px-5 py-3 flex flex-col gap-3">
              {(environment.environment_presets?.length ?? 0) === 0 && (
                <p className="text-xs text-gray-600">No presets yet. Use "+ Save as preset" in the environment panel.</p>
              )}
              {environment.environment_presets?.map(preset => (
                <PresetEditor
                  key={preset.id}
                  environmentId={environment.id}
                  preset={preset}
                  onUpdate={updatePreset}
                />
              ))}
            </div>
          )}

          {tab === 'image' && (
            <div className="px-5 py-4 flex flex-col gap-4">
              {/* Preview / drop zone */}
              <div
                className={`relative w-full aspect-video rounded-xl border-2 border-dashed overflow-hidden flex items-center justify-center cursor-pointer transition-colors ${
                  bgPreview ? 'border-transparent' : 'border-border hover:border-gold/40'
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }}
                onDrop={e => { e.preventDefault(); handleImageFile(e.dataTransfer.files[0]) }}
              >
                {bgPreview ? (
                  <>
                    <img src={bgPreview} alt="preview" className="w-full h-full object-cover" />
                    <div
                      className="absolute inset-0"
                      style={{ backgroundColor: `rgb(var(--color-darkbg) / ${darkness / 100})` }}
                    />
                    <button
                      onClick={e => { e.stopPropagation(); clearImage() }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-red-500/70 transition-colors"
                      title="Remove image"
                    >
                      <X size={12} />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-600">
                    <Image size={28} />
                    <p className="text-xs">Click or drag an image</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => handleImageFile(e.target.files[0])}
              />

              {bgPreview && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-500 w-16 shrink-0">Blur</span>
                    <input
                      type="range" min="0" max="30" step="1" value={blur}
                      onChange={e => setBlur(parseInt(e.target.value))}
                      className="flex-1 accent-gold"
                    />
                    <span className="text-[10px] font-mono text-gray-400 w-8 text-right">{blur}px</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-500 w-16 shrink-0">Darkness</span>
                    <input
                      type="range" min="0" max="90" step="5" value={darkness}
                      onChange={e => setDarkness(parseInt(e.target.value))}
                      className="flex-1 accent-gold"
                    />
                    <span className="text-[10px] font-mono text-gray-400 w-8 text-right">{darkness}%</span>
                  </div>
                </div>
              )}

              {imageError && (
                <p className="text-xs text-red-400">{imageError}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-5 py-4 border-t border-border shrink-0">
          <button
            onClick={handleDelete}
            className="text-xs text-red-400 hover:text-red-300 transition-colors mr-auto"
          >
            Delete Environment
          </button>
          <button onClick={onClose} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
          <button onClick={handleSave} disabled={busy} className="btn-primary text-xs px-3 py-1.5">
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function PresetEditor({ environmentId, preset, onUpdate }) {
  const [name, setName]   = useState(preset.name)
  const [fade, setFade]   = useState(preset.fade_duration)
  const [saved, setSaved] = useState(false)

  const save = async () => {
    await onUpdate(environmentId, preset.id, { name, fadeDuration: fade })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="panel-card p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-dark flex-1 text-xs py-1"
        />
        <button onClick={save} className="text-xs px-2 py-1 rounded-md bg-gold/10 hover:bg-gold/20 text-gold transition-colors shrink-0">
          {saved ? 'Saved ✓' : 'Save'}
        </button>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[10px] text-gray-500 shrink-0">Fade</span>
        <input
          type="range" min="100" max="8000" step="100" value={fade}
          onChange={(e) => setFade(parseInt(e.target.value))}
          className="flex-1 accent-gold"
        />
        <span className="text-[10px] text-gray-400 font-mono w-12 text-right shrink-0">
          {(fade / 1000).toFixed(1)}s
        </span>
      </div>
    </div>
  )
}
