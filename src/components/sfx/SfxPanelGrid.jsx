import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import SfxButton from './SfxButton'
import CreateSfxButtonModal from './CreateSfxButtonModal'
import { useAppStore } from '../../store/useAppStore'

export default function SfxPanelGrid({ panel }) {
  const deleteSfxButton = useAppStore((s) => s.deleteSfxButton)
  const [showCreate, setShowCreate] = useState(false)
  const [editMode, setEditMode] = useState(false)

  const buttons = (panel.sfx_buttons ?? []).sort((a, b) => a.position - b.position)

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500">{buttons.length} button{buttons.length !== 1 ? 's' : ''}</p>
        <div className="flex gap-2">
          {buttons.length > 0 && (
            <button
              onClick={() => setEditMode(!editMode)}
              className={`text-xs px-2 py-0.5 rounded transition-colors ${editMode ? 'text-red-400 bg-red-400/10' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {editMode ? 'Done' : 'Edit'}
            </button>
          )}
          <button
            onClick={() => setShowCreate(true)}
            className="btn-gold text-xs px-2 py-1"
          >
            <Plus size={13} className="inline -mt-0.5" /> Button
          </button>
        </div>
      </div>

      {buttons.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
          <p className="text-sm text-gray-400">No buttons yet</p>
          <button onClick={() => setShowCreate(true)} className="btn-gold mt-3 text-xs">
            Add your first button
          </button>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5 gap-2 overflow-y-auto content-start">
          {buttons.map((btn) => (
            <div key={btn.id} className="relative">
              <SfxButton button={btn} />
              {editMode && (
                <button
                  onClick={() => deleteSfxButton(btn.id)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg hover:bg-red-600 transition-colors z-10"
                >
                  <Trash2 size={10} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateSfxButtonModal panelId={panel.id} onClose={() => setShowCreate(false)} />
      )}
    </div>
  )
}
