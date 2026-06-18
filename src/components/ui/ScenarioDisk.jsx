import { useAppStore } from '../../store/useAppStore'

const INTENSITY_GLOW_CLASSES = [
  'intensity-0-glow',
  'intensity-1-glow',
  'intensity-2-glow',
  'intensity-3-glow',
  'intensity-4-glow',
]

export default function ScenarioDisk({ isPlaying, isTransitioning, intensity = 0, size = 120 }) {
  const intensityColors = useAppStore((s) => s.intensityColors)
  const color = isPlaying ? (intensityColors[intensity] ?? '#60a5fa') : '#374151'
  const glowClass = isPlaying ? INTENSITY_GLOW_CLASSES[intensity] ?? 'intensity-0-glow' : ''

  return (
    <div
      className={`relative rounded-full ${isTransitioning ? 'transitioning-glow' : isPlaying ? glowClass : ''}`}
      style={{ width: size, height: size, transition: 'box-shadow 0.5s ease' }}
    >
      <svg
        className={isPlaying ? 'disk-spinning' : 'disk-spinning disk-paused'}
        viewBox="0 0 120 120"
        width={size}
        height={size}
        style={{ display: 'block' }}
      >
        {/* Outer vinyl ring */}
        <circle cx="60" cy="60" r="58" fill={isPlaying ? '#1a1a2e' : '#111827'} stroke={color} strokeWidth="2" opacity="0.95" />

        {/* Groove rings */}
        {[50, 42, 34, 26].map((r) => (
          <circle key={r} cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="0.5" opacity={isPlaying ? 0.25 : 0.1} />
        ))}

        {/* Colored label in center */}
        <circle cx="60" cy="60" r="18" fill={color} opacity={isPlaying ? 0.9 : 0.3} />

        {/* Shine highlight */}
        <ellipse cx="52" cy="52" rx="6" ry="4" fill="white" opacity={isPlaying ? 0.18 : 0.05} transform="rotate(-30 52 52)" />

        {/* Center hole */}
        <circle cx="60" cy="60" r="4" fill="#0d0d1a" />

        {/* Tick mark — clearly shows rotation when spinning */}
        <rect x="58" y="5" width="4" height="12" rx="2" fill={color} opacity={isPlaying ? 1 : 0.3} />
      </svg>

      {/* Stationary tonearm needle — outside the spinning SVG, does not rotate */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '6%',
          right: '6%',
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: isPlaying ? '#e5e7eb' : '#4b5563',
          boxShadow: isPlaying ? '0 0 5px rgba(0,0,0,0.9)' : 'none',
          transition: 'background 0.4s ease',
        }}
      />

      {/* "Stopped" overlay text */}
      {!isPlaying && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <span className="text-[9px] font-semibold text-gray-600 uppercase tracking-widest select-none">Stopped</span>
        </div>
      )}
    </div>
  )
}
