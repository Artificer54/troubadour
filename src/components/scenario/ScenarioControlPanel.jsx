import { useState, useEffect, useRef } from 'react'
import { Play, Pause, SkipForward, Square, Music2, Plus, Trash2, Loader, Pencil } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import ScenarioDisk from '../ui/ScenarioDisk'
import AdvancedControls from '../ui/AdvancedControls'
import AddTrackModal from '../playlist/AddTrackModal'
import EditScenarioModal from './EditScenarioModal'
import VolumeSlider from '../ui/VolumeSlider'
import { audioEngine } from '../../lib/audioEngine'

const INTENSITY_LABELS = ['Calm', 'Tense', 'Intense', 'Frantic', 'Legendary']
const INTENSITY_GLOW   = ['intensity-0-glow', 'intensity-1-glow', 'intensity-2-glow', 'intensity-3-glow', 'intensity-4-glow']

export default function ScenarioControlPanel() {
  const playlists         = useAppStore((s) => s.playlists)
  const selectedId        = useAppStore((s) => s.selectedScenarioId)
  const activePlaylistId  = useAppStore((s) => s.activePlaylistId)
  const activeIntensity   = useAppStore((s) => s.activeIntensity)
  const isPlaying         = useAppStore((s) => s.isPlaying)
  const isTransitioning   = useAppStore((s) => s.isTransitioning)
  const currentTrack      = useAppStore((s) => s.currentTrack)
  const playlistVolume    = useAppStore((s) => s.playlistVolume)
  const sfxVolume         = useAppStore((s) => s.sfxVolume)
  const setPlaylistVolume = useAppStore((s) => s.setPlaylistVolume)
  const setSfxVolume      = useAppStore((s) => s.setSfxVolume)
  const startPlaylist     = useAppStore((s) => s.startPlaylist)
  const setActiveIntensity= useAppStore((s) => s.setActiveIntensity)
  const pauseResume       = useAppStore((s) => s.pauseResume)
  const stopPlayback      = useAppStore((s) => s.stopPlayback)
  const skipTrack         = useAppStore((s) => s.skipTrack)
  const removeTrack       = useAppStore((s) => s.removeTrackFromPlaylist)

  const [addTrackFor, setAddTrackFor] = useState(null)
  const [editingScenario, setEditingScenario] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const rafRef = useRef(null)
  const progressBarRef = useRef(null)

  const scenario = playlists.find((p) => p.id === selectedId)
  const isActiveScenario = scenario?.id === activePlaylistId

  // Progress bar polling
  useEffect(() => {
    const tick = () => {
      if (isPlaying) {
        const pos = audioEngine.getCurrentPosition()
        const dur = audioEngine.getCurrentDuration()
        setElapsed(pos)
        setDuration(dur)
        setProgress(dur > 0 ? pos / dur : 0)
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [isPlaying])

  const fmt = (s) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const seekToRatio = (clientX) => {
    const el = progressBarRef.current
    if (!el || duration <= 0) return
    const rect = el.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    audioEngine.seekTo(ratio * duration)
  }

  const handleProgressMouseDown = (e) => {
    e.preventDefault()
    seekToRatio(e.clientX)
    const onMove = (ev) => seekToRatio(ev.clientX)
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const handlePlay = (intensityLevel) => {
    if (!scenario) return
    if (isActiveScenario && activeIntensity === intensityLevel && isPlaying) {
      pauseResume()
    } else if (isActiveScenario && activeIntensity === intensityLevel && !isPlaying && currentTrack) {
      // paused — resume
      pauseResume()
    } else {
      // stopped or different scenario/intensity — start fresh
      startPlaylist(scenario, intensityLevel)
    }
  }

  const handleIntensitySwitch = (level) => {
    if (isActiveScenario) {
      setActiveIntensity(level)
    } else if (scenario) {
      startPlaylist(scenario, level)
    }
  }

  if (!scenario) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-4">
        <Music2 size={48} className="text-gray-600" />
        <div>
          <p className="text-gray-400 font-medium">No scenario selected</p>
          <p className="text-sm text-gray-600 mt-1">Pick a scenario from the sidebar, or create a new one.</p>
        </div>
      </div>
    )
  }

  const intensityCount = scenario.has_intensities ? scenario.intensity_count : 1
  const currentIntensityTracks = (scenario.playlist_tracks ?? [])
    .filter((t) => t.intensity_level === (isActiveScenario ? activeIntensity : 0))
    .sort((a, b) => a.position - b.position)

  const displayIntensity = isActiveScenario ? activeIntensity : 0

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Top: Disk + Now Playing */}
      <div className="flex items-center gap-6 px-6 py-5 border-b border-border bg-midnight/40">
        <div className="shrink-0">
          <ScenarioDisk
            isPlaying={isActiveScenario && isPlaying}
            isTransitioning={isActiveScenario && isTransitioning}
            intensity={isActiveScenario ? activeIntensity : 0}
            size={110}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 group/title">
            <h2 className="font-fantasy text-gold text-xl tracking-wide truncate">{scenario.name}</h2>
            <button
              onClick={() => setEditingScenario(true)}
              className="opacity-0 group-hover/title:opacity-100 p-1 text-gray-600 hover:text-gold transition-all shrink-0"
              title="Edit scenario"
            >
              <Pencil size={13} />
            </button>
          </div>

          {scenario.description ? (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{scenario.description}</p>
          ) : null}

          {isActiveScenario && currentTrack ? (
            <>
              <div className="flex items-center gap-1.5 mt-1">
                {isTransitioning
                  ? <><Loader size={11} className="text-gold animate-spin" /><span className="text-xs text-gold">Transitioning…</span></>
                  : <><Music2 size={11} className="text-gold" /><span className="text-xs text-gray-300 truncate">{currentTrack.audio_assets?.name}</span></>
                }
              </div>

              {/* Seekable progress bar */}
              <div className="mt-2">
                <div
                  ref={progressBarRef}
                  className="relative h-4 flex items-center cursor-pointer group/seek"
                  onMouseDown={handleProgressMouseDown}
                >
                  <div className="w-full h-1.5 bg-border rounded-full">
                    <div
                      className="h-full bg-gold rounded-full transition-none"
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                  {/* Draggable thumb */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-gold rounded-full shadow opacity-0 group-hover/seek:opacity-100 transition-opacity pointer-events-none"
                    style={{ left: `calc(${progress * 100}% - 6px)` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-gray-600 -mt-0.5">
                  <span>{fmt(elapsed)}</span>
                  <span>{fmt(duration)}</span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-xs text-gray-500 mt-1">
              {isActiveScenario && !currentTrack ? 'Stopped' : 'Not playing — click an intensity to start'}
            </p>
          )}
        </div>
      </div>

      {/* Intensity buttons */}
      {scenario.has_intensities && (
        <div className="px-6 py-4 border-b border-border">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-3">Intensity</p>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: intensityCount }, (_, i) => {
              const isCurrentIntensity = isActiveScenario && activeIntensity === i
              const levelTracks = (scenario.playlist_tracks ?? []).filter((t) => t.intensity_level === i)

              return (
                <button
                  key={i}
                  onClick={() => handleIntensitySwitch(i)}
                  title={`${levelTracks.length} track${levelTracks.length !== 1 ? 's' : ''}`}
                  className={`
                    relative px-4 py-2 rounded-xl border-2 font-semibold text-sm transition-all duration-200
                    ${isCurrentIntensity
                      ? `intensity-${i} ${INTENSITY_GLOW[i]}`
                      : `border-border text-gray-500 hover:border-gray-400 hover:text-gray-300`
                    }
                  `}
                >
                  {INTENSITY_LABELS[i]}
                  {isCurrentIntensity && isPlaying && (
                    <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full intensity-${i}-bg-dot playing-glow`} />
                  )}
                  <span className="block text-[9px] font-normal opacity-60 mt-0.5">{levelTracks.length} tracks</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Playback transport */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between gap-4">
          {/* Transport buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePlay(isActiveScenario ? activeIntensity : 0)}
              className={`flex items-center justify-center w-11 h-11 rounded-full border-2 transition-all font-bold ${
                isActiveScenario && isPlaying
                  ? 'border-gold bg-gold/10 text-gold playing-glow'
                  : 'border-border text-gray-400 hover:border-gold hover:text-gold'
              }`}
            >
              {isActiveScenario && isPlaying
                ? <Pause size={18} />
                : <Play size={18} className="ml-0.5" />}
            </button>

            <button
              onClick={skipTrack}
              disabled={!isActiveScenario || !isPlaying}
              className="flex items-center justify-center w-9 h-9 rounded-full border border-border text-gray-500 hover:text-gold hover:border-gold transition-all disabled:opacity-30"
            >
              <SkipForward size={16} />
            </button>

            <button
              onClick={stopPlayback}
              disabled={!isActiveScenario}
              className="flex items-center justify-center w-9 h-9 rounded-full border border-border text-gray-500 hover:text-red-400 hover:border-red-400 transition-all disabled:opacity-30"
            >
              <Square size={14} />
            </button>
          </div>

          {/* Volume controls */}
          <div className="flex flex-col gap-1 flex-1 max-w-[200px]">
            <VolumeSlider label="Music" value={playlistVolume} onChange={setPlaylistVolume} />
            <VolumeSlider label="SFX" value={sfxVolume} onChange={setSfxVolume} />
          </div>
        </div>
      </div>

      {/* Track list for current intensity */}
      <div className="flex-1 px-6 py-4 space-y-4">
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">
            {scenario.has_intensities
              ? `${INTENSITY_LABELS[displayIntensity]} Tracks`
              : 'Tracks'}
          </p>

          {currentIntensityTracks.length === 0 ? (
            <p className="text-xs text-gray-600 py-2">No tracks yet. Add some below.</p>
          ) : (
            <div className="space-y-0.5">
              {currentIntensityTracks.map((track) => {
                const isCurrent = isActiveScenario && currentTrack?.id === track.id
                return (
                  <div
                    key={track.id}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg group/track transition-colors ${
                      isCurrent ? 'bg-gold/10' : 'hover:bg-border/40'
                    }`}
                  >
                    <Music2 size={12} className={isCurrent ? 'text-gold' : 'text-gray-600'} />
                    <span className={`text-xs flex-1 truncate ${isCurrent ? 'text-gold' : 'text-gray-400'}`}>
                      {track.audio_assets?.name}
                    </span>
                    {isCurrent && isPlaying && (
                      <div className="flex gap-0.5">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="w-0.5 h-3 bg-gold rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => removeTrack(track.id, scenario.id)}
                      className="opacity-0 group-hover/track:opacity-100 text-gray-600 hover:text-red-400 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          <button
            onClick={() => setAddTrackFor({ playlist: scenario, intensityLevel: displayIntensity })}
            className="mt-2 w-full flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-border hover:border-gold/50 hover:text-gold text-gray-500 text-xs transition-colors"
          >
            <Plus size={12} />
            Add tracks{scenario.has_intensities ? ` to ${INTENSITY_LABELS[displayIntensity]}` : ''}
          </button>
        </div>

        {/* Advanced controls */}
        <AdvancedControls />
      </div>

      {addTrackFor && (
        <AddTrackModal
          playlist={addTrackFor.playlist}
          intensityLevel={addTrackFor.intensityLevel}
          onClose={() => setAddTrackFor(null)}
        />
      )}

      {editingScenario && (
        <EditScenarioModal
          scenario={scenario}
          onClose={() => setEditingScenario(false)}
        />
      )}
    </div>
  )
}
