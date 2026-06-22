import { useState, useRef } from 'react'
import { X, Image } from 'lucide-react'
import { useAppStore, ENV_COLORS } from '../../store/useAppStore'

export default function CreateEnvironmentModal({ onClose }) {
  const environments           = useAppStore((s) => s.environments)
  const createEnvironment      = useAppStore((s) => s.createEnvironment)
  const uploadEnvironmentImage = useAppStore((s) => s.uploadEnvironmentImage)
  const updateEnvironment      = useAppStore((s) => s.updateEnvironment)

  const color = ENV_COLORS[environments.length % ENV_COLORS.length]

  const [name, setName]           = useState('')
  const [busy, setBusy]           = useState(false)
  const [bgImageFile, setBgImageFile] = useState(null)
  const [bgPreview, setBgPreview] = useState(null)
  const [blur, setBlur]           = useState(12)
  const [darkness, setDarkness]   = useState(55)
  const [imageError, setImageError] = useState(null)
  const fileInputRef = useRef()

  const handleImageFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    setBgImageFile(file)
    setBgPreview(URL.createObjectURL(file))
  }

  const clearImage = () => {
    setBgImageFile(null)
    setBgPreview(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    setImageError(null)

    const env = await createEnvironment(name.trim(), color)

    if (bgImageFile && env?.id) {
      const result = await uploadEnvironmentImage(bgImageFile, blur, darkness)
      if (result) {
        await updateEnvironment(env.id, {
          background_image: result.filename,
          background_image_original: result.original,
          bg_blur: blur,
          bg_darkness: darkness,
        })
      } else {
        setImageError('Image upload failed — environment created without image.')
        setBusy(false)
        return
      }
    }

    setBusy(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="panel-card w-full max-w-sm flex flex-col gap-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-gray-100">New Environment</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-0">
          {/* Name */}
          <div className="px-5 py-4 border-b border-border">
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Environment name…"
              className="input-dark w-full"
            />
          </div>

          {/* Photo upload */}
          <div className="px-5 py-4 flex flex-col gap-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Background Photo (optional)</p>

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
                    type="button"
                    onClick={e => { e.stopPropagation(); clearImage() }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-red-500/70 transition-colors"
                    title="Remove image"
                  >
                    <X size={12} />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-600">
                  <Image size={24} />
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
              <div className="flex flex-col gap-2">
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

            {imageError && <p className="text-xs text-red-400">{imageError}</p>}
          </div>

          {/* Footer */}
          <div className="flex gap-2 px-5 py-4 border-t border-border">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={!name.trim() || busy} className="btn-primary flex-1">
              {busy ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
