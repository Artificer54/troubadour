import { useState } from 'react'
import { X } from 'lucide-react'
import { useAppStore, ENV_COLORS } from '../../store/useAppStore'

export default function CreateEnvironmentModal({ onClose }) {
  const environments      = useAppStore((s) => s.environments)
  const createEnvironment = useAppStore((s) => s.createEnvironment)

  const nextColor = ENV_COLORS[environments.length % ENV_COLORS.length]
  const [name, setName]   = useState('')
  const [color, setColor] = useState(nextColor)
  const [busy, setBusy]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    await createEnvironment(name.trim(), color)
    setBusy(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="panel-card w-full max-w-sm p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-100">New Environment</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-3 items-center">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-9 h-9 rounded-lg border border-border bg-midnight cursor-pointer p-0.5 shrink-0"
              title="Environment color"
            />
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Environment name…"
              className="input-dark flex-1"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {ENV_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="w-6 h-6 rounded-full border-2 transition-all"
                style={{
                  backgroundColor: c,
                  borderColor: color === c ? 'white' : 'transparent',
                }}
              />
            ))}
          </div>

          <div className="flex gap-2 pt-1">
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
