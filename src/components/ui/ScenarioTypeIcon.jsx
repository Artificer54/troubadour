export default function ScenarioTypeIcon({ type = 'scene', size = 14, className = '' }) {
  const s = size

  if (type === 'combat') {
    return (
      <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor" className={className} aria-label="Combat">
        {/* Crossed swords */}
        <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="14" y1="2" x2="2" y2="14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        {/* Hilts */}
        <line x1="0" y1="4" x2="4" y2="4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="12" y1="4" x2="16" y2="4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    )
  }

  if (type === 'location') {
    return (
      <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor" className={className} aria-label="Location">
        <path d="M8 1C5.24 1 3 3.24 3 6c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5zm0 6.5A1.5 1.5 0 1 1 8 4a1.5 1.5 0 0 1 0 3.5z"/>
      </svg>
    )
  }

  // scene — director's clapperboard
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor" className={className} aria-label="Scene">
      <rect x="1" y="5" width="14" height="10" rx="1.2" fill="currentColor" opacity="0.85"/>
      <rect x="1" y="3" width="14" height="3" rx="1" fill="currentColor"/>
      {/* Clapper stripes */}
      <line x1="4" y1="3" x2="3" y2="6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.4"/>
      <line x1="7.5" y1="3" x2="6.5" y2="6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.4"/>
      <line x1="11" y1="3" x2="10" y2="6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.4"/>
    </svg>
  )
}
