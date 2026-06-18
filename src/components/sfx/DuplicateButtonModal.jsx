import { useState } from 'react'
import Modal from '../ui/Modal'
import { useAppStore } from '../../store/useAppStore'

export default function DuplicateButtonModal({ button, onClose }) {
  const sfxPanels = useAppStore((s) => s.sfxPanels)
  const duplicateSfxButton = useAppStore((s) => s.duplicateSfxButton)

  const [targetPanelId, setTargetPanelId] = useState('')
  const [newName, setNewName] = useState(`${button.name} (copy)`)
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!targetPanelId || !newName.trim()) return
    setLoading(true)
    await duplicateSfxButton(button.id, targetPanelId, newName.trim())
    setLoading(false)
    onClose()
  }

  const allPanels = sfxPanels

  return (
    <Modal title={`Duplicate "${button.name}"`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-xs text-gray-400">
          Creates a new button in the target panel reusing the same audio file references — no re-upload.
        </p>

        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">New Name</label>
          <input
            className="input-dark w-full"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Target Panel</label>
          <select
            className="input-dark w-full"
            value={targetPanelId}
            onChange={(e) => setTargetPanelId(e.target.value)}
            required
          >
            <option value="">Select a panel…</option>
            {allPanels.map((p) => (
              <option key={p.id} value={p.id}>
                [{p.panel_type.toUpperCase()}] {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-50">
            {loading ? 'Duplicating…' : 'Duplicate'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
