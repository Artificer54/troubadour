export default function ScenarioTypeIcon({ type = 'scene', size = 14, className = '' }) {
  const s = size

  if (type === 'combat') {
    // ⚔️ emoji-style crossed swords: two swords forming an X, hilts at bottom corners
    return (
      <svg width={s} height={s} viewBox="0 0 20 20" fill="none" className={className} aria-label="Combat">
        {/* Left sword: tip top-right, hilt bottom-left */}
        <line x1="3" y1="17" x2="17" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        {/* Left guard */}
        <line x1="3" y1="7" x2="7" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        {/* Right sword: tip top-left, hilt bottom-right */}
        <line x1="17" y1="17" x2="3" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        {/* Right guard */}
        <line x1="17" y1="7" x2="13" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
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

  // 🎬 emoji-style clapperboard
  return (
    <svg width={s} height={s} viewBox="0 0 20 20" fill="currentColor" className={className} aria-label="Scene">
      {/* Board body */}
      <rect x="2" y="8" width="16" height="11" rx="1.5" fill="currentColor"/>
      {/* Clapper base strip */}
      <rect x="2" y="5" width="16" height="4" rx="1" fill="currentColor"/>
      {/* Clapper arm — angled open, above the strip */}
      <polygon points="2,5 10,1 14,5" fill="currentColor" opacity="0.75"/>
      {/* Stripe accents on arm */}
      <line x1="5" y1="5" x2="7" y2="2.4" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
      <line x1="8.5" y1="5" x2="10.5" y2="2.4" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
    </svg>
  )
}
