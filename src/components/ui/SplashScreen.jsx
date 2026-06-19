import { useEffect, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'

const WELCOME_MESSAGES = [
  'The tavern hushes as the bard takes the stage…',
  'Warming up the lute strings…',
  'Summoning the ambient spirits…',
  'Polishing the record player…',
  'Rolling for initiative on the playlist…',
  'The adventure soundtrack awaits…',
  'Tuning instruments in the next room…',
  'The DM has curated something special…',
  'Unrolling the scroll of sick beats…',
  'Your party deserves good music…',
  'Consulting the ancient tome of playlists…',
  'The minstrels have arrived…',
  'Setting the mood for heroic deeds…',
  'Loading atmosphere into the campaign bag…',
  'May your rolls be as smooth as this fade…',
]

const FAKE_LOADS = [
  'Initializing bardic protocols…',
  'Loading scene ambience modules…',
  'Calibrating intensity matrix…',
  'Synchronizing the realm\'s soundtrack…',
  'Establishing connection to the muse…',
]

export default function SplashScreen({ onDone }) {
  const intensityColors  = useAppStore((s) => s.intensityColors)
  const lastIntensityIdx = useAppStore((s) => s.lastIntensityIndex)

  const [visible, setVisible] = useState(true)
  const [fading, setFading]   = useState(false)
  const [msgIdx]   = useState(() => Math.floor(Math.random() * WELCOME_MESSAGES.length))
  const [loadIdx]  = useState(() => Math.floor(Math.random() * FAKE_LOADS.length))
  const diskColor  = intensityColors[lastIntensityIdx] ?? intensityColors[0] ?? '#60a5fa'

  const dismiss = () => {
    if (fading) return
    setFading(true)
    setTimeout(() => {
      setVisible(false)
      onDone?.()
    }, 600)
  }

  useEffect(() => {
    const timer = setTimeout(dismiss, 3200)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer select-none"
      style={{
        background: 'radial-gradient(ellipse at center, #1a1030 0%, #0d0d1a 60%, #080810 100%)',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.6s ease',
      }}
      onClick={dismiss}
    >
      {/* Spinning disk — large, behind text */}
      <div className="relative flex items-center justify-center mb-6">
        {/* The big disk */}
        <svg
          className="disk-spinning"
          viewBox="0 0 240 240"
          width={220}
          height={220}
          style={{ filter: `drop-shadow(0 0 40px ${diskColor}55)` }}
        >
          <circle cx="120" cy="120" r="116" fill="#12121e" stroke={diskColor} strokeWidth="2.5" opacity="0.95" />
          {[100, 86, 72, 58, 44].map((r) => (
            <circle key={r} cx="120" cy="120" r={r} fill="none" stroke={diskColor} strokeWidth="0.7" opacity="0.2" />
          ))}
          <circle cx="120" cy="120" r="36" fill={diskColor} opacity="0.8" />
          <ellipse cx="104" cy="104" rx="12" ry="8" fill="white" opacity="0.15" transform="rotate(-30 104 104)" />
          <circle cx="120" cy="120" r="8" fill="#0d0d1a" />
          <rect x="116" y="8" width="8" height="22" rx="4" fill={diskColor} opacity="0.9" />
        </svg>

        {/* Title overlay on the disk */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div
            className="flex flex-col items-center px-6 py-2.5 rounded-full"
            style={{ background: 'rgba(8,8,16,0.72)', boxShadow: '0 0 24px 12px rgba(8,8,16,0.72)' }}
          >
            <span
              className="font-fantasy tracking-[0.25em] text-3xl"
              style={{ color: diskColor, textShadow: `0 0 20px ${diskColor}99, 0 0 40px ${diskColor}55` }}
            >
              TROUBADOUR
            </span>
            <span className="text-[10px] text-gray-400 uppercase tracking-[0.3em] mt-0.5">
              TTRPG Audio Manager
            </span>
          </div>
        </div>
      </div>

      {/* Welcome message */}
      <p className="text-gray-400 text-sm text-center max-w-xs px-4 italic">
        {WELCOME_MESSAGES[msgIdx]}
      </p>

      {/* Fake loading ticker */}
      <p className="text-gray-600 text-[10px] text-center mt-3 uppercase tracking-widest">
        {FAKE_LOADS[loadIdx]}
      </p>

      {/* Click to skip hint */}
      <p className="absolute bottom-8 text-gray-700 text-[10px] tracking-wider">
        click anywhere to continue
      </p>
    </div>
  )
}
