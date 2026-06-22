import { Music2, Trash2 } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'

export default function EnvironmentTrackRow({ environmentId, track, isEnvActive, envColor }) {
  const _envTrackVolumes           = useAppStore((s) => s._envTrackVolumes)
  const setLiveTrackVolume         = useAppStore((s) => s.setLiveTrackVolume)
  const removeTrackFromEnvironment = useAppStore((s) => s.removeTrackFromEnvironment)

  const vol = _envTrackVolumes[track.id] ?? 1.0
  const color = envColor ?? '#7c9885'

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

      {/* Volume slider */}
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={vol}
        onChange={(e) => setLiveTrackVolume(environmentId, track.id, parseFloat(e.target.value))}
        className="w-24 shrink-0"
        style={{ accentColor: color }}
        title={`${Math.round(vol * 100)}%`}
      />

      {/* Volume % */}
      <span className="text-[10px] font-mono w-7 text-right shrink-0" style={{ color }}>
        {Math.round(vol * 100)}
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
