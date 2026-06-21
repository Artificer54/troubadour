import { useEffect, useRef, useState } from 'react'
import { Wifi, WifiOff, Loader } from 'lucide-react'

const STATUS_CONFIG = {
  connected:   { color: '#22c55e', label: 'Connected' },
  checking:    { color: '#f59e0b', label: 'Checking…' },
  unreachable: { color: '#ef4444', label: 'Unreachable' },
}

export default function NetworkStatusIcon() {
  const [status, setStatus] = useState('checking')
  const [open, setOpen]     = useState(false)
  const popoverRef = useRef(null)

  async function checkHealth() {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 3000)
      const res = await fetch('/api/health', { signal: controller.signal })
      clearTimeout(timer)
      setStatus(res.ok ? 'connected' : 'unreachable')
    } catch {
      setStatus('unreachable')
    }
  }

  useEffect(() => {
    checkHealth()
    const interval = setInterval(checkHealth, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const cfg = STATUS_CONFIG[status]
  const Icon = status === 'unreachable' ? WifiOff : status === 'checking' ? Loader : Wifi

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        title={`Network: ${cfg.label}`}
        className="flex items-center gap-1.5 p-1.5 text-gray-500 hover:text-gold transition-colors rounded-md hover:bg-gold/10"
      >
        <Icon size={15} className={status === 'checking' ? 'animate-spin' : ''} />
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: cfg.color, boxShadow: `0 0 4px ${cfg.color}` }}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 z-50 rounded-lg border border-border bg-panel shadow-xl text-xs">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="font-semibold text-sm text-gray-200">Network Status</span>
            <span className="flex items-center gap-1.5" style={{ color: cfg.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
              {cfg.label}
            </span>
          </div>

          <div className="px-4 py-3 border-b border-border space-y-1">
            <div className="text-gray-400">Server</div>
            <div className="font-mono text-gray-200 break-all">{window.location.origin}</div>
            <div className="text-gray-500 pt-1">
              Access from other devices using this machine&apos;s IP address and port 3001.
            </div>
          </div>

          <div className="px-4 py-3 border-b border-border space-y-2">
            <div className="font-semibold text-gray-300">LAN WiFi (same network)</div>
            <ol className="space-y-1.5 text-gray-400 list-decimal list-inside">
              <li>
                Find your PC&apos;s local IP:{' '}
                <span className="font-mono bg-midnight px-1 rounded">ipconfig</span> in CMD
                → look for <span className="text-gray-300">IPv4 Address</span> under your WiFi adapter
              </li>
              <li>
                On phone, open{' '}
                <span className="font-mono text-gray-300">http://192.168.x.x:3001</span>{' '}
                in a browser
              </li>
            </ol>
          </div>

          <div className="px-4 py-3 space-y-2">
            <div className="font-semibold text-gray-300">Tailscale (works across networks)</div>
            <ol className="space-y-1.5 text-gray-400 list-decimal list-inside">
              <li>Install Tailscale on PC and phone, sign in to the same account</li>
              <li>
                On phone: open{' '}
                <span className="font-mono text-gray-300">http://100.x.x.x:3001</span>
                <span className="block text-gray-500 mt-0.5">(your PC&apos;s Tailscale IP from the Tailscale app)</span>
              </li>
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}
