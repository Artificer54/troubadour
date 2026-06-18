import { useState } from 'react'
import { Palette, ChevronDown, ChevronUp, Check } from 'lucide-react'
import { useAppStore, THEMES } from '../../store/useAppStore'

const THEME_PREVIEWS = {
  darkfantasy: { bg: '#111827', accent: '#d4af37', ember: '#c0392b' },
  arcane:      { bg: '#0d0818', accent: '#a855f7', ember: '#7c3aed' },
  battlefield: { bg: '#0f1a0a', accent: '#84cc16', ember: '#b45309' },
  celestial:   { bg: '#0a0f1e', accent: '#93c5fd', ember: '#60a5fa' },
}

export default function ThemeSelector() {
  const [open, setOpen] = useState(false)
  const activeTheme = useAppStore((s) => s.activeTheme)
  const setTheme = useAppStore((s) => s.setTheme)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 bg-panel/60 hover:bg-panel transition-colors text-sm border border-border rounded-xl"
      >
        <div className="flex items-center gap-2 text-gray-400">
          <Palette size={13} />
          <span className="font-medium text-xs">Theme</span>
          <span className="text-xs text-gold">{THEMES[activeTheme]?.label}</span>
        </div>
        {open ? <ChevronUp size={13} className="text-gray-500" /> : <ChevronDown size={13} className="text-gray-500" />}
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1.5 p-2 bg-panel border border-border rounded-xl shadow-2xl z-50 space-y-1">
          {Object.entries(THEMES).map(([key, theme]) => {
            const preview = THEME_PREVIEWS[key]
            const isActive = activeTheme === key
            return (
              <button
                key={key}
                onClick={() => { setTheme(key); setOpen(false) }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all text-left ${
                  isActive ? 'border-gold bg-gold/5' : 'border-border hover:border-gray-500 hover:bg-border/30'
                }`}
              >
                <div className="flex gap-1 shrink-0">
                  <div className="w-3 h-3 rounded-full border border-white/10" style={{ background: preview.accent }} />
                  <div className="w-3 h-3 rounded-full border border-white/10" style={{ background: preview.ember }} />
                </div>
                <span className="text-xs text-gray-200 font-medium flex-1">{theme.label}</span>
                {isActive && <Check size={11} className="text-gold shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
