import { useState } from 'react'
import { ChevronDown, ChevronUp, Settings } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'

export default function AdvancedControls() {
  const [open, setOpen]           = useState(false)
  const fadeDuration              = useAppStore((s) => s.fadeDuration)
  const setFadeDuration           = useAppStore((s) => s.setFadeDuration)
  const loopSingle                = useAppStore((s) => s.loopSingle)
  const toggleLoopSingle          = useAppStore((s) => s.toggleLoopSingle)
  const shuffle                   = useAppStore((s) => s.shuffle)
  const toggleShuffle             = useAppStore((s) => s.toggleShuffle)
  const loopUntilEnabled          = useAppStore((s) => s.loopUntilEnabled)
  const loopUntilMinutes          = useAppStore((s) => s.loopUntilMinutes)
  const toggleLoopUntil           = useAppStore((s) => s.toggleLoopUntil)
  const setLoopUntilMinutes       = useAppStore((s) => s.setLoopUntilMinutes)

  const fadeSeconds = (fadeDuration / 1000).toFixed(1)

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-panel/60 hover:bg-panel transition-colors text-sm"
      >
        <div className="flex items-center gap-2 text-gray-400">
          <Settings size={14} />
          <span className="font-medium">Advanced Controls</span>
        </div>
        {open ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
      </button>

      {open && (
        <div className="px-4 py-3 space-y-4 bg-midnight/50">
          {/* Fade Duration */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs text-gray-400 uppercase tracking-wider">Fade Duration</label>
              <span className="text-xs font-mono text-gold">{fadeSeconds}s</span>
            </div>
            <input
              type="range" min="500" max="10000" step="100"
              value={fadeDuration}
              onChange={(e) => setFadeDuration(+e.target.value)}
              className="w-full accent-gold"
            />
            <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
              <span>0.5s (instant)</span><span>10s (slow)</span>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2">
            <Toggle
              label="Smart Shuffle"
              description="Play each track once before repeating"
              value={shuffle}
              onToggle={toggleShuffle}
            />
            <Toggle
              label="Loop Single Track"
              description="Repeat the current track instead of advancing"
              value={loopSingle && !loopUntilEnabled}
              onToggle={toggleLoopSingle}
              disabled={loopUntilEnabled}
            />
            <Toggle
              label="Loop Until"
              description="Repeat a track until it has played for X minutes, then advance"
              value={loopUntilEnabled}
              onToggle={toggleLoopUntil}
            />
            {loopUntilEnabled && (
              <div className="pl-0 flex items-center gap-3">
                <label className="text-xs text-gray-400 shrink-0">Loop for</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={loopUntilMinutes}
                  onChange={e => setLoopUntilMinutes(+e.target.value)}
                  className="input-dark w-16 text-xs py-1 text-center"
                />
                <span className="text-xs text-gray-500">minutes, then advance</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Toggle({ label, description, value, onToggle, disabled }) {
  return (
    <label className={`flex items-center justify-between gap-3 select-none group ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
      <div>
        <p className="text-sm text-gray-300 group-hover:text-gray-100 transition-colors">{label}</p>
        {description && <p className="text-[10px] text-gray-500">{description}</p>}
      </div>
      <button
        type="button"
        onClick={disabled ? undefined : onToggle}
        disabled={disabled}
        className={`relative shrink-0 w-10 h-5 rounded-full transition-colors ${value ? 'bg-gold' : 'bg-border'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : ''}`} />
      </button>
    </label>
  )
}
