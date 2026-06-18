import { useEffect, useState } from 'react'
import { Music, Zap, LogOut, X, Settings } from 'lucide-react'
import { supabase } from './lib/supabase'
import { useAppStore, applyTheme, applyIntensityColors } from './store/useAppStore'
import { startKeepAlive } from './lib/supabaseKeepAlive'
import AuthGate from './components/AuthGate'
import ScenarioSidebar from './components/scenario/ScenarioSidebar'
import ScenarioControlPanel from './components/scenario/ScenarioControlPanel'
import SfxMatrix from './components/sfx/SfxMatrix'
import SettingsModal from './components/ui/SettingsModal'

const MOBILE_TABS = [
  { key: 'scenarios', label: 'Scenarios', icon: Music },
  { key: 'sfx',      label: 'SFX',       icon: Zap },
]

export default function App() {
  const user            = useAppStore((s) => s.user)
  const setUser         = useAppStore((s) => s.setUser)
  const fetchPlaylists  = useAppStore((s) => s.fetchPlaylists)
  const fetchAudioAssets= useAppStore((s) => s.fetchAudioAssets)
  const fetchSfxPanels  = useAppStore((s) => s.fetchSfxPanels)
  const fetchSfxButtons = useAppStore((s) => s.fetchSfxButtons)
  const appError        = useAppStore((s) => s.appError)
  const clearAppError   = useAppStore((s) => s.clearAppError)
  const activeTheme     = useAppStore((s) => s.activeTheme)

  const [mobileTab, setMobileTab] = useState('scenarios')
  const [loading, setLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)

  // Apply theme + intensity colors on mount and whenever activeTheme changes
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

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [setUser])

  // Fetch data + start keep-alive after login
  useEffect(() => {
    if (!user) return
    fetchPlaylists()
    fetchAudioAssets()
    fetchSfxPanels()
    fetchSfxButtons()
    startKeepAlive()
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-midnight">
        <div className="text-gold font-fantasy text-xl animate-pulse">TROUBADOUR</div>
      </div>
    )
  }

  if (!user) return <AuthGate />

  const displayName = user.user_metadata?.display_name ?? user.email?.split('@')[0]

  return (
    <div className="h-screen flex flex-col bg-darkbg overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2 bg-midnight border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="font-fantasy text-gold text-lg tracking-widest">TROUBADOUR</h1>
          <span className="hidden sm:block text-[10px] text-gray-600 uppercase tracking-widest">TTRPG Audio</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 hidden sm:block">{displayName}</span>
          <button
            onClick={() => setShowSettings(true)}
            title="Settings"
            className="p-1.5 text-gray-500 hover:text-gold transition-colors rounded-md hover:bg-gold/10"
          >
            <Settings size={15} />
          </button>
          <button
            onClick={() => supabase.auth.signOut()}
            title="Sign out"
            className="p-1.5 text-gray-500 hover:text-red-400 transition-colors rounded-md hover:bg-red-400/10"
          >
            <LogOut size={15} />
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
          {/* Col 1: Scenario sidebar */}
          <div className="w-52 lg:w-60 shrink-0 flex flex-col overflow-hidden">
            <ScenarioSidebar />
          </div>

          {/* Col 2: Scenario control panel */}
          <div className="flex-1 flex flex-col overflow-hidden border-x border-border">
            <ScenarioControlPanel />
          </div>

          {/* Col 3: SFX Matrix */}
          <div className="w-80 lg:w-96 xl:w-[420px] shrink-0 flex flex-col overflow-hidden">
            <SfxMatrix />
          </div>
        </div>

        {/* Mobile: tabbed */}
        <div className="md:hidden flex flex-col h-full">
          <div className="flex-1 overflow-hidden">
            {mobileTab === 'scenarios' ? (
              <div className="flex h-full flex-col">
                <div className="border-b border-border shrink-0 max-h-40 overflow-y-auto">
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
          <nav className="flex border-t border-border bg-midnight shrink-0">
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

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  )
}
