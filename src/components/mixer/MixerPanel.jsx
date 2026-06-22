import { useAppStore, ENV_COLORS } from '../../store/useAppStore'

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
  const environmentMasterVolume    = useAppStore((s) => s.environmentMasterVolume)
  const setEnvironmentMasterVolume = useAppStore((s) => s.setEnvironmentMasterVolume)
  const _envTrackVolumes      = useAppStore((s) => s._envTrackVolumes)
  const setLiveTrackVolume    = useAppStore((s) => s.setLiveTrackVolume)

  const handleMute = (current, setter) => {
    setter(current > 0.01 ? 0 : 0.8)
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

        {/* Ambience master — green */}
        <VerticalSlider
          value={environmentMasterVolume}
          onChange={setEnvironmentMasterVolume}
          color="#4ade80"
          label="Ambience"
          muted={environmentMasterVolume === 0}
          onMuteToggle={() => handleMute(environmentMasterVolume, setEnvironmentMasterVolume)}
        />

        {/* Environment track sliders — one per track in each active environment */}
        {!hideEnvFaders && activeEnvironments?.length > 0 && (
          <>
            <div className="self-stretch w-px bg-border mx-1 shrink-0" />
            {activeEnvironments.map((env) => (
              (env.environment_tracks ?? []).map((track, trackIdx) => {
                const vol = _envTrackVolumes[track.id] ?? 1.0
                const color = ENV_COLORS[trackIdx % ENV_COLORS.length]
                const shortName = (track.audio_assets?.name ?? 'Trk').slice(0, 6)
                return (
                  <VerticalSlider
                    key={track.id}
                    value={vol}
                    onChange={(v) => setLiveTrackVolume(env.id, track.id, v)}
                    color={color}
                    label={shortName}
                    muted={vol === 0}
                    onMuteToggle={() => setLiveTrackVolume(env.id, track.id, vol > 0.01 ? 0 : 0.8)}
                  />
                )
              })
            ))}
          </>
        )}
      </div>
    </div>
  )
}
