import { useState } from 'react'
import { Plus, Trash2, Music2, Play, Pause, Library, Search, X } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import CreatePlaylistModal from '../playlist/CreatePlaylistModal'
import ScenarioTypeIcon from '../ui/ScenarioTypeIcon'

export default function ScenarioSidebar() {
  const playlists = useAppStore((s) => s.playlists)
  const activePlaylistId = useAppStore((s) => s.activePlaylistId)
  const selectedScenarioId = useAppStore((s) => s.selectedScenarioId)
  const isPlaying = useAppStore((s) => s.isPlaying)
  const setSelectedScenario = useAppStore((s) => s.setSelectedScenario)
  const deletePlaylist = useAppStore((s) => s.deletePlaylist)
  const pauseResume = useAppStore((s) => s.pauseResume)

  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')

  const isLibrarySelected = selectedScenarioId === '__library__'

  const filtered = playlists.filter(p =>
    !search.trim() || p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full bg-midnight border-r border-border">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="font-fantasy text-gold text-xs tracking-widest uppercase">Scenarios</h2>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-gold/10 hover:bg-gold/20 text-gold text-xs font-medium transition-colors"
            title="New Scenario"
          >
            <Plus size={13} />
            New
          </button>
        </div>

        {/* Search */}
        <div className="relative mt-2">
          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            className="input-dark w-full pl-7 pr-6 py-1 text-xs"
            placeholder="Filter scenarios…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300">
              <X size={10}/>
            </button>
          )}
        </div>
      </div>

      {/* Library entry — always at top */}
      <div
        className={`flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-colors border-b border-border ${
          isLibrarySelected ? 'bg-panel' : 'hover:bg-panel/60'
        }`}
        onClick={() => setSelectedScenario('__library__')}
      >
        <Library size={14} className={isLibrarySelected ? 'text-gold' : 'text-gray-500'} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${isLibrarySelected ? 'text-gold' : 'text-gray-400'}`}>
            Music Library
          </p>
          <p className="text-[10px] text-gray-600">Browse & preview all tracks</p>
        </div>
      </div>

      {/* Scenario list */}
      <div className="flex-1 overflow-y-auto py-1">
        {playlists.length === 0 && !search && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
            <Music2 size={28} className="text-gray-600 mb-2" />
            <p className="text-xs text-gray-500">No scenarios yet</p>
            <button onClick={() => setShowCreate(true)} className="btn-gold mt-3 text-xs px-3 py-1.5">
              Create one
            </button>
          </div>
        )}
        {search && filtered.length === 0 && (
          <p className="text-xs text-gray-600 text-center py-4">No matches</p>
        )}

        {filtered.map((playlist) => {
          const isActive = playlist.id === activePlaylistId
          const isSelected = playlist.id === selectedScenarioId
          const trackCount = playlist.playlist_tracks?.length ?? 0

          return (
            <div
              key={playlist.id}
              className={`group flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors border-b border-border/50 ${
                isSelected ? 'bg-panel' : 'hover:bg-panel/60'
              }`}
              onClick={() => setSelectedScenario(playlist.id)}
            >
              {/* Playing indicator dot */}
              <div className={`shrink-0 w-1.5 h-1.5 rounded-full transition-all ${
                isActive && isPlaying ? 'bg-gold playing-glow' : isActive ? 'bg-gold/40' : 'bg-transparent'
              }`} />

              {/* Scenario type icon */}
              <ScenarioTypeIcon
                type={playlist.scenario_type ?? 'scene'}
                size={13}
                className={isSelected ? 'text-gold' : isActive ? 'text-gold/60' : 'text-gray-600'}
              />

              <div className="flex-1 min-w-0">
                <p className={`text-sm truncate font-medium ${
                  isSelected ? 'text-gold' : isActive ? 'text-gold/80' : 'text-gray-300'
                }`}>
                  {playlist.name}
                </p>
                <p className="text-[10px] text-gray-500">
                  {playlist.has_intensities
                    ? `${playlist.intensity_count} intensities`
                    : `${trackCount} track${trackCount !== 1 ? 's' : ''}`}
                </p>
              </div>

              {/* Play/pause button — only shown when this scenario is active */}
              {isActive && (
                <button
                  onClick={(e) => { e.stopPropagation(); pauseResume() }}
                  className="shrink-0 p-1 rounded text-gold/70 hover:text-gold hover:bg-gold/10 transition-all"
                  title={isPlaying ? 'Pause' : 'Resume'}
                >
                  {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                </button>
              )}

              {/* Delete on hover */}
              <button
                onClick={(e) => { e.stopPropagation(); deletePlaylist(playlist.id) }}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-600 hover:text-red-400 transition-all shrink-0"
              >
                <Trash2 size={12} />
              </button>
            </div>
          )
        })}
      </div>

      {showCreate && <CreatePlaylistModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
