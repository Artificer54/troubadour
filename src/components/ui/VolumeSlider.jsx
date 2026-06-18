import { Volume1, Volume2, VolumeX } from 'lucide-react'

export default function VolumeSlider({ label, value, onChange }) {
  const Icon = value === 0 ? VolumeX : value < 0.5 ? Volume1 : Volume2
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Icon size={14} className="text-gray-400 shrink-0" />
      <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">{label}</span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-20 accent-gold cursor-pointer"
      />
    </div>
  )
}
