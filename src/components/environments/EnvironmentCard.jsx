import { useState } from 'react'
import { Play, Square, Settings, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import PresetPill from './PresetPill'
import EnvironmentTrackRow from './EnvironmentTrackRow'
import EditEnvironmentModal from './EditEnvironmentModal'

export default function EnvironmentCard({ environment }) {
  const activeEnvironmentIds  = useAppStore((s) => s.activeEnvironmentIds)
  const activePresetIds       = useAppStore((s) => s.activePresetIds)
  const activateEnvironment   = useAppStore((s) => s.activateEnvironment)
  const deactivateEnvironment = useAppStore((s) => s.deactivateEnvironment)
  const saveCurrentAsPreset   = useAppStore((s) => s.saveCurrentAsPreset)

  const [expanded, setExpanded]     = useState(false)
  const [showEdit, setShowEdit]     = useState(false)
  const [savingPreset, setSavingPreset] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')
  const [showPresetInput, setShowPresetInput] = useState(false)

  const isActive = activeEnvironmentIds.includes(environment.id)
  const activePresetId = activePresetIds[environment.id]
  const hasTracks = (environment.environment_tracks?.length ?? 0) > 0
  const hasPresets = (environment.environment_presets?.length ?? 0) > 0

  const toggleActive = () => {
    if (isActive) {
      deactivateEnvironment(environment.id)
    } else {
      activateEnvironment(environment.id)
    }
  }

  const handleSavePreset = async () => {
    if (!newPresetName.trim()) return
    setSavingPreset(true)
    await saveCurrentAsPreset(environment.id, newPresetName.trim())
    setNewPresetName('')
    setShowPresetInput(false)
    setSavingPreset(false)
  }

  return (
    <>
      <div
        className="panel-card overflow-hidden transition-all"
        style={{ borderColor: isActive ? `${environment.color}60` : undefined }}
      >
        {/* Card header */}
        <div className="flex items-center gap-2 px-3 py-2.5">
          {/* Color dot */}
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{
              backgroundColor: environment.color,
              boxShadow: isActive ? `0 0 6px 2px ${environment.color}80` : 'none',
            }}
          />

          {/* Name */}
          <span className="flex-1 text-sm font-medium text-gray-200 truncate min-w-0">
            {environment.name}
          </span>

          {/* Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={toggleActive}
              disabled={!hasTracks}
              title={isActive ? 'Stop' : 'Play'}
              className="p-1 rounded-md transition-colors disabled:opacity-30"
              style={isActive ? { color: environment.color } : { color: 'rgb(107 114 128)' }}
            >
              {isActive ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 rounded-md text-gray-500 hover:text-gray-300 transition-colors"
              title={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <button
              onClick={() => setShowEdit(true)}
              className="p-1 rounded-md text-gray-500 hover:text-gray-300 transition-colors"
              title="Edit environment"
            >
              <Settings size={13} />
            </button>
          </div>
        </div>

        {/* Presets row */}
        {hasPresets && (
          <div className="flex items-center gap-1.5 px-3 pb-2 flex-wrap">
            {environment.environment_presets.map(preset => (
              <PresetPill
                key={preset.id}
                environmentId={environment.id}
                preset={preset}
                isActive={activePresetId === preset.id}
                envColor={environment.color}
              />
            ))}
            {isActive && (
              <>
                {showPresetInput ? (
                  <div className="flex items-center gap-1">
                    <input
                      autoFocus
                      type="text"
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSavePreset()
                        if (e.key === 'Escape') { setShowPresetInput(false); setNewPresetName('') }
                      }}
                      placeholder="Preset name…"
                      className="input-dark text-[10px] px-2 py-0.5 w-24"
                    />
                    <button
                      onClick={handleSavePreset}
                      disabled={savingPreset || !newPresetName.trim()}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-gold/10 hover:bg-gold/20 text-gold transition-colors disabled:opacity-50"
                    >
                      {savingPreset ? '…' : 'Save'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowPresetInput(true)}
                    className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] text-gray-600 hover:text-gold border border-dashed border-border hover:border-gold/50 transition-colors"
                    title="Save current mix as preset"
                  >
                    <Plus size={8} />
                    Save mix
                  </button>
                )}
              </>
            )}
          </div>
        )}
        {!hasPresets && isActive && (
          <div className="px-3 pb-2">
            {showPresetInput ? (
              <div className="flex items-center gap-1">
                <input
                  autoFocus
                  type="text"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSavePreset()
                    if (e.key === 'Escape') { setShowPresetInput(false); setNewPresetName('') }
                  }}
                  placeholder="Preset name…"
                  className="input-dark text-[10px] px-2 py-0.5 w-28"
                />
                <button
                  onClick={handleSavePreset}
                  disabled={savingPreset || !newPresetName.trim()}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-gold/10 hover:bg-gold/20 text-gold transition-colors"
                >
                  {savingPreset ? '…' : 'Save'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowPresetInput(true)}
                className="flex items-center gap-0.5 text-[10px] text-gray-600 hover:text-gold transition-colors"
              >
                <Plus size={9} /> Save current mix as preset
              </button>
            )}
          </div>
        )}

        {/* Expanded track list */}
        {expanded && (
          <div className="px-3 pb-3 border-t border-border mt-0.5 pt-2">
            {hasTracks ? (
              <div className="flex flex-col">
                {environment.environment_tracks.map(track => (
                  <EnvironmentTrackRow
                    key={track.id}
                    environmentId={environment.id}
                    track={track}
                    isEnvActive={isActive}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-600 py-1">
                No tracks — click <Settings size={10} className="inline" /> to add some.
              </p>
            )}
          </div>
        )}
      </div>

      {showEdit && (
        <EditEnvironmentModal
          environment={environment}
          onClose={() => setShowEdit(false)}
        />
      )}
    </>
  )
}
