import { useState } from 'react'
import { Check, Palette, Sliders, RotateCcw, Plus, Trash2, Pencil, X, Wifi, Library, BookOpen } from 'lucide-react'
import { useAppStore, PRESET_THEMES, DEFAULT_CUSTOM_COLORS } from '../../store/useAppStore'
import Modal from './Modal'
import LibraryManager from './LibraryManager'

const INTENSITY_LABELS = ['Calm', 'Tense', 'Intense', 'Frantic', 'Legendary']

const THEME_PREVIEWS = {
  darkfantasy: { bg: '#111827', accent: '#d4af37', ember: '#c0392b' },
  arcane:      { bg: '#0d0818', accent: '#a855f7', ember: '#7c3aed' },
  battlefield: { bg: '#0f1a0a', accent: '#84cc16', ember: '#b45309' },
  celestial:   { bg: '#0a0f1e', accent: '#93c5fd', ember: '#60a5fa' },
  bloodmoon:   { bg: '#120505', accent: '#dc2626', ember: '#f97316' },
  deepsea:     { bg: '#051216', accent: '#22d3ee', ember: '#34d399' },
  sunset:      { bg: '#140a05', accent: '#fb923c', ember: '#ef4444' },
  neonvoid:    { bg: '#040408', accent: '#00ffc8', ember: '#b400ff' },
}

const CUSTOM_COLOR_KEYS = [
  { key: 'accent',   label: 'Accent',          hint: 'Primary highlight' },
  { key: 'ember',    label: 'Secondary',        hint: 'Buttons and alerts' },
  { key: 'darkbg',   label: 'Background',       hint: 'Main page background' },
  { key: 'midnight', label: 'Deep Background',  hint: 'Sidebar and header' },
  { key: 'panel',    label: 'Panel',            hint: 'Cards and panels' },
  { key: 'border',   label: 'Border',           hint: 'Dividers and borders' },
]

