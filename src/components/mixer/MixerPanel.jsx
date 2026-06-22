import { useAppStore } from '../../store/useAppStore'

// Vertical slider using CSS transform trick for cross-browser support
function VerticalSlider({ value, onChange, color, label, muted, onMuteToggle }) {
  return (
    <div className="flex flex-col items-center gap-2 select-none">
      {/* Mute toggle dot */}
      <button
        onClick={onMuteToggle}
        title={muted ? 'Unmute' : 'Mute'}
        className="w-3 h-3 rounded-full border transition-all shrink-0"
        style={{
          backgroundColor: muted ? 'transparent' : color,
          borderColor: color,
          boxShadow: muted ? 'none' : `0 0 6px 1px ${color}55`,
        }}
      />

      {/* Slider track wrapper — gives the rotated input a bounding box */}
      <div className="relative flex items-center justify-center" style={{ width: 28, height: 110 }}>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={muted ? 0 : value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="vertical-slider"
          style={{
            '--slider-color': color,
            position: 'absolute',
            width: 110,
            height: 28,
            transform: 'rotate(-90deg)',
            cursor: 'pointer',
            appearance: 'none',
            WebkitAppearance: 'none',
            background: 'transparent',
            margin: 0,
            padding: 0,
          }}
        />
      </div>

      {/* Value label */}
      <span className="text-[9px] font-mono tabular-nums" style={{ color }}>
        {Math.round((muted ? 0 : value) * 100)}
      </span>

      {/* Track label */}
      <span className="text-[9px] text-gray-500 uppercase tracking-wide truncate max-w-[40px] text-center leading-tight">
        {label}
      </span>
    </div>
  )
}

export default function MixerPanel({ activeEnvironments, hideEnvFaders }) {
  const masterVolume          = useAppStore((s) => s.masterVolume)
  const setMasterVolume       = useAppStore((s) => s.setMasterVolume)
  const playlistVolume        = useAppStore((s) => s.playlistVolume)
  const setPlaylistVolume     = useAppStore((s) => s.setPlaylistVolume)
  const sfxVolume             = useAppStore((s) => s.sfxVolume)
  const setSfxVolume          = useAppStore((s) => s.setSfxVolume)
  const environmentVolumes    = useAppStore((s) => s.environmentVolumes)
  const setEnvironmentVolume  = useAppStore((s) => s.setEnvironmentVolume)
  const reapplyEnvironmentVolume = useAppStore((s) => s.reapplyEnvironmentVolume)

  // Mute state (stored locally — mute = set slider visual to 0 without losing value)
  // We track muted state by checking if volume is 0
  // Mute toggles set to 0 / restore previous
  const handleMute = (current, setter, threshold = 0.01) => {
    if (current > threshold) {
      setter(0)
    } else {
      setter(0.8) // restore to a sensible default
    }
  }

  const handleEnvVolumeChange = (envId, v) => {
    setEnvironmentVolume(envId, v)
    reapplyEnvironmentVolume(envId)
  }

  const handleEnvMute = (envId, currentVol) => {
    const next = currentVol > 0.01 ? 0 : 0.8
    handleEnvVolumeChange(envId, next)
  }

  return (
    <div className="shrink-0">
      <div className="px-3 py-2 border-b border-border">
        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">Mixer</span>
      </div>

      <div className="flex items-end gap-1 px-3 py-3 overflow-x-auto scrollbar-hide">
        {/* Master — gold / accent color */}
        <VerticalSlider
          value={masterVolume}
          onChange={setMasterVolume}
          color="rgb(var(--color-accent))"
          label="Master"
          muted={masterVolume === 0}
          onMuteToggle={() => handleMute(masterVolume, setMasterVolume)}
        />

        {/* Divider */}
        <div className="self-stretch w-px bg-border mx-1 shrink-0" />

        {/* Music — ember/warm */}
        <VerticalSlider
          value={playlistVolume}
          onChange={setPlaylistVolume}
          color="rgb(var(--color-ember))"
          label="Music"
          muted={playlistVolume === 0}
          onMuteToggle={() => handleMute(playlistVolume, setPlaylistVolume)}
        />

        {/* SFX — sky blue */}
        <VerticalSlider
          value={sfxVolume}
          onChange={setSfxVolume}
          color="#38bdf8"
          label="SFX"
          muted={sfxVolume === 0}
          onMuteToggle={() => handleMute(sfxVolume, setSfxVolume)}
        />

        {/* Environment sliders — one per active environment */}
        {!hideEnvFaders && activeEnvironments?.length > 0 && (
          <>
            <div className="self-stretch w-px bg-border mx-1 shrink-0" />
            {activeEnvironments.map((env) => {
              const vol = environmentVolumes[env.id] ?? 1.0
              return (
                <VerticalSlider
                  key={env.id}
                  value={vol}
                  onChange={(v) => handleEnvVolumeChange(env.id, v)}
                  color={env.color}
                  label={env.name}
                  muted={vol === 0}
                  onMuteToggle={() => handleEnvMute(env.id, vol)}
                />
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
