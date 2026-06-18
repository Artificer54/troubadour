import { useState } from 'react'
import { Plus, Trash2, Music2, Play, Pause } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import CreatePlaylistModal from '../playlist/CreatePlaylistModal'

export default function ScenarioSidebar() {
  const playlists = useAppStore((s) => s.playlists)
  const activePlaylistId = useAppStore((s) => s.activePlaylistId)
  const selectedScenarioId = useAppStore((s) => s.selectedScenarioId)
  const isPlaying = useAppStore((s) => s.isPlaying)
  const setSelectedScenario = useAppStore((s) => s.setSelectedScenario)
  const deletePlaylist = useAppStore((s) => s.deletePlaylist)
  const pauseResume = useAppStore((s) => s.pauseResume)

  const [showCreate, setShowCreate] = useState(false)

  return (
    <div className="flex flex-col h-full bg-midnight border-r border-border">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
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
      </div>

      {/* Scenario list */}
      <div className="flex-1 overflow-y-auto py-1">
        {playlists.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
            <Music2 size={28} className="text-gray-600 mb-2" />
            <p className="text-xs text-gray-500">No scenarios yet</p>
            <button onClick={() => setShowCreate(true)} className="btn-gold mt-3 text-xs px-3 py-1.5">
              Create one
            </button>
          </div>
        )}

        {playlists.map((playlist) => {
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