export default function SettingsModal({ onClose }) {
  const [tab, setTab] = useState('theme')
  const [helpSection, setHelpSection] = useState('overview')

  const activeTheme          = useAppStore((s) => s.activeTheme)
  const setTheme             = useAppStore((s) => s.setTheme)
  const customPresets        = useAppStore((s) => s.customPresets)
  const activeCustomPresetId = useAppStore((s) => s.activeCustomPresetId)
  const createCustomPreset   = useAppStore((s) => s.createCustomPreset)
  const deleteCustomPreset   = useAppStore((s) => s.deleteCustomPreset)
  const renameCustomPreset   = useAppStore((s) => s.renameCustomPreset)
  const updateCustomPresetColor = useAppStore((s) => s.updateCustomPresetColor)
  const applyCustomPreset    = useAppStore((s) => s.applyCustomPreset)

  const intensityColors      = useAppStore((s) => s.intensityColors)
  const setIntensityColor    = useAppStore((s) => s.setIntensityColor)
  const resetIntensityColors = useAppStore((s) => s.resetIntensityColors)

  const [renamingId, setRenamingId]   = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [newPresetName, setNewPresetName] = useState('')
  const [showNewInput, setShowNewInput]   = useState(false)

  const activePreset = customPresets.find(p => p.id === activeCustomPresetId)

  const handleNewPreset = () => {
    const name = newPresetName.trim() || 'Custom Preset'
    createCustomPreset(name)
    setNewPresetName('')
    setShowNewInput(false)
  }

  const startRename = (preset) => {
    setRenamingId(preset.id)
    setRenameValue(preset.name)
  }

  const commitRename = (id) => {
    if (renameValue.trim()) renameCustomPreset(id, renameValue.trim())
    setRenamingId(null)
  }

  return (
    <Modal title="Settings" onClose={onClose} wide>
      {/* Tab bar */}
      <div className="flex gap-1 mb-5 border-b border-border pb-3">
        {[
          { key: 'theme',      label: 'Theme',            icon: Palette },
          { key: 'intensity',  label: 'Intensity Colors', icon: Sliders },
          { key: 'libraries',  label: 'Libraries',        icon: Library },
          { key: 'connection', label: 'Remote Access',     icon: Wifi },
          { key: 'help',       label: 'Help & Setup',     icon: BookOpen },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === key
                ? 'bg-gold text-midnight'
                : 'text-gray-400 hover:text-gray-200 hover:bg-border/60'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Theme tab ─────────────────────────────────────────── */}
      {tab === 'theme' && (
        <div className="space-y-6">

          {/* Preset themes */}
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-3">Preset Themes</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(PRESET_THEMES).map(([key, theme]) => {
                const preview = THEME_PREVIEWS[key] ?? THEME_PREVIEWS.darkfantasy
                const isActive = activeTheme === key
                return (
                  <button
                    key={key}
                    onClick={() => setTheme(key)}
                    className={`relative flex flex-col items-start gap-1.5 px-3 py-2.5 rounded-lg border transition-all text-left ${
                      isActive ? 'border-gold ring-1 ring-gold/30' : 'border-border hover:border-gray-500'
                    }`}
                    style={{ background: preview.bg }}
                  >
                    <div className="flex gap-1">
                      <div className="w-3 h-3 rounded-full border border-white/20" style={{ background: preview.accent }} />
                      <div className="w-3 h-3 rounded-full border border-white/20" style={{ background: preview.ember }} />
                    </div>
                    <span className="text-xs text-gray-200 font-medium leading-tight">{theme.label}</span>
                    {isActive && <Check size={11} className="absolute top-2 right-2 text-gold" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Custom presets */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Custom Presets</p>
              <button
                onClick={() => setShowNewInput(v => !v)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gold transition-colors"
              >
                <Plus size={12} />
                New preset
              </button>
            </div>

            {/* New preset name input */}
            {showNewInput && (
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newPresetName}
                  onChange={e => setNewPresetName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleNewPreset(); if (e.key === 'Escape') setShowNewInput(false) }}
                  placeholder="Preset name…"
                  autoFocus
                  className="input-dark flex-1 text-xs py-1.5"
                />
                <button onClick={handleNewPreset} className="px-3 py-1.5 bg-gold text-midnight text-xs font-semibold rounded-lg">
                  Create
                </button>
                <button onClick={() => setShowNewInput(false)} className="p-1.5 text-gray-500 hover:text-gray-300">
                  <X size={14} />
                </button>
              </div>
            )}

            {customPresets.length === 0 && !showNewInput && (
              <p className="text-xs text-gray-600 py-2">
                No custom presets yet. Click <span className="text-gray-400">New preset</span> to create one.
              </p>
            )}

            {/* Preset list */}
            <div className="space-y-1.5">
              {customPresets.map(preset => {
                const isActive = activeTheme === 'custom' && activeCustomPresetId === preset.id
                return (
                  <div key={preset.id}>
                    <div
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all cursor-pointer ${
                        isActive ? 'border-gold bg-gold/5' : 'border-border hover:border-gray-500 hover:bg-border/20'
                      }`}
                      onClick={() => applyCustomPreset(preset.id)}
                    >
                      {/* Color dots */}
                      <div className="flex gap-0.5 shrink-0">
                        {['accent','ember','darkbg'].map(k => (
                          <div key={k} className="w-2.5 h-2.5 rounded-full border border-white/10"
                            style={{ background: preset.colors[k] ?? DEFAULT_CUSTOM_COLORS[k] }} />
                        ))}
                      </div>

                      {/* Name / rename input */}
                      {renamingId === preset.id ? (
                        <input
                          type="text"
                          value={renameValue}
                          autoFocus
                          onChange={e => setRenameValue(e.target.value)}
                          onBlur={() => commitRename(preset.id)}
                          onKeyDown={e => { if (e.key === 'Enter') commitRename(preset.id); if (e.key === 'Escape') setRenamingId(null) }}
                          onClick={e => e.stopPropagation()}
                          className="flex-1 bg-transparent text-xs text-gray-100 outline-none border-b border-gold"
                        />
                      ) : (
                        <span className="flex-1 text-xs text-gray-200 font-medium truncate">{preset.name}</span>
                      )}

                      {isActive && <Check size={11} className="text-gold shrink-0" />}

                      {/* Actions */}
                      <button
                        onClick={e => { e.stopPropagation(); startRename(preset) }}
                        className="p-1 text-gray-600 hover:text-gold transition-colors"
                        title="Rename"
                      >
                        <Pencil size={11} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); deleteCustomPreset(preset.id) }}
                        className="p-1 text-gray-600 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>

                    {/* Inline color editor — only shown for active preset */}
                    {isActive && (
                      <div className="mt-1 ml-2 pl-3 border-l border-border/60 space-y-1.5 py-2">
                        {CUSTOM_COLOR_KEYS.map(({ key, label, hint }) => (
                          <div key={key} className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-300">{label}</p>
                              <p className="text-[10px] text-gray-600">{hint}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] font-mono text-gray-500 hidden sm:block">
                                {preset.colors[key] ?? DEFAULT_CUSTOM_COLORS[key]}
                              </span>
                              <input
                                type="color"
                                value={preset.colors[key] ?? DEFAULT_CUSTOM_COLORS[key]}
                                onChange={e => updateCustomPresetColor(preset.id, key, e.target.value)}
                                className="w-8 h-7 rounded cursor-pointer border border-border bg-transparent p-0.5"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Intensity Colors tab ───────────────────────────────── */}
      {tab === 'intensity' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Intensity Glow Colors</p>
            <button
              onClick={resetIntensityColors}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-gold border border-border hover:border-gold/50 transition-colors"
            >
              <RotateCcw size={11} />
              Reset to defaults
            </button>
          </div>

          <div className="space-y-2">
            {INTENSITY_LABELS.map((label, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 bg-midnight/40">
                <div
                  className="w-4 h-4 rounded-full shrink-0 ring-2 ring-black/30"
                  style={{ background: intensityColors[i] }}
                />
                <span className="text-sm text-gray-300 flex-1">{label}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono text-gray-500">{intensityColors[i]}</span>
                  <input
                    type="color"
                    value={intensityColors[i]}
                    onChange={e => setIntensityColor(i, e.target.value)}
                    className="w-8 h-7 rounded cursor-pointer border border-border bg-transparent p-0.5"
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-gray-600 pt-1">
            These colors affect the disk glow, active intensity button borders and text, and the sidebar playing indicator.
          </p>
        </div>
      )}

      {/* ── Libraries tab ─────────────────────────────────────── */}
      {tab === 'libraries' && <LibraryManager />}

      {/* ── Help & Setup tab ───────────────────────────────────── */}
      {tab === 'help' && (
        <div className="flex gap-4">
          {/* Sidebar nav */}
          <div className="w-36 shrink-0 space-y-0.5">
            {[
              { key: 'overview',   label: 'Overview' },
              { key: 'selfhost',   label: 'Self-Hosting' },
              { key: 'tailscale',  label: 'Tailscale' },
              { key: 'android',    label: 'Phone / Tablet' },
              { key: 'updates',    label: 'Updates' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setHelpSection(key)}
                className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors ${
                  helpSection === key
                    ? 'bg-gold/15 text-gold font-medium'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-border/40'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 text-sm text-gray-300 space-y-3 overflow-auto max-h-[55vh]">

            {helpSection === 'overview' && (<>
              <p className="text-base font-semibold text-gray-100">What is Troubadour?</p>
              <p className="text-xs text-gray-400">Troubadour is a TTRPG audio manager. It lets you organize music into Scenarios (playlists), switch between intensity levels during play, and trigger sound effects from a configurable SFX Matrix.</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest pt-2">Ways to use it</p>
              <div className="space-y-2">
                <div className="border border-border/40 rounded-lg p-2.5">
                  <p className="text-xs font-medium text-gray-200">Self-hosted Web Server</p>
                  <p className="text-xs text-gray-500 mt-0.5">Run on any PC on your network. Open the URL in any browser — on the host or from another device.</p>
                </div>
                <div className="border border-border/40 rounded-lg p-2.5">
                  <p className="text-xs font-medium text-gray-200">Remote via Tailscale</p>
                  <p className="text-xs text-gray-500 mt-0.5">Access from anywhere — home, game store, online session. Works across different networks.</p>
                </div>
              </div>
            </>)}


            {helpSection === 'selfhost' && (<>
              <p className="text-base font-semibold text-gray-100">Self-Hosting (Web Server)</p>
              <p className="text-xs text-gray-400">Run Troubadour as a local web server so any browser on your network can use it — no installation on client devices.</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest pt-2">Requirements</p>
              <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                <li>Node.js 18+ installed on the host PC</li>
                <li>Git (to pull updates)</li>
              </ul>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest pt-3">First-time setup</p>
              <pre className="bg-midnight text-xs text-gray-300 rounded-lg p-2.5 overflow-x-auto leading-relaxed">{`git clone https://github.com/artificer54/Troubador
cd Troubador
npm install
npm run build
npm start`}</pre>
              <p className="text-xs text-gray-400">The server runs on <span className="text-gray-200">http://0.0.0.0:3001</span>. Open <span className="text-gray-200">http://localhost:3001</span> on the host, or use the host's IP from other devices.</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest pt-3">Run in the background (PM2)</p>
              <pre className="bg-midnight text-xs text-gray-300 rounded-lg p-2.5 overflow-x-auto leading-relaxed">{`npm install -g pm2
pm2 start server/index.js --name troubadour
pm2 save
pm2 startup    # auto-start on reboot`}</pre>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest pt-3">Data location</p>
              <p className="text-xs text-gray-400">Uploaded audio lives in <span className="text-gray-200">./tracks/</span> and the database at <span className="text-gray-200">./troubador.db</span> — both next to the project folder.</p>
            </>)}

            {helpSection === 'tailscale' && (<>
              <p className="text-base font-semibold text-gray-100">Tailscale Remote Access</p>
              <p className="text-xs text-gray-400">Tailscale creates a private VPN between your devices. Use it to reach Troubadour from your phone, tablet, or a friend's computer — even from a different network.</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest pt-2">Setup</p>
              <ol className="space-y-1.5 text-xs text-gray-400 list-decimal list-inside">
                <li>Install Tailscale on the PC running Troubadour — <span className="text-gray-200">tailscale.com/download</span></li>
                <li>Install Tailscale on your phone/tablet</li>
                <li>Sign in with the same account on both</li>
                <li>In the Tailscale app, find your PC's Tailscale IP (starts with <span className="text-gray-200">100.</span>)</li>
                <li>Open a browser on your phone and go to <span className="text-gray-200">http://100.x.x.x:3001</span></li>
              </ol>
              <p className="text-xs text-gray-500 pt-2">No port forwarding or router changes needed. Tailscale handles NAT traversal.</p>
              <div className="border border-border/40 rounded-lg p-2.5 mt-2">
                <p className="text-xs font-medium text-gray-300">Add to home screen</p>
                <p className="text-xs text-gray-500 mt-0.5">In your phone&apos;s browser, tap <span className="text-gray-200">Add to Home Screen</span> to pin Troubadour as a full-screen icon.</p>
              </div>
            </>)}

            {helpSection === 'android' && (<>
              <p className="text-base font-semibold text-gray-100">Phone / Tablet Access</p>
              <p className="text-xs text-gray-400">Troubadour works great on phones and tablets — no app install needed. Just open the URL in a browser:</p>
              <ol className="space-y-1.5 text-xs text-gray-400 list-decimal list-inside mt-2">
                <li>Run Troubadour as a web server on your PC (see <button onClick={() => setHelpSection('selfhost')} className="text-gold underline">Self-Hosting</button>)</li>
                <li>Connect your phone to Tailscale or the same WiFi network</li>
                <li>Open Chrome or Firefox on your phone</li>
                <li>Navigate to the server's IP address (e.g. <span className="text-gray-200">http://192.168.1.10:3001</span>)</li>
                <li>Tap the browser's "Add to Home Screen" option to pin it like an app</li>
              </ol>
              <p className="text-xs text-gray-500 pt-2">The web UI is fully mobile-responsive. Adding it to your home screen gives an app-like experience.</p>
            </>)}

            {helpSection === 'updates' && (<>
              <p className="text-base font-semibold text-gray-100">Updating Troubadour</p>
              <p className="text-xs text-gray-400">Run these commands in the project directory to pull the latest version from GitHub:</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest pt-1">Self-hosted</p>
              <pre className="bg-midnight text-xs text-gray-300 rounded-lg p-2.5 overflow-x-auto leading-relaxed">{`git pull
npm install
npm run build
pm2 restart troubadour`}</pre>
              <p className="text-xs text-gray-400">Run these in the project directory whenever you want to pull the latest changes from GitHub.</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest pt-3">What gets updated</p>
              <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                <li>New features and UI changes</li>
                <li>Bug fixes</li>
                <li>Your audio files and database are <span className="text-gray-200">never</span> touched by updates</li>
              </ul>
            </>)}

          </div>
        </div>
      )}

      {/* ── Remote Access tab ─────────────────────────────────── */}
      {tab === 'connection' && (
        <div className="space-y-5">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">About Remote Access</p>
            <p className="text-xs text-gray-500">
              Troubadour is a web app — any device on your network can open it in a browser. No app install needed on phones or tablets.
            </p>
          </div>

          <div className="border border-border/40 rounded-lg p-3 space-y-1.5">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Local WiFi (same network)</p>
            <p className="text-xs text-gray-400">1. On your PC, open a terminal and run <code className="bg-midnight px-1 rounded text-gray-300">ipconfig</code></p>
            <p className="text-xs text-gray-400">2. Look for <span className="text-gray-300">IPv4 Address</span> under your WiFi adapter</p>
            <p className="text-xs text-gray-400">3. On your phone, open <code className="bg-midnight px-1 rounded text-gray-300">http://192.168.x.x:3001</code></p>
            <p className="text-xs text-gray-500 pt-1">Both your PC and phone must be on the same WiFi network.</p>
          </div>

          <div className="border border-border/40 rounded-lg p-3 space-y-1.5">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Tailscale (works across networks)</p>
            <p className="text-xs text-gray-400">1. Install <a href="https://tailscale.com" target="_blank" rel="noreferrer" className="text-gold underline">Tailscale</a> on your PC and phone</p>
            <p className="text-xs text-gray-400">2. Sign in with the same account on both devices</p>
            <p className="text-xs text-gray-400">3. Find your PC&apos;s Tailscale IP in the Tailscale app (starts with <span className="text-gray-300">100.</span>)</p>
            <p className="text-xs text-gray-400">4. On your phone, open <code className="bg-midnight px-1 rounded text-gray-300">http://100.x.x.x:3001</code></p>
            <p className="text-xs text-gray-500 pt-1">Works from anywhere — coffee shops, remote sessions, different networks. No port forwarding needed.</p>
          </div>

          <div className="border border-border/40 rounded-lg p-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Add to Home Screen</p>
            <p className="text-xs text-gray-400">On Android or iOS: open the URL in Chrome or Safari, then tap <span className="text-gray-200">Add to Home Screen</span> for a full-screen app-like experience.</p>
          </div>
        </div>
      )}
    </Modal>
  )
}
