import { useState } from 'react'
import {
  Play, Pause, SkipForward, Square, Shuffle, List,
  Plus, Trash2, ChevronDown, ChevronRight, Music2
} from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import CreatePlaylistModal from './CreatePlaylistModal'
import AddTrackModal from './AddTrackModal'

const INTENSITY_LABELS = ['Low', 'Medium', 'High', 'Epic', 'Legendary']
const INTENSITY_COLORS = [
  'text-blue-400 border-blue-400',
  'text-yellow-400 border-yellow-400',
  'text-orange-400 border-orange-400',
  'text-red-400 border-red-400',
  'text-purple-400 border-purple-400',
]
const INTENSITY_BG = [
  'bg-blue-400',
  'bg-yellow-400',
  'bg-orange-400',
  'bg-red-400',
  'bg-purple-400',
]

export default function PlaylistPanel() {
  const playlists = useAppStore((s) => s.playlists)
  const activePlaylistId = useAppStore((s) => s.activePlaylistId)
  const activeIntensity = useAppStore((s) => s.activeIntensity)
  const isPlaying = useAppStore((s) => s.isPlaying)
  const shuffle = useAppStore((s) => s.shuffle)
  const currentTrack = useAppStore((s) => s.currentTrack)
  const startPlaylist = useAppStore((s) => s.startPlaylist)
  const setActivePlaylist = useAppStore((s) => s.setActivePlaylist)
  const setActiveIntensity = useAppStore((s) => s.setActiveIntensity)
  const pauseResume = useAppStore((s) => s.pauseResume)
  const stopPlayback = useAppStore((s) => s.stopPlayback)
  const skipTrack = useAppStore((s) => s.skipTrack)
  const toggleShuffle = useAppStore((s) => s.toggleShuffle)
  const deletePlaylist = useAppStore((s) => s.deletePlaylist)
  const removeTrack = useAppStore((s) => s.removeTrackFromPlaylist)

  const [showCreate, setShowCreate] = useState(false)
  const [addTrackFor, setAddTrackFor] = useState(null)  // { playlist, intensityLevel }
  const [expanded, setExpanded] = useState({})

  const toggleExpand = (id) => setExpanded((s) => ({ ...s, [id]: !s[id] }))

  const handlePlaylist = (playlist) => {
    if (activePlaylistId === playlist.id && isPlaying) {
      pauseResume()
    } else {
      setActivePlaylist(playlist.id)
      startPlaylist(playlist, activePlaylistId === playlist.id ? activeIntensity : 0)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="font-fantasy text-gold text-sm tracking-widest uppercase">Playlists</h2>
        <div className="flex gap-2">
          <button
            onClick={toggleShuffle}
            title={shuffle ? 'Shuffle ON — click to disable' : 'Shuffle OFF — click to enable'}
            className={`flex items-center gap-1 px-1.5 py-1 rounded-md transition-colors ${shuffle ? 'text-gold' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Shuffle size={14} />
            <span className="text-[9px] font-semibold uppercase tracking-wider">{shuffle ? 'ON' : 'OFF'}</span>
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-gold text-xs px-2 py-1">
            <Plus size={14} className="inline -mt-0.5" /> New
          </button>
        </div>
      </div>

      {/* Now Playing Bar */}
      {currentTrack && (
        <div className="px-4 py-2 bg-midnight border-b border-border">
          <div className="flex items-center gap-2">
            <Music2 size={12} className="text-gold shrink-0 playing-glow rounded-full" />
            <span className="text-xs text-gray-300 truncate flex-1">{currentTrack.audio_assets?.name}</span>
            <div className="flex gap-1">
              <button onClick={pauseResume} className="p-1 text-gold hover:text-yellow-300">
                {isPlaying ? <Pause size={12} /> : <Play size={12} />}
              </button>
              <button onClick={skipTrack} className="p-1 text-gray-400 hover:text-white">
                <SkipForward size={12} />
              </button>
              <button onClick={stopPlayback} className="p-1 text-gray-400 hover:text-red-400">
                <Square size={12} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Playlist List */}
      <div className="flex-1 overflow-y-auto">
        {playlists.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12">
            <Music2 size={32} className="text-gray-600 mb-3" />
            <p className="text-sm text-gray-500">No playlists yet</p>
            <button onClick={() => setShowCreate(true)} className="btn-gold mt-4 text-xs">
              Create your first playlist
            </button>
          </div>
        )}

        {playlists.map((playlist) => {
          const isActive = playlist.id === activePlaylistId
          const isExpanded = expanded[playlist.id]
          const tracks = playlist.playlist_tracks ?? []
          const intensityCount = playlist.has_intensities ? playlist.intensity_count : 1

          return (
            <div key={playlist.id} className={`border-b border-border ${isActive ? 'bg-midnight/60' : ''}`}>
              {/* Playlist row */}
              <div className="flex items-center gap-2 px-3 py-2.5 group">
                <button
                  onClick={() => toggleExpand(playlist.id)}
                  className="text-gray-500 hover:text-gray-300 shrink-0"
                >
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                <button
                  onClick={() => handlePlaylist(playlist)}
                  className="flex-1 text-left flex items-center gap-2 min-w-0"
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isActive && isPlaying ? 'bg-gold playing-glow' : 'bg-border'}`}>
                    {isActive && isPlaying
                      ? <Pause size={12} className="text-midnight" />
                      : <Play size={12} className={isActive ? 'text-gold' : 'text-gray-400'} />}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${isActive ? 'text-gold' : 'text-gray-200'}`}>
                      {playlist.name}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {playlist.has_intensities
                        ? `${Math.round(tracks.length / intensityCount)} tracks · ${intensityCount} levels`
                        : `${tracks.length} track${tracks.length !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => deletePlaylist(playlist.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Intensity tabs + track list */}
              {isExpanded && (
                <div className="pb-2 px-3">
                  {/* Intensity selector */}
                  {playlist.has_intensities && (
                    <div className="flex gap-1 mb-2 flex-wrap">
                      {Array.from({ length: intensityCount }, (_, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setActivePlaylist(playlist.id)
                            setActiveIntensity(i)
                          }}
                          className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                            isActive && activeIntensity === i
                              ? INTENSITY_COLORS[i] + ' font-semibold'
                              : 'border-border text-gray-500 hover:border-gray-400'
                          }`}
                        >
                          {INTENSITY_LABELS[i]}
                          {isActive && activeIntensity === i && isPlaying && (
                            <span className={`inline-block w-1.5 h-1.5 rounded-full ml-1 ${INTENSITY_BG[i]} opacity-80`} />
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Track list for selected/all intensity */}
                  {Array.from({ length: intensityCount }, (_, intensityIdx) => {
                    const levelTracks = tracks
                      .filter((t) => t.intensity_level === intensityIdx)
                      .sort((a, b) => a.position - b.position)
                    // inactive intensity playlists show only level 0 to avoid wall of tracks
                    const show = !playlist.has_intensities ||
                      (isActive && activeIntensity === intensityIdx) ||
                      (!isActive && intensityIdx === 0)

                    return show ? (
                      <div key={intensityIdx} className="mb-2">
                        {playlist.has_intensities && (
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                            {INTENSITY_LABELS[intensityIdx]}
                          </p>
                        )}
                        {levelTracks.map((track) => (
                          <div
                            key={track.id}
                            className={`flex items-center gap-2 px-2 py-1 rounded-md group/track ${
                              currentTrack?.id === track.id ? 'bg-gold/10' : 'hover:bg-border/50'
                            }`}
                          >
                            <Music2 size={11} className={currentTrack?.id === track.id ? 'text-gold' : 'text-gray-600'} />
                            <span className={`text-xs flex-1 truncate ${currentTrack?.id === track.id ? 'text-gold' : 'text-gray-400'}`}>
                              {track.audio_assets?.name}
                            </span>
                            <button
                              onClick={() => removeTrack(track.id, playlist.id)}
                              className="opacity-0 group-hover/track:opacity-100 text-gray-500 hover:text-red-400 transition-all"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => setAddTrackFor({ playlist, intensityLevel: intensityIdx })}
                          className="w-full mt-1 text-[10px] text-gray-500 hover:text-gold flex items-center gap-1 px-2 py-1 rounded hover:bg-border/50 transition-colors"
                        >
                          <Plus size={10} /> Add tracks
                        </button>
                      </div>
                    ) : null
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {showCreate && <CreatePlaylistModal onClose={() => setShowCreate(false)} />}
      {addTrackFor && (
        <AddTrackModal
          playlist={addTrackFor.playlist}
          intensityLevel={addTrackFor.intensityLevel}
          onClose={() => setAddTrackFor(null)}
        />
      )}
    </div>
  )
}
