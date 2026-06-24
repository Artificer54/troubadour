import { useState, useEffect } from 'react'
import { RefreshCw, X } from 'lucide-react'

export default function UpdateBanner() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [applying, setApplying] = useState(false)
  const [applyMessage, setApplyMessage] = useState(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch('/api/update/status')
        if (!res.ok) return
        const data = await res.json()
        setUpdateAvailable(data.updateAvailable)
      } catch {
        // silently ignore network errors
      }
    }
    check()
  }, [])

  async function handleUpdate() {
    setApplying(true)
    try {
      const res = await fetch('/api/update/apply', { method: 'POST' })
      if (res.ok) {
        const data = await res.json().catch(() => ({}))
        if (data.devMode) {
          setApplyMessage(data.message ?? 'Pulled latest. Restart your dev server.')
        }
        // In PM2 mode the server exits — connection drops, nothing more to do
      }
    } catch {
      // expected in PM2 mode — server restarts and drops the connection
    }
  }

  if (!updateAvailable || dismissed) return null

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2 bg-gold/10 border-b border-gold/30 text-gold text-xs shrink-0">
      <div className="flex items-center gap-2">
        <RefreshCw size={12} className={applying ? 'animate-spin' : ''} />
        <span>
          {applyMessage
            ? applyMessage
            : applying
            ? 'Updating… server will restart automatically.'
            : 'A new version of Troubadour is available.'}
        </span>
      </div>
      {!applying && (
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleUpdate}
            className="px-2 py-0.5 rounded bg-gold/20 hover:bg-gold/30 transition-colors font-medium"
          >
            Update Now
          </button>
          <button onClick={() => setDismissed(true)} className="text-gold/60 hover:text-gold">
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  )
}
