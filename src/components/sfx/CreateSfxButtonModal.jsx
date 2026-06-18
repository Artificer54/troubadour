import { useState } from 'react'
import { Search } from 'lucide-react'
import Modal from '../ui/Modal'
import FileUpload from '../ui/FileUpload'
import { useAppStore } from '../../store/useAppStore'

const COLORS = [
  '#c0392b', '#e67e22', '#f1c40f', '#27ae60',
  '#2980b9', '#8e44ad', '#1abc9c', '#e91e63',
]

export default function CreateSfxButtonModal({ panelId, onClose }) {
  const audioAssets = useAppStore((s) => s.audioAssets)
  const createSfxButton = useAppStore((s) => s.createSfxButton)

  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [selectedIds, setSelectedIds] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const toggle = (id) =>
    setSelectedIds((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id])

  const filtered = audioAssets.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  )

  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    await createSfxButton({ panelId, name: name.trim(), color, assetIds: selectedIds })
    setLoading(false)
    onClose()
  }

  return (
    <Modal title="Create SFX Button" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Button Name</label>
          <input
            className="input-dark w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Fireball, Sword Clash"
            autoFocus
            required
          />
        </div>

        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Color</label>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full border-2 transition-transform ${color === c ? 'scale-125 border-white' : 'border-transparent hover:scale-110'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">
            Audio Pool <span className="text-gray-600 normal-case">(one plays randomly on trigger)</span>
          </label>
          <FileUpload label="Upload audio files" onUploaded={(assets) =>
            setSelectedIds((s) => [...new Set([...s, ...assets.map((a) => a.id)])])
          } />
        </div>

        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            className="input-dark w-full pl-8"
            placeholder="Search library…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="max-h-44 overflow-y-auto space-y-0.5 pr-1">
          {filtered.map((a) => (
            <label key={a.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-border cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.includes(a.id)}
                onChange={() => toggle(a.id)}
                className="accent-gold"
              />
              <span className="text-xs text-gray-300">{a.name}</span>
            </label>
          ))}
        </div>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 text-sm font-semibold rounded-lg text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: color }}
          >
            {loading ? 'Creating…' : 'Create Button'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
