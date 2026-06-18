import { useState, useRef } from 'react'
import { Upload, Loader } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'

export default function FileUpload({ onUploaded, label = 'Upload Audio' }) {
  const inputRef = useRef()
  const [loading, setLoading] = useState(false)
  const uploadAudio = useAppStore((s) => s.uploadAudio)

  const handleFiles = async (files) => {
    setLoading(true)
    const results = []
    for (const file of files) {
      if (!file.type.startsWith('audio/')) continue
      const asset = await uploadAudio(file)
      if (asset) results.push(asset)
    }
    setLoading(false)
    if (onUploaded) onUploaded(results)
  }

  const onDrop = (e) => {
    e.preventDefault()
    handleFiles([...e.dataTransfer.files])
  }

  return (
    <div
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => inputRef.current?.click()}
      className="border-2 border-dashed border-border hover:border-gold rounded-lg p-4 text-center cursor-pointer transition-colors group"
    >
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles([...e.target.files])}
      />
      {loading ? (
        <div className="flex items-center justify-center gap-2 text-gold">
          <Loader size={16} className="animate-spin" />
          <span className="text-xs">Uploading…</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1">
          <Upload size={18} className="text-gray-500 group-hover:text-gold transition-colors" />
          <span className="text-xs text-gray-400 group-hover:text-gray-200">{label}</span>
          <span className="text-[10px] text-gray-600">Drop files or click • MP3, WAV, OGG</span>
        </div>
      )}
    </div>
  )
}
