import { useState } from 'react'
import { Globe, User, Swords, BookOpen, Plus, Trash2, ChevronDown } from 'lucide-react'
import SfxPanelGrid from './SfxPanelGrid'
import SfxLibrary from './SfxLibrary'
import { useAppStore } from '../../store/useAppStore'

const PANEL_TYPES = [
  { key: 'global',    label: 'Global',    icon: Globe,   desc: 'System-wide sounds' },
  { key: 'player',   label: 'Players',   icon: User,    desc: 'Per-character abilities' },
  { key: 'encounter',label: 'Encounters',icon: Swords,  desc: 'Combat & creatures' },
  { key: 'library',  label: 'Library',   icon: BookOpen,desc: 'All SFX buttons' },
]

export default function SfxMatrix() {
  const sfxPanels = useAppStore((s) => s.sfxPanels)
  const createSfxPanel = useAppStore((s) => s.createSfxPanel)
  const deleteSfxPanel = useAppStore((s) => s.deleteSfxPanel)

  const [activeType, setActiveType] = useState('global')
  const [activePanelId, setActivePanelId] = useState(null)
  const [newPanelName, setNewPanelName] = useState('')
  const [showNewPanel, setShowNewPanel] = useState(false)
  const [creatingPanel, setCreatingPanel] = useState(false)

  const panelsForType = sfxPanels.filter((p) => p.panel_type === activeType)

  const activePanel = activePanelId
    ? sfxPanels.find((p) => p.id === activePanelId)
    : panelsForType[0]

  const handleCreatePanel = async () => {
    if (!newPanelName.trim()) return
    setCreatingPanel(true)
    await createSfxPanel(activeType, newPanelName.trim())
    setNewPanelName('')
    setShowNewPanel(false)
    setCreatingPanel(false)
  }

  const TypeInfo = PANEL_TYPES.find((t) => t.key === activeType)

  return (
    <div className="flex flex-col h-full">
      {/* Top nav: Global / Players / Encounters / Library */}
      <div className="flex border-b border-border shrink-0">
        {PANEL_TYPES.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => { setActiveType(key); setActivePanelId(null) }}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-[10px] font-medium transition-colors border-b-2 ${
              activeType === key
                ? 'border-gold text-gold'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <Icon size={15} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Library view */}
      {activeType === 'library' ? (
        <div className="flex-1 overflow-hidden p-3">
          <SfxLibrary />
        </div>
      ) : (
        <>
          {/* Sub-panel tabs (for player / encounter) */}
          {(activeType === 'player' || activeType === 'encounter') && (
            <div className="flex gap-1 px-3 pt-2 pb-1 overflow-x-auto shrink-0 border-b border-border">
              {panelsForType.map((panel) => (
                <div key={panel.id} className="flex items-center gap-0.5 shrink-0 group">
                  <button
                    onClick={() => setActivePanelId(panel.id)}
                    className={`tab-btn ${activePanel?.id === panel.id ? 'tab-btn-active' : 'tab-btn-inactive'}`}
                  >
                    {panel.name}
                  </button>
                  <button
                    onClick={() => {
                      deleteSfxPanel(panel.id)
                      if (activePanel?.id === panel.id) setActivePanelId(null)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-500 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
              {showNewPanel ? (
                <div className="flex gap-1 items-center shrink-0">
                  <input
                    autoFocus
                    className="input-dark text-xs py-1 px-2 w-28"
                    placeholder={activeType === 'player' ? 'Character name' : 'Encounter name'}
                    value={newPanelName}
                    onChange={(e) => setNewPanelName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreatePanel(); if (e.key === 'Escape') setShowNewPanel(false) }}
                  />
                  <button onClick={handleCreatePanel} disabled={creatingPanel} className="btn-gold text-xs px-2 py-1 shrink-0">
                    Add
                  </button>
                  <button onClick={() => setShowNewPanel(false)} className="text-gray-500 hover:text-gray-300 text-xs px-1">✕</button>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewPanel(true)}
                  className="tab-btn tab-btn-inactive shrink-0"
                >
                  <Plus size={11} className="inline" /> {activeType === 'player' ? 'Player' : 'Encounter'}
                </button>
              )}
            </div>
          )}

          {/* Global: auto-create single panel if needed */}
          {activeType === 'global' && panelsForType.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <button
                onClick={() => createSfxPanel('global', 'Global')}
                className="btn-gold"
              >
                Initialize Global Panel
              </button>
            </div>
          )}

          {/* Panel content */}
          <div className="flex-1 overflow-hidden p-3">
            {activePanel ? (
              <SfxPanelGrid panel={activePanel} />
            ) : (
              <div className="h-full flex items-center justify-center text-center opacity-50">
                <div>
                  {TypeInfo && <TypeInfo.icon size={28} className="mx-auto text-gray-600 mb-2" />}
                  <p className="text-sm text-gray-400">{TypeInfo?.desc}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {activeType === 'global' ? '' : `Create a ${activeType} tab to get started`}
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
