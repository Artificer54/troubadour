import { useState } from 'react'
import Modal from '../ui/Modal'
import { useAppStore } from '../../store/useAppStore'

const INTENSITY_NAMES = ['Calm', 'Tense', 'Intense', 'Frantic', 'Legendary']

export default function CreatePlaylistModal({ onClose }) {
  const createPlaylist = useAppStore((s) => s.createPlaylist)
  const [name, setName] = useState('')
  const [hasIntensities, setHasIntensities] = useState(true)
  const [intensityCount, setIntensityCount] = useState(3)
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    await createPlaylist({
      name: name.trim(),
      hasIntensities,
      intensityCount: hasIntensities ? intensityCount : 1,
    })
    setLoading(false)
    onClose()
  }

  return (
    <Modal title="New Scenario" onClose={onClose}>
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

        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div
            onClick={() => setHasIntensities(!hasIntensities)}
            className={`relative w-10 h-5 rounded-full transition-colors ${hasIntensities ? 'bg-gold' : 'bg-border'}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${hasIntensities ? 'translate-x-5' : ''}`}
            />
          </div>
          <div>
            <span className="text-sm text-gray-300">Multiple Intensities</span>
            <p className="text-[10px] text-gray-500">e.g. Calm → Tense → Intense for dynamic music</p>
          </div>
        </label>

        {hasIntensities && (
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">
              Number of Intensity Levels: <span className="text-gold">{intensityCount}</span>
            </label>
            <input
              type="range"
              min="2"
              max="5"
              value={intensityCount}
              onChange={(e) => setIntensityCount(+e.target.value)}
              className="w-full accent-gold"
            />
            <div className="flex gap-1 mt-2 flex-wrap">
              {INTENSITY_NAMES.slice(0, intensityCount).map((n, i) => (
                <span
                  key={n}
                  className={`text-[10px] px-2 py-0.5 rounded-full border ${
                    ['border-blue-400 text-blue-400','border-yellow-400 text-yellow-400','border-orange-400 text-orange-400','border-red-400 text-red-400','border-purple-400 text-purple-400'][i]
                  }`}
                >
                  {n}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={loading} className="btn-gold flex-1 disabled:opacity-50">
            {loading ? 'Creating…' : 'Create Scenario'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
