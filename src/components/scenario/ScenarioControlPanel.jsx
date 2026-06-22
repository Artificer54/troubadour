import { useState, useEffect, useRef } from 'react'
import { Play, Pause, SkipForward, Square, Music2, Plus, Trash2, Loader, Pencil, Pin, Zap, ChevronDown, ChevronUp } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import ScenarioDisk from '../ui/ScenarioDisk'
import AdvancedControls from '../ui/AdvancedControls'
import AddTrackModal from '../playlist/AddTrackModal'
import EditScenarioModal from './EditScenarioModal'
import VolumeSlider from '../ui/VolumeSlider'
import SfxMatrix from '../sfx/SfxMatrix'
import { audioEngine } from '../../lib/audioEngine'

const INTENSITY_LABELS = ['Calm', 'Tense', 'Intense', 'Frantic', 'Legendary']
const INTENSITY_GLOW   = ['intensity-0-glow', 'intensity-1-glow', 'intensity-2-glow', 'intensity-3-glow', 'intensity-4-glow']

export default function ScenarioControlPanel() {
  const playlists           = useAppStore((s) => s.playlists)
  const selectedId          = useAppStore((s) => s.selectedScenarioId)
  const activePlaylistId    = useAppStore((s) => s.activePlaylistId)
  const activeIntensity     = useAppStore((s) => s.activeIntensity)
  const isPlaying           = useAppStore((s) => s.isPlaying)
  const isTransitioning     = useAppStore((s) => s.isTransitioning)
  const currentTrack        = useAppStore((s) => s.currentTrack)
  const playlistVolume      = useAppStore((s) => s.playlistVolume)
  const sfxVolume           = useAppStore((s) => s.sfxVolume)
  const setPlaylistVolume   = useAppStore((s) => s.setPlaylistVolume)
  const setSfxVolume        = useAppStore((s) => s.setSfxVolume)
  const startPlaylist       = useAppStore((s) => s.startPlaylist)
  const setActiveIntensity  = useAppStore((s) => s.setActiveIntensity)
  const pauseResume         = useAppStore((s) => s.pauseResume)
  const stopPlayback        = useAppStore((s) => s.stopPlayback)
  const skipTrack           = useAppStore((s) => s.skipTrack)
  const removeTrack             = useAppStore((s) => s.removeTrackFromPlaylist)
  const pinnedStartTracks       = useAppStore((s) => s.pinnedStartTracks)
  const setPinnedStartTrack     = useAppStore((s) => s.setPinnedStartTrack)
  const startPlaylistAtTrack    = useAppStore((s) => s.startPlaylistAtTrack)

  const addTrack = useAppStore((s) => s.addTrackToPlaylist)

  const [addTrackFor, setAddTrackFor]         = useState(null)
  const [editingScenario, setEditingScenario] = useState(false)
  const [dragOver, setDragOver]               = useState(false)
  const [progress, setProgress]               = useState(0)
  const [duration, setDuration]               = useState(0)
  const [elapsed, setElapsed]                 = useState(0)
  const [viewingIntensity, setViewingIntensity] = useState(0)
  const rafRef         = useRef(null)
  const progressBarRef = useRef(null)

  const scenario         = playlists.find((p) => p.id === selectedId)
  const isActiveScenario = scenario?.id === activePlaylistId

  // Sync viewing intensity when scenario changes or audio engine switches intensity
  useEffect(() => {
    setViewingIntensity(isActiveScenario ? activeIntensity : 0)
  }, [selectedId])

  useEffect(() => {
    if (isActiveScenario) setViewingIntensity(activeIntensity)
  }, [activeIntensity, isActiveScenario])

  // RAF only runs while playing — stops when paused/stopped
  useEffect(() => {
    if (!isPlaying) {
      cancelAnimationFrame(rafRef.current)
      return
    }
    const tick = () => {
      const pos = audioEngine.getCurrentPosition()
      const dur = audioEngine.getCurrentDuration()
      setElapsed(pos)
      setDuration(dur)
      setProgress(dur > 0 ? pos / dur : 0)
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
      pauseResume()
    } else {
      startPlaylist(scenario, intensityLevel)
    }
  }

  const handleIntensityTab = (level) => {
    setViewingIntensity(level)
    // Only switch audio if this scenario is actively playing
    if (isActiveScenario && isPlaying) {
      setActiveIntensity(level)
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

  const intensityCount   = scenario.has_intensities ? scenario.intensity_count : 1
  const displayIntensity = viewingIntensity
  const bgImage           = scenario.background_image ? `/images/${scenario.background_image}?v=${encodeURIComponent(scenario.updated_at ?? '')}` : null

  const currentIntensityTracks = (scenario.playlist_tracks ?? [])
    .filter((t) => t.intensity_level === displayIntensity)
    .sort((a, b) => a.position - b.position)

  return (
    <div className="relative flex flex-col h-full overflow-y-auto">
      {/* Background image layer */}
      {bgImage && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center z-0 pointer-events-none"
            style={{ backgroundImage: `url(${bgImage})` }}
          />
          <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundColor: `rgb(var(--color-darkbg) / ${(scenario.bg_darkness ?? 55) / 100})` }} />
        </>
      )}

      {/* All content sits above bg */}
      <div className="relative z-10 flex flex-col h-full">

        {/* Top: Disk + Now Playing */}
        <div className={`flex items-center gap-6 px-6 py-5 border-b border-border shrink-0 ${bgImage ? 'panel-frost' : 'bg-midnight/40'}`}>
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
                {isActiveScenario && !currentTrack ? 'Stopped' : 'Not playing — press play to start'}
              </p>
            )}
          </div>
        </div>

        {/* Intensity buttons — full width, equal sizing */}
        {scenario.has_intensities && (
          <div className={`border-b border-border shrink-0 ${bgImage ? 'panel-frost' : ''}`}>
            <div className="flex">
              {Array.from({ length: intensityCount }, (_, i) => {
                const isCurrentIntensity = isActiveScenario && activeIntensity === i
                const levelTracks = (scenario.playlist_tracks ?? []).filter((t) => t.intensity_level === i)

                return (
                  <button
                    key={i}
                    onClick={() => handleIntensityTab(i)}
                    title={`${levelTracks.length} track${levelTracks.length !== 1 ? 's' : ''}`}
                    className={`
                      relative flex-1 flex flex-col items-center py-3 px-2 border-r last:border-r-0 border-border
                      font-semibold text-sm transition-all duration-200
                      ${isCurrentIntensity
                        ? `intensity-${i} bg-white/5 ${INTENSITY_GLOW[i]}`
                        : viewingIntensity === i
                        ? 'text-gray-300 bg-white/5'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                      }
                    `}
                  >
                    {INTENSITY_LABELS[i]}
                    {isCurrentIntensity && isPlaying && (
                      <span className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full intensity-${i}-bg-dot playing-glow`} />
                    )}
                    <span className="text-[9px] font-normal opacity-60 mt-0.5">{levelTracks.length} tracks</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Playback transport */}
        <div className={`px-6 py-4 border-b border-border shrink-0 ${bgImage ? 'panel-frost' : ''}`}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePlay(viewingIntensity)}
                className={`flex items-center justify-center w-11 h-11 rounded-full border-2 transition-all font-bold ${
                  isActiveScenario && isPlaying
                    ? 'border-gold bg-gold/10 text-gold playing-glow'
                    : 'border-border text-gray-400 hover:border-gold hover:text-gold'
                }`}
              >
                {isActiveScenario && isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
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

            <div className="flex flex-col gap-1 flex-1 max-w-[200px]">
              <VolumeSlider label="Music" value={playlistVolume} onChange={setPlaylistVolume} />
              <VolumeSlider label="SFX" value={sfxVolume} onChange={setSfxVolume} />
            </div>
          </div>
        </div>

        {/* Track list */}
        <div
          className={`flex-1 px-6 py-4 space-y-4 transition-colors ${bgImage ? 'panel-frost' : ''} ${dragOver ? 'bg-gold/5 ring-1 ring-gold/30 ring-inset' : ''}`}
          onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setDragOver(true) }}
          onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(false) }}
          onDrop={async e => {
            e.preventDefault()
            setDragOver(false)
            const assetId = e.dataTransfer.getData('assetId')
            if (assetId && scenario?.id) {
              await addTrack(scenario.id, assetId, displayIntensity)
            }
          }}
        >
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">
              {scenario.has_intensities ? `${INTENSITY_LABELS[displayIntensity]} Tracks` : 'Tracks'}
            </p>

            {currentIntensityTracks.length === 0 ? (
              <p className="text-xs text-gray-600 py-2">No tracks yet. Add some below.</p>
            ) : (
              <div className="space-y-0.5">
                {currentIntensityTracks.map((track) => {
                  const isCurrent  = isActiveScenario && currentTrack?.id === track.id
                  const pinnedKey  = `${scenario.id}_${displayIntensity}`
                  const isPinned   = pinnedStartTracks[pinnedKey] === track.id
                  const asset      = track.audio_assets

                  return (
                    <div
                      key={track.id}
                      onClick={() => startPlaylistAtTrack(scenario, displayIntensity, track.id)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg group/track transition-colors cursor-pointer ${
                        isCurrent ? 'bg-gold/10' : 'hover:bg-border/40'
                      }`}
                    >
                      {/* Cover art or icon */}
                      <div className="relative shrink-0">
                        {asset?.cover_art_path ? (
                          <img
                            src={`/images/covers/${asset.cover_art_path}`}
                            alt="cover"
                            className="w-8 h-8 rounded object-cover"
                            onError={e => { e.target.style.display = 'none' }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded bg-panel/60 flex items-center justify-center">
                            <Music2 size={13} className={isCurrent ? 'text-gold' : 'text-gray-600'} />
                          </div>
                        )}
                        {isCurrent && isPlaying && (
                          <div className="absolute inset-0 flex items-center justify-center gap-0.5 bg-black/50 rounded">
                            {[0, 1, 2].map((i) => (
                              <div key={i} className="w-0.5 h-3 bg-gold rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Name + artist */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs truncate font-medium ${isCurrent ? 'text-gold' : 'text-gray-300'}`}>
                          {asset?.name}
                        </p>
                        {asset?.artist && (
                          <p className="text-[10px] text-gray-600 truncate">{asset.artist}</p>
                        )}
                      </div>

                      {isPinned && (
                        <Pin size={10} className="text-gold shrink-0" fill="currentColor" title="Always starts here" />
                      )}

                      {/* Pin button — shown on hover */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setPinnedStartTrack(scenario.id, displayIntensity, track.id) }}
                        title={isPinned ? 'Remove start pin' : 'Always start here'}
                        className={`opacity-0 group-hover/track:opacity-100 transition-all shrink-0 ${
                          isPinned ? 'text-gold' : 'text-gray-600 hover:text-gold'
                        }`}
                      >
                        <Pin size={11} fill={isPinned ? 'currentColor' : 'none'} />
                      </button>

                      <button
                        onClick={(e) => { e.stopPropagation(); removeTrack(track.id, scenario.id) }}
                        className="opacity-0 group-hover/track:opacity-100 text-gray-600 hover:text-red-400 transition-all shrink-0"
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

          <AdvancedControls />
          <SfxSection />
        </div>
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

function SfxSection() {
  const [open, setOpen] = useState(false)
  return (
    <div className="panel-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-border/30 transition-colors"
      >
        <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
          <Zap size={13} />
          Sound Effects
        </div>
        {open ? <ChevronUp size={13} className="text-gray-500" /> : <ChevronDown size={13} className="text-gray-500" />}
      </button>
      {open && (
        <div className="border-t border-border" style={{ height: 420 }}>
          <SfxMatrix />
        </div>
      )}
    </div>
  )
}
