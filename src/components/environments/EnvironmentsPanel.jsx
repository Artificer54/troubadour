import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import MixerPanel from '../mixer/MixerPanel'
import EnvironmentCard from './EnvironmentCard'
import CreateEnvironmentModal from './CreateEnvironmentModal'

export default function EnvironmentsPanel() {
  const environments         = useAppStore((s) => s.environments)
  const activeEnvironmentIds = useAppStore((s) => s.activeEnvironmentIds)

  const [showCreate, setShowCreate] = useState(false)

  const activeEnvironments = environments.filter(e => activeEnvironmentIds.includes(e.id))

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Mixer at top */}
      <MixerPanel activeEnvironments={activeEnvironments} />

      {/* Environments section */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-border shrink-0">
        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">Environments</span>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md bg-gold/10 hover:bg-gold/20 text-gold transition-colors"
          title="New environment"
        >
          <Plus size={10} />
          New
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3 flex flex-col gap-2">
        {environments.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-8">
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-border flex items-center justify-center">
              <Plus size={18} className="text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">No environments yet</p>
              <p className="text-xs text-gray-600 mt-1">Create one to add looping ambient tracks</p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="btn-secondary text-xs px-4 py-2"
            >
              Create Environment
            </button>
          </div>
        )}

        {environments.map(env => (
          <EnvironmentCard key={env.id} environment={env} />
        ))}
      </div>

      {showCreate && <CreateEnvironmentModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
