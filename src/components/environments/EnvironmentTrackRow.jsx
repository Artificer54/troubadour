import { Music2, Trash2 } from 'lucide-react'
import { useAppStore, ENV_COLORS } from '../../store/useAppStore'

export default function EnvironmentTrackRow({ environmentId, track, isEnvActive, trackIndex }) {
  const _envTrackVolumes           = useAppStore((s) => s._envTrackVolumes)
  const setLiveTrackVolume         = useAppStore((s) => s.setLiveTrackVolume)
  const removeTrackFromEnvironment = useAppStore((s) => s.removeTrackFromEnvironment)

  const vol = _envTrackVolumes[track.id] ?? 1.0
  const color = ENV_COLORS[trackIndex % ENV_COLORS.length]
  const muted = vol === 0

  const toggleMute = () => {
    setLiveTrackVolume(environmentId, track.id, muted ? 0.8 : 0)
  }

  return (
    <div className="group/track flex items-center gap-3 px-3 py-2.5">
      {/* Playing indicator */}
      <div
        className="shrink-0 w-1.5 h-1.5 rounded-full transition-all"
        style={{
          backgroundColor: isEnvActive ? color : 'transparent',
          boxShadow: isEnvActive ? `0 0 4px 1px ${color}80` : 'none',
          border: isEnvActive ? 'none' : '1px solid rgb(75 85 99)',
        }}
      />

      {/* Track name */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-300 truncate">
          {track.audio_assets?.name ?? 'Unknown'}
        </p>
      </div>

      {/* Mute dot — matches mixer style */}
      <button
        onClick={toggleMute}
        title={muted ? 'Unmute' : 'Mute'}
        className="w-3 h-3 rounded-full border transition-all shrink-0"
        style={{
          backgroundColor: muted ? 'transparent' : color,
          borderColor: color,
          boxShadow: muted ? 'none' : `0 0 5px 1px ${color}55`,
        }}
      />

      {/* Styled horizontal slider */}
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={muted ? 0 : vol}
        onChange={(e) => setLiveTrackVolume(environmentId, track.id, parseFloat(e.target.value))}
        className="vertical-slider w-24 shrink-0"
        style={{ '--slider-color': color }}
        title={`${Math.round(vol * 100)}%`}
      />

      {/* Volume % */}
      <span className="text-[10px] font-mono w-7 text-right shrink-0" style={{ color }}>
        {Math.round((muted ? 0 : vol) * 100)}
      </span>

      {/* Remove */}
      <button
        onClick={() => removeTrackFromEnvironment(environmentId, track.id)}
        className="opacity-0 group-hover/track:opacity-100 text-gray-600 hover:text-red-400 transition-all shrink-0"
        title="Remove track"
      >
        <Trash2 size={12} />
      </button>
    </div>
  )
}
