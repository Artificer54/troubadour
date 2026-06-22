import { Trash2 } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'

export default function EnvironmentTrackRow({ environmentId, track, isEnvActive }) {
  const _envTrackVolumes     = useAppStore((s) => s._envTrackVolumes)
  const setLiveTrackVolume   = useAppStore((s) => s.setLiveTrackVolume)
  const removeTrackFromEnvironment = useAppStore((s) => s.removeTrackFromEnvironment)

  const vol = _envTrackVolumes[track.id] ?? 1.0

  return (
    <div className="group/track flex items-center gap-2 py-1">
      <span className="flex-1 text-xs text-gray-400 truncate min-w-0">
        {track.audio_assets?.name ?? 'Unknown'}
      </span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={vol}
        onChange={(e) => setLiveTrackVolume(environmentId, track.id, parseFloat(e.target.value))}
        className="w-20 accent-gold shrink-0"
        title={`${Math.round(vol * 100)}%`}
      />
      <span className="text-[9px] font-mono text-gray-600 w-7 text-right shrink-0">
        {Math.round(vol * 100)}%
      </span>
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
