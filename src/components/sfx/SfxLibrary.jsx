import { useState } from 'react'
import { Search, Copy, Trash2, Zap } from 'lucide-react'
import SfxButton from './SfxButton'
import DuplicateButtonModal from './DuplicateButtonModal'
import { useAppStore } from '../../store/useAppStore'

const TYPE_LABELS = { global: 'Global', player: 'Player', encounter: 'Encounter' }
const TYPE_COLORS = {
  global: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  player: 'text-green-400 bg-green-400/10 border-green-400/30',
  encounter: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
}

export default function SfxLibrary() {
  const sfxButtons = useAppStore((s) => s.sfxButtons)
  const deleteSfxButton = useAppStore((s) => s.deleteSfxButton)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [duplicating, setDuplicating] = useState(null)

  const filtered = sfxButtons.filter((b) => {
    const matchName = b.name.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === 'all' || b.sfx_panels?.panel_type === filterType
    return matchName && matchType
  })

  return (
    <div className="h-full flex flex-col">
      {/* Filters */}
      <div className="flex gap-2 mb-3 flex-wrap">
        <div className="relative flex-1 min-w-32">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            className="input-dark w-full pl-8 py-1.5 text-xs"
            placeholder="Search buttons…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1">
          {['all', 'global', 'player', 'encounter'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`tab-btn ${filterType === t ? 'tab-btn-active' : 'tab-btn-inactive'}`}
            >
              {t === 'all' ? 'All' : TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-center opacity-50">
          <div>
            <Zap size={28} className="mx-auto text-gray-600 mb-2" />
            <p className="text-sm text-gray-400">No SFX buttons found</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filtered.map((btn) => (
            <div
              key={btn.id}
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-midnight/60 hover:bg-border/40 group"
            >
              {/* Mini preview button */}
              <div className="shrink-0">
                <SfxButton button={btn} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 truncate font-medium">{btn.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {btn.sfx_panels && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium uppercase tracking-wide ${TYPE_COLORS[btn.sfx_panels.panel_type] ?? ''}`}>
                      {btn.sfx_panels.panel_type}
                    </span>
                  )}
                  <span className="text-[10px] text-gray-500">
                    {btn.sfx_panels?.name ?? 'No panel'}
                  </span>
                  <span className="text-[10px] text-gray-600">
                    {(btn.sfx_button_files ?? []).length} file{(btn.sfx_button_files ?? []).length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={() => setDuplicating(btn)}
                  title="Duplicate to another panel"
                  className="p-1.5 rounded text-gray-400 hover:text-gold hover:bg-gold/10 transition-colors"
                >
                  <Copy size={13} />
                </button>
                <button
                  onClick={() => deleteSfxButton(btn.id)}
                  title="Delete"
                  className="p-1.5 rounded text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {duplicating && (
        <DuplicateButtonModal button={duplicating} onClose={() => setDuplicating(null)} />
      )}
    </div>
  )
}
