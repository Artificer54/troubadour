import { X } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'

export default function PresetPill({ environmentId, preset, isActive, envColor }) {
  const applyPreset   = useAppStore((s) => s.applyPreset)
  const deletePreset  = useAppStore((s) => s.deletePreset)

  return (
    <div className="group/preset flex items-center gap-0.5">
      <button
        onClick={() => applyPreset(environmentId, preset.id)}
        className="px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all whitespace-nowrap"
        style={
          isActive
            ? { backgroundColor: `${envColor}30`, borderColor: envColor, color: envColor }
            : { borderColor: 'rgb(var(--color-border))', color: 'rgb(156 163 175)' }
        }
      >
        {preset.name}
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); deletePreset(environmentId, preset.id) }}
        className="opacity-0 group-hover/preset:opacity-100 text-gray-600 hover:text-red-400 transition-all"
        title="Delete preset"
      >
        <X size={10} />
      </button>
    </div>
  )
}
