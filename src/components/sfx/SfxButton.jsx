import { useState } from 'react'
import { Zap } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'

export default function SfxButton({ button }) {
  const triggerSfxButton = useAppStore((s) => s.triggerSfxButton)
  const [firing, setFiring] = useState(false)

  const fileCount = (button.sfx_button_files ?? []).length

  const handleClick = () => {
    triggerSfxButton(button)
    setFiring(true)
    setTimeout(() => setFiring(false), 350)
  }

  return (
    <button
      onClick={handleClick}
      disabled={fileCount === 0}
      title={fileCount === 0 ? 'No audio files assigned' : `${fileCount} sound${fileCount > 1 ? 's' : ''} in pool`}
      className="sfx-btn relative flex flex-col items-center justify-center gap-1 rounded-xl border-2 p-3 text-center select-none disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      style={{
        borderColor: button.color,
        backgroundColor: firing ? button.color + '55' : button.color + '18',
        boxShadow: firing ? `0 0 14px 3px ${button.color}66` : undefined,
        minHeight: '72px',
      }}
    >
      <Zap
        size={18}
        style={{ color: button.color }}
        className="shrink-0"
      />
      <span className="text-xs font-medium text-gray-200 leading-tight line-clamp-2">
        {button.name}
      </span>
      {fileCount > 1 && (
        <span
          className="absolute top-1 right-1.5 text-[9px] font-bold rounded-full px-1"
          style={{ color: button.color }}
        >
          ×{fileCount}
        </span>
      )}
    </button>
  )
}
