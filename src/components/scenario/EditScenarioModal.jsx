import { useState } from 'react'
import Modal from '../ui/Modal'
import { useAppStore } from '../../store/useAppStore'

export default function EditScenarioModal({ scenario, onClose }) {
  const updatePlaylist = useAppStore((s) => s.updatePlaylist)
  const [name, setName] = useState(scenario.name ?? '')
  const [description, setDescription] = useState(scenario.description ?? '')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    await updatePlaylist(scenario.id, { name: name.trim(), description: description.trim() })
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
          <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Description <span className="normal-case text-gray-600">(optional)</span></label>
          <textarea
            className="input-dark w-full resize-none"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short subtitle shown under the scenario name…"
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
