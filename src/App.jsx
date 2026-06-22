import { useEffect, useState, useCallback } from 'react'
import { Music, Zap, X, Settings, Library, RefreshCw, CheckCircle, AlertCircle, Plus, Layers } from 'lucide-react'
import { useAppStore, applyTheme, applyIntensityColors } from './store/useAppStore'
import ScenarioSidebar from './components/scenario/ScenarioSidebar'
import ScenarioControlPanel from './components/scenario/ScenarioControlPanel'
import LibrarySidebar from './components/library/LibrarySidebar'
import SfxMatrix from './components/sfx/SfxMatrix'
import EnvironmentsPanel from './components/environments/EnvironmentsPanel'
import SettingsModal from './components/ui/SettingsModal'
import SplashScreen from './components/ui/SplashScreen'
import NetworkStatusIcon from './components/ui/NetworkStatusIcon'
import UpdateBanner from './components/ui/UpdateBanner'
import CreatePlaylistModal from './components/playlist/CreatePlaylistModal'

const MOBILE_TABS = [
  { key: 'scenarios',    label: 'Scenes',  icon: Music },
  { key: 'library',      label: 'Library', icon: Library },
  { key: 'environments', label: 'Ambient', icon: Layers },
  { key: 'sfx',          label: 'SFX',     icon: Zap },
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
  const setSelectedScenario = useAppStore((s) => s.setSelectedScenario)
  const libraryOpen     = useAppStore((s) => s.libraryOpen)

  const [mobileTab, setMobileTab]   = useState('scenarios')
  const [showScenarioPicker, setShowScenarioPicker] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showMobileCreate, setShowMobileCreate] = useState(false)
  const [splashDone, setSplashDone] = useState(false)

  const [updateStatus, setUpdateStatus] = useState(null) // null | { updateAvailable, lastChecked, error }
  const [checkingUpdate, setCheckingUpdate] = useState(false)

  const checkUpdate = useCallback(async () => {
    setCheckingUpdate(true)
    try {
      const res = await fetch('/api/update/check', { method: 'POST' })
      const data = await res.json()
      setUpdateStatus(data)
    } catch {
      setUpdateStatus({ error: 'Could not reach server' })
    } finally {
      setCheckingUpdate(false)
    }
  }, [])

  useEffect(() => {
    // Load initial status without forcing a check
    fetch('/api/update/status').then(r => r.json()).then(setUpdateStatus).catch(() => {})
  }, [])

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

  const fetchMusicLibraries  = useAppStore((s) => s.fetchMusicLibraries)
  const fetchEnvironments    = useAppStore((s) => s.fetchEnvironments)

  useEffect(() => {
    fetchPlaylists()
    fetchAudioAssets()
    fetchSfxPanels()
    fetchSfxButtons()
    fetchMusicLibraries()
    fetchEnvironments()
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
              {/* Update status button */}
              <button
                onClick={checkUpdate}
                disabled={checkingUpdate}
                title={
                  checkingUpdate ? 'Checking for updates…'
                  : updateStatus?.error ? `Update check failed: ${updateStatus.error}`
                  : updateStatus?.updateAvailable ? 'Update available — click to re-check'
                  : updateStatus?.lastChecked ? 'Up to date — click to check again'
                  : 'Check for updates'
                }
                className="p-1.5 transition-colors rounded-md hover:bg-gold/10 disabled:opacity-50"
              >
                {checkingUpdate ? (
                  <RefreshCw size={15} className="text-gray-500 animate-spin" />
                ) : updateStatus?.error ? (
                  <AlertCircle size={15} className="text-red-400" />
                ) : updateStatus?.updateAvailable ? (
                  <RefreshCw size={15} className="text-gold" />
                ) : updateStatus?.lastChecked ? (
                  <CheckCircle size={15} className="text-green-500" />
                ) : (
                  <RefreshCw size={15} className="text-gray-500" />
                )}
              </button>
              <button
                onClick={() => setShowSettings(true)}
                title="Settings"
                className="p-1.5 text-gray-500 hover:text-gold transition-colors rounded-md hover:bg-gold/10"
              >
                <Settings size={15} />
              </button>
            </div>
          </header>

          <UpdateBanner />

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
                <EnvironmentsPanel />
              </div>
            </div>

            {/* Mobile: tabbed */}
            <div className="md:hidden flex flex-col h-full">
              <div className="flex-1 overflow-hidden">
                {mobileTab === 'scenarios' && (
                  <div className="flex h-full flex-col">
                    {/* Compact scenario picker strip */}
                    <div className={`shrink-0 border-b border-border ${bgImage ? 'bg-midnight/60' : 'bg-midnight'}`}>
                      <div className="flex items-center gap-2 px-3 py-2">
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest shrink-0">Scene</span>
                        <div className="flex-1 overflow-x-auto scrollbar-hide">
                          <div className="flex gap-1.5 w-max">
                            {playlists.map((p) => (
                              <button
                                key={p.id}
                                onClick={() => setSelectedScenario(p.id)}
                                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                                  p.id === selectedId
                                    ? 'bg-gold/15 border-gold/50 text-gold'
                                    : 'border-border text-gray-500 hover:text-gray-300 hover:border-gray-500'
                                }`}
                              >
                                {p.name}
                              </button>
                            ))}
                            {playlists.length === 0 && (
                              <span className="text-xs text-gray-600 py-1">No scenarios yet</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => setShowMobileCreate(true)}
                          title="New Scenario"
                          className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-md bg-gold/10 hover:bg-gold/20 text-gold text-xs font-medium transition-colors"
                        >
                          <Plus size={12} />
                          New
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <ScenarioControlPanel />
                    </div>
                  </div>
                )}
                {mobileTab === 'library' && <LibrarySidebar />}
                {mobileTab === 'environments' && <EnvironmentsPanel />}
                {mobileTab === 'sfx' && <SfxMatrix />}
              </div>
              <nav className={`flex border-t border-border shrink-0 ${bgImage ? 'bg-midnight/60 bg-midnight/40' : 'bg-midnight'}`}>
                {MOBILE_TABS.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setMobileTab(key)}
                    className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 text-xs font-medium transition-colors ${
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
        {showMobileCreate && <CreatePlaylistModal onClose={() => setShowMobileCreate(false)} />}
      </div>
    </>
  )
}
