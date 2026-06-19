import { useState, useRef } from 'react'
import { Image, X, Upload } from 'lucide-react'
import Modal from '../ui/Modal'
import { useAppStore } from '../../store/useAppStore'

export default function EditScenarioModal({ scenario, onClose }) {
  const updatePlaylist      = useAppStore((s) => s.updatePlaylist)
  const uploadScenarioImage = useAppStore((s) => s.uploadScenarioImage)
  const reprocessBackground = useAppStore((s) => s.reprocessBackground)

  const [name, setName]               = useState(scenario.name ?? '')
  const [description, setDescription] = useState(scenario.description ?? '')
  const [bgImageFile, setBgImageFile] = useState(null)
  const [bgPreview, setBgPreview]     = useState(
    scenario.background_image ? `/images/${scenario.background_image}` : null
  )
  const [removeImage, setRemoveImage] = useState(false)
  const [blur, setBlur]               = useState(scenario.bg_blur     ?? 12)
  const [darkness, setDarkness]       = useState(scenario.bg_darkness ?? 55)
  const [loading, setLoading]         = useState(false)
  const fileInputRef = useRef()

  const hasExistingImage = !!scenario.background_image
  const canReprocess     = !!scenario.background_image_original

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

  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)

    const fields = { name: name.trim(), description: description.trim() }

    if (bgImageFile) {
      // New image picked — upload with current blur/darkness, replace old
      const result = await uploadScenarioImage(bgImageFile, blur, darkness)
      if (result) {
        fields.background_image          = result.filename
        fields.background_image_original = result.original
        fields.bg_blur                   = blur
        fields.bg_darkness               = darkness
      }
    } else if (removeImage) {
      fields.background_image          = null
      fields.background_image_original = null
      fields.bg_blur                   = null
      fields.bg_darkness               = null
    } else if (hasExistingImage) {
      const blurChanged     = blur     !== (scenario.bg_blur     ?? 12)
      const darknessChanged = darkness !== (scenario.bg_darkness ?? 55)
      if (canReprocess && (blurChanged || darknessChanged)) {
        // Re-run sharp on the stored original with new settings
        await reprocessBackground(scenario.id, blur, darkness)
      }
      fields.bg_blur     = blur
      fields.bg_darkness = darkness
    }

    await updatePlaylist(scenario.id, fields)
    setLoading(false)
    onClose()
  }

  return (
    <Modal title="Edit Scenario" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Scenario Name</label>
          <input
            className="input-dark w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Tavern, Boss Battle, Dungeon Crawl"
            autoFocus
            required
          />
        </div>

        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">
            Description <span className="normal-case text-gray-600">(optional)</span>
          </label>
          <textarea
            className="input-dark w-full resize-none"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short subtitle shown under the scenario name…"
          />
        </div>

        {/* Background image */}
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block flex items-center gap-1.5">
            <Image size={11} /> Background Image <span className="normal-case text-gray-600">(optional)</span>
          </label>
          {bgPreview ? (
            <div className="space-y-3">
              <div className="relative rounded-lg overflow-hidden h-24 group">
                <img src={bgPreview} alt="preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 bg-black/60 hover:bg-red-900/80 text-white rounded-full p-1 transition-colors"
                >
                  <X size={12} />
                </button>
                {!bgImageFile && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-2 right-2 bg-black/60 hover:bg-gold/80 text-white rounded px-2 py-0.5 text-[10px] transition-colors flex items-center gap-1"
                  >
                    <Upload size={9} /> Replace
                  </button>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
              </div>

              {/* Blur / Darkness sliders */}
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
                    <label className="text-xs text-gray-400">Darkness</label>
                    <span className="text-xs font-mono text-gold">{darkness}%</span>
                  </div>
                  <input type="range" min="0" max="90" step="5" value={darkness}
                    onChange={(e) => setDarkness(+e.target.value)} className="w-full accent-gold" />
                </div>
                <p className="text-[10px] text-gray-600">
                  {bgImageFile
                    ? 'Effects baked into image on save'
                    : canReprocess
                    ? 'Effects reprocessed from original on save'
                    : 'Re-upload image to apply blur/darkness changes'}
                </p>
              </div>
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-border hover:border-gold rounded-lg p-3 text-center cursor-pointer transition-colors group"
              onClick={() => fileInputRef.current?.click()}
              onDrop={(e) => { e.preventDefault(); handleImageFile(e.dataTransfer.files[0]) }}
              onDragOver={(e) => e.preventDefault()}
            >
              <Upload size={14} className="mx-auto mb-1 text-gray-500 group-hover:text-gold transition-colors" />
              <p className="text-xs text-gray-400 group-hover:text-gray-200">Drop or click to add a background image</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleImageFile(e.target.files[0])}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={loading || !name.trim()} className="btn-gold flex-1 disabled:opacity-50">
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
