import { useState, useRef } from 'react'
import { Plus, ChevronLeft, Play, Square, Settings, Pencil, X } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import MixerPanel from '../mixer/MixerPanel'
import EnvironmentTrackRow from './EnvironmentTrackRow'
import CreateEnvironmentModal from './CreateEnvironmentModal'
import EditEnvironmentModal from './EditEnvironmentModal'

export default function EnvironmentsPanel() {
  const environments         = useAppStore((s) => s.environments)
  const activeEnvironmentIds = useAppStore((s) => s.activeEnvironmentIds)
  const [showCreate, setShowCreate]       = useState(false)
  const [selectedEnvId, setSelectedEnvId] = useState(null)

  const activeEnvironments = environments.filter(e => activeEnvironmentIds.includes(e.id))
  const selectedEnv = environments.find(e => e.id === selectedEnvId)

  if (selectedEnv) {
    return (
      <EnvironmentDetail
        environment={selectedEnv}
        onBack={() => setSelectedEnvId(null)}
        activeEnvironments={activeEnvironments}
      />
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <MixerPanel activeEnvironments={activeEnvironments} />

      <div className="flex items-center justify-between px-3 py-2 border-t border-border shrink-0">
        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">Environments</span>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md bg-gold/10 hover:bg-gold/20 text-gold transition-colors"
        >
          <Plus size={10} />
          New
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {environments.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-8">
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-border flex items-center justify-center">
              <Plus size={18} className="text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">No environments yet</p>
              <p className="text-xs text-gray-600 mt-1">Create one to add looping ambient tracks</p>
            </div>
            <button onClick={() => setShowCreate(true)} className="btn-secondary text-xs px-4 py-2">
              Create Environment
            </button>
          </div>
        )}

        {environments.map(env => {
          const isActive = activeEnvironmentIds.includes(env.id)
          const trackCount = env.environment_tracks?.length ?? 0
          return (
            <div
              key={env.id}
              onClick={() => setSelectedEnvId(env.id)}
              className="group flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-colors border-b border-border/50 hover:bg-panel/60"
            >
              <div
                className="shrink-0 w-2 h-2 rounded-full"
                style={{
                  backgroundColor: env.color,
                  boxShadow: isActive ? `0 0 6px 2px ${env.color}80` : 'none',
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-gray-300">{env.name}</p>
                <p className="text-[10px] text-gray-500">
                  {trackCount} track{trackCount !== 1 ? 's' : ''}
                  {env.environment_presets?.length ? ` · ${env.environment_presets.length} preset${env.environment_presets.length !== 1 ? 's' : ''}` : ''}
                </p>
              </div>
              {isActive && (
                <div className="shrink-0 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: env.color }} />
              )}
            </div>
          )
        })}
      </div>

      {showCreate && <CreateEnvironmentModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}

function EnvironmentDetail({ environment, onBack, activeEnvironments }) {
  const playlists            = useAppStore((s) => s.playlists)
  const selectedScenarioId   = useAppStore((s) => s.selectedScenarioId)
  const activeEnvironmentIds = useAppStore((s) => s.activeEnvironmentIds)
  const activePresetIds      = useAppStore((s) => s.activePresetIds)
  const activateEnvironment  = useAppStore((s) => s.activateEnvironment)
  const deactivateEnvironment= useAppStore((s) => s.deactivateEnvironment)
  const applyPreset          = useAppStore((s) => s.applyPreset)
  const saveCurrentAsPreset  = useAppStore((s) => s.saveCurrentAsPreset)
  const deletePreset         = useAppStore((s) => s.deletePreset)
  const updatePreset         = useAppStore((s) => s.updatePreset)

  const [showEdit, setShowEdit]           = useState(false)
  const [showPresetInput, setShowPresetInput] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')
  const [savingPreset, setSavingPreset]   = useState(false)
  const [renamingPresetId, setRenamingPresetId] = useState(null)
  const [renameValue, setRenameValue]     = useState('')

  const isActive = activeEnvironmentIds.includes(environment.id)
  const activePresetId = activePresetIds[environment.id]
  const hasTracks = (environment.environment_tracks?.length ?? 0) > 0

  const selectedScenario = playlists.find(p => p.id === selectedScenarioId)

  // Resolve background image: env image > scenario image > none
  const envBg = environment.background_image
    ? `/images/${environment.background_image}?v=${encodeURIComponent(environment.updated_at ?? '')}`
    : null
  const scenarioBg = !envBg && selectedScenario?.background_image
    ? `/images/${selectedScenario.background_image}?v=${encodeURIComponent(selectedScenario.updated_at ?? '')}`
    : null
  const bgImage = envBg ?? scenarioBg
  const bgDarkness = envBg
    ? (environment.bg_darkness ?? 55)
    : (selectedScenario?.bg_darkness ?? 55)

  const toggleActive = () => {
    if (isActive) deactivateEnvironment(environment.id)
    else activateEnvironment(environment.id)
  }

  const handleSavePreset = async () => {
    if (!newPresetName.trim()) return
    setSavingPreset(true)
    await saveCurrentAsPreset(environment.id, newPresetName.trim())
    setNewPresetName('')
    setShowPresetInput(false)
    setSavingPreset(false)
  }

  const startRename = (preset) => {
    setRenamingPresetId(preset.id)
    setRenameValue(preset.name)
  }

  const commitRename = async (presetId) => {
    if (renameValue.trim()) {
      await updatePreset(environment.id, presetId, { name: renameValue.trim() })
    }
    setRenamingPresetId(null)
  }

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {/* Background image */}
      {bgImage && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center z-0 pointer-events-none"
            style={{ backgroundImage: `url(${bgImage})` }}
          />
          <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{ backgroundColor: `rgb(var(--color-darkbg) / ${bgDarkness / 100})` }}
          />
        </>
      )}

      <div className="relative z-10 flex flex-col h-full overflow-hidden">
        {/* Compact mixer — Master/Music/SFX only */}
        <div className={bgImage ? 'panel-frost' : ''}>
          <MixerPanel activeEnvironments={activeEnvironments} hideEnvFaders />
        </div>

        {/* Env header */}
        <div className={`flex items-center gap-2 px-3 py-2.5 border-b border-border shrink-0 ${bgImage ? 'panel-frost' : 'bg-midnight/40'}`}>
          <button
            onClick={onBack}
            className="p-1 rounded-md text-gray-500 hover:text-gray-300 transition-colors shrink-0"
            title="Back to environments"
          >
            <ChevronLeft size={16} />
          </button>

          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{
              backgroundColor: environment.color,
              boxShadow: isActive ? `0 0 6px 2px ${environment.color}80` : 'none',
            }}
          />

          <span className="flex-1 text-sm font-medium text-gray-200 truncate min-w-0 font-fantasy">
            {environment.name}
          </span>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={toggleActive}
              disabled={!hasTracks}
              title={isActive ? 'Stop' : 'Play'}
              className="p-1.5 rounded-md transition-colors disabled:opacity-30"
              style={isActive ? { color: environment.color } : { color: 'rgb(107 114 128)' }}
            >
              {isActive ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
            </button>
            <button
              onClick={() => setShowEdit(true)}
              className="p-1.5 rounded-md text-gray-500 hover:text-gray-300 transition-colors"
              title="Edit environment"
            >
              <Settings size={13} />
            </button>
          </div>
        </div>

        {/* Presets row */}
        {((environment.environment_presets?.length ?? 0) > 0 || true) && (
          <div className={`px-3 py-2 border-b border-border shrink-0 ${bgImage ? 'panel-frost' : ''}`}>
            <div className="flex items-center gap-1.5 flex-wrap">
              {environment.environment_presets?.map(preset => (
                <div key={preset.id} className="group/preset flex items-center gap-0.5">
                  {renamingPresetId === preset.id ? (
                    <input
                      autoFocus
                      type="text"
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onBlur={() => commitRename(preset.id)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') commitRename(preset.id)
                        if (e.key === 'Escape') setRenamingPresetId(null)
                      }}
                      className="input-dark text-[10px] px-2 py-0.5 w-24"
                    />
                  ) : (
                    <button
                      onClick={() => applyPreset(environment.id, preset.id)}
                      onDoubleClick={() => startRename(preset)}
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all whitespace-nowrap"
                      style={
                        activePresetId === preset.id
                          ? { backgroundColor: `${environment.color}30`, borderColor: environment.color, color: environment.color }
                          : { borderColor: 'rgb(var(--color-border))', color: 'rgb(156 163 175)' }
                      }
                      title="Click to apply · Double-click to rename"
                    >
                      {preset.name}
                    </button>
                  )}
                  <button
                    onClick={() => deletePreset(environment.id, preset.id)}
                    className="opacity-0 group-hover/preset:opacity-100 text-gray-600 hover:text-red-400 transition-all"
                    title="Delete preset"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}

              {/* Save as preset */}
              {showPresetInput ? (
                <div className="flex items-center gap-1">
                  <input
                    autoFocus
                    type="text"
                    value={newPresetName}
                    onChange={e => setNewPresetName(e.target.value)}
                    onKeyDown={e => {
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
                  <button
                    onClick={() => { setShowPresetInput(false); setNewPresetName('') }}
                    className="text-gray-600 hover:text-gray-300 transition-colors"
                  >
                    <X size={10} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowPresetInput(true)}
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] text-gray-600 hover:text-gold border border-dashed border-border hover:border-gold/50 transition-colors"
                  title="Save current mix as preset"
                >
                  <Plus size={8} />
                  Save as preset
                </button>
              )}
            </div>
          </div>
        )}

        {/* Track rows — each track is its own mixer line */}
        <div className={`flex-1 overflow-y-auto ${bgImage ? 'panel-frost' : ''}`}>
          {hasTracks ? (
            <div className="flex flex-col divide-y divide-border/40">
              {environment.environment_tracks.map(track => (
                <EnvironmentTrackRow
                  key={track.id}
                  environmentId={environment.id}
                  track={track}
                  isEnvActive={isActive}
                  envColor={environment.color}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center gap-2 py-8">
              <p className="text-sm text-gray-500">No tracks yet</p>
              <p className="text-xs text-gray-600">Click <Settings size={11} className="inline" /> to add looping tracks</p>
            </div>
          )}
        </div>
      </div>

      {showEdit && (
        <EditEnvironmentModal environment={environment} onClose={() => setShowEdit(false)} />
      )}
    </div>
  )
}
