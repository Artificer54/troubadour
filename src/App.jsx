import { useEffect, useState } from 'react'
import { Music, Zap, X, Settings } from 'lucide-react'
import { useAppStore, applyTheme, applyIntensityColors } from './store/useAppStore'
import ScenarioSidebar from './components/scenario/ScenarioSidebar'
import ScenarioControlPanel from './components/scenario/ScenarioControlPanel'
import LibrarySidebar from './components/library/LibrarySidebar'
import SfxMatrix from './components/sfx/SfxMatrix'
import SettingsModal from './components/ui/SettingsModal'
import SplashScreen from './components/ui/SplashScreen'
import NetworkStatusIcon from './components/ui/NetworkStatusIcon'

const MOBILE_TABS = [
  { key: 'scenarios', label: 'Scenarios', icon: Music },
  { key: 'sfx',      label: 'SFX',       icon: Zap },
]

export default function App() {
  const fetchPlaylists  = useAppStore((s) => s.fetchPlaylists)
  const fetchAudioAssets= useAppStore((s) => s.fetchAudioAssets)
  const fetchSfxPanels  = useAppStore((s) => s.fetchSfxPanels)
  const fetchSfxButtons = useAppStore((s) => s.fetchSfxButtons)
  const appError        = useAppStore((s) => s.appError)
  const clearAppError   = useAppStore((s) => s.clearAppError)
  const activeTheme     = useAppStore((s) => s.activeTheme)
  const playlists       = useAppStore((s) => s.playlists)
  const selectedId      = useAppStore((s) => s.selectedScenarioId)
  const libraryOpen     = useAppStore((s) => s.libraryOpen)

  const [mobileTab, setMobileTab]   = useState('scenarios')
  const [showSettings, setShowSettings] = useState(false)
  const [splashDone, setSplashDone] = useState(false)

  const selectedScenario = playlists.find((p) => p.id === selectedId)
  const bgImage = selectedScenario?.background_image
    ? `/images/${selectedScenario.background_image}?v=${encodeURIComponent(selectedScenario.updated_at ?? '')}`
    : null
  const bgOverlay = (selectedScenario?.bg_darkness ?? 55) / 100

  useEffect(() => {
    const state = useAppStore.getState()
    let customColors = null
    if (activeTheme === 'custom') {
      const preset = state.customPresets?.find(p => p.id === state.activeCustomPresetId)
      customColors = preset?.colors ?? null
    }
    applyTheme(activeTheme, customColors)
    applyIntensityColors(state.intensityColors)
  }, [activeTheme])

  useEffect(() => {
    fetchPlaylists()
    fetchAudioAssets()
    fetchSfxPanels()
    fetchSfxButtons()
  }, [])

  return (
    <>
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}

      <div className="h-screen flex flex-col overflow-hidden relative">
        {/* Global background image when a scenario with bg is selected */}
        {bgImage && (
          <>
            <div
              className="fixed inset-0 z-0 bg-cover bg-center pointer-events-none"
              style={{ backgroundImage: `url(${bgImage})` }}
            />
            <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundColor: `rgb(var(--color-darkbg) / ${bgOverlay})` }} />
          </>
        )}

        {/* All UI content */}
        <div className="relative z-10 h-screen flex flex-col">
          {/* Top bar */}
          <header className={`flex items-center justify-between px-4 py-2 border-b border-border shrink-0 ${bgImage ? 'bg-midnight/60 bg-midnight/40' : 'bg-midnight'}`}>
            <div className="flex items-center gap-3">
              <h1 className="font-fantasy text-gold text-lg tracking-widest">TROUBADOUR</h1>
              <span className="hidden sm:block text-[10px] text-gray-600 uppercase tracking-widest">TTRPG Audio</span>
            </div>
            <div className="flex items-center gap-1">
              <NetworkStatusIcon />
              <button
                onClick={() => setShowSettings(true)}
                title="Settings"
                className="p-1.5 text-gray-500 hover:text-gold transition-colors rounded-md hover:bg-gold/10"
              >
                <Settings size={15} />
              </button>
            </div>
          </header>

          {/* Error banner */}
          {appError && (
            <div className="flex items-center justify-between gap-3 px-4 py-2 bg-red-900/60 border-b border-red-700 text-red-200 text-xs shrink-0">
              <span>{appError}</span>
              <button onClick={clearAppError} className="text-red-300 hover:text-white shrink-0">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Main content */}
          <div className="flex-1 overflow-hidden">
            {/* Desktop: 3-column layout */}
            <div className="hidden md:flex h-full">
              <div className={`shrink-0 flex flex-col overflow-hidden transition-all duration-200 ${libraryOpen ? 'w-96 lg:w-[420px]' : 'w-52 lg:w-60'} ${bgImage ? 'bg-midnight/60' : ''}`}>
                {libraryOpen ? <LibrarySidebar /> : <ScenarioSidebar />}
              </div>
              <div className="flex-1 flex flex-col overflow-hidden border-x border-border">
                <ScenarioControlPanel />
              </div>
              <div className={`w-80 lg:w-96 xl:w-[420px] shrink-0 flex flex-col overflow-hidden ${bgImage ? 'bg-midnight/60 bg-midnight/40' : ''}`}>
                <SfxMatrix />
              </div>
            </div>

            {/* Mobile: tabbed */}
            <div className="md:hidden flex flex-col h-full">
              <div className="flex-1 overflow-hidden">
                {mobileTab === 'scenarios' ? (
                  <div className="flex h-full flex-col">
                    <div className={`border-b border-border shrink-0 max-h-40 overflow-y-auto ${bgImage ? 'bg-midnight/60 bg-midnight/40' : ''}`}>
                      <ScenarioSidebar />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <ScenarioControlPanel />
                    </div>
                  </div>
                ) : (
                  <SfxMatrix />
                )}
              </div>
              <nav className={`flex border-t border-border shrink-0 ${bgImage ? 'bg-midnight/60 bg-midnight/40' : 'bg-midnight'}`}>
                {MOBILE_TABS.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setMobileTab(key)}
                    className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium transition-colors ${
                      mobileTab === key ? 'text-gold' : 'text-gray-500'
                    }`}
                  >
                    <Icon size={18} />
                    {label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      </div>
    </>
  )
}
