/**
 * Troubadour Audio Engine
 * Handles playlist crossfading (Howler.js) and simultaneous SFX playback.
 */
import { Howl, Howler } from 'howler'

class AudioEngine {
  constructor() {
    this._playlistHowls = []      // [{ howl, trackId }]
    this._activeIndex = 0
    this._volume = 0.8
    this._sfxVolume = 0.9
    this._activeSfxHowls = []     // all currently playing SFX instances
    this._crossfadeMs = 1500
    this._onTrackEndCb = null
    this._cleanupSeq = 0          // guards stale crossfade cleanup callbacks
    this._pauseFaded = false
    // Environment looping tracks: Map<trackId, { howl, targetVolume }>
    this._environmentHowls = new Map()
    this._environmentMasterVolume = 1.0
    Howler.volume(1)
  }

  setCrossfadeDuration(ms) {
    this._crossfadeMs = Math.max(100, Math.min(10000, ms))
  }

  // ── Playlist ──────────────────────────────────────────────

  playTrack(url, trackId, onEnd) {
    const outgoing = this._playlistHowls[this._activeIndex]

    const incoming = new Howl({
      src: [url],
      html5: true,
      volume: 0,
      onend: () => {
        if (onEnd) onEnd()
      },
      onloaderror: (id, err) => console.error('Howler load error', err),
    })

    this._playlistHowls.push({ howl: incoming, trackId })
    this._activeIndex = this._playlistHowls.length - 1
    incoming.play()

    incoming.fade(0, this._volume, this._crossfadeMs)

    if (outgoing) {
      const seq = ++this._cleanupSeq
      outgoing.howl.fade(outgoing.howl.volume(), 0, this._crossfadeMs)
      setTimeout(() => {
        if (this._cleanupSeq !== seq) return
        outgoing.howl.stop()
        outgoing.howl.unload()
        this._playlistHowls = this._playlistHowls.filter(
          (h) => h.howl !== outgoing.howl
        )
        this._activeIndex = this._playlistHowls.length - 1
      }, this._crossfadeMs + 100)
    }
  }

  fadeAndPause(fadeMs = 600) {
    const current = this._getCurrentHowl()
    if (!current) return
    this._pauseFaded = true
    current.fade(current.volume(), 0, fadeMs)
    setTimeout(() => {
      if (this._pauseFaded) current.pause()
    }, fadeMs)
  }

  pauseTrack() {
    const current = this._getCurrentHowl()
    if (current) current.pause()
  }

  resumeTrack() {
    const current = this._getCurrentHowl()
    if (current) {
      current.play()
      if (this._pauseFaded) {
        this._pauseFaded = false
        current.fade(0, this._volume, 600)
      }
    }
  }

  stopAll() {
    this._playlistHowls.forEach(({ howl }) => {
      howl.fade(howl.volume(), 0, 400)
      setTimeout(() => { howl.stop(); howl.unload() }, 500)
    })
    this._playlistHowls = []
    this._activeIndex = 0
  }

  setPlaylistVolume(v) {
    this._volume = Math.max(0, Math.min(1, v))
    const current = this._getCurrentHowl()
    if (current) current.volume(this._volume)
  }

  seekTo(seconds) {
    const current = this._getCurrentHowl()
    if (current) current.seek(seconds)
  }

  getCurrentPosition() {
    const current = this._getCurrentHowl()
    return current ? current.seek() : 0
  }

  getCurrentDuration() {
    const current = this._getCurrentHowl()
    return current ? current.duration() : 0
  }

  _getCurrentHowl() {
    const entry = this._playlistHowls[this._activeIndex]
    return entry ? entry.howl : null
  }

  // ── SFX ──────────────────────────────────────────────────

  playSfx(url) {
    const howl = new Howl({
      src: [url],
      html5: false,
      volume: this._sfxVolume,
      onend: () => {
        this._activeSfxHowls = this._activeSfxHowls.filter((h) => h !== howl)
        howl.unload()
      },
    })
    this._activeSfxHowls.push(howl)
    howl.play()
    return howl
  }

  stopSfx(howl) {
    if (howl && typeof howl.stop === 'function') {
      howl.fade(howl.volume(), 0, 200)
      setTimeout(() => { howl.stop(); howl.unload() }, 250)
      this._activeSfxHowls = this._activeSfxHowls.filter((h) => h !== howl)
    }
  }

  stopAllSfx() {
    this._activeSfxHowls.forEach((h) => {
      h.fade(h.volume(), 0, 200)
      setTimeout(() => { try { h.stop(); h.unload() } catch (_) {} }, 250)
    })
    this._activeSfxHowls = []
  }

  setSfxVolume(v) {
    this._sfxVolume = Math.max(0, Math.min(1, v))
  }

  // ── Environment (looping ambient layers) ────────────────────

  startEnvironmentTrack(url, trackId, volume = 1.0, fadeDuration = 1200) {
    if (this._environmentHowls.has(trackId)) return
    const target = Math.max(0, Math.min(1, volume)) * this._environmentMasterVolume
    const howl = new Howl({
      src: [url],
      html5: false,
      loop: true,
      volume: 0,
      onloaderror: (id, err) => console.error('Environment track load error', err),
    })
    this._environmentHowls.set(trackId, { howl, targetVolume: volume })
    howl.play()
    howl.fade(0, target, fadeDuration)
  }

  stopEnvironmentTrack(trackId, fadeDuration = 1200) {
    const entry = this._environmentHowls.get(trackId)
    if (!entry) return
    this._environmentHowls.delete(trackId)
    entry.howl.fade(entry.howl.volume(), 0, fadeDuration)
    setTimeout(() => { try { entry.howl.stop(); entry.howl.unload() } catch (_) {} }, fadeDuration + 100)
  }

  stopAllEnvironmentTracks(fadeDuration = 1200) {
    for (const trackId of this._environmentHowls.keys()) {
      this.stopEnvironmentTrack(trackId, fadeDuration)
    }
  }

  setEnvironmentTrackVolume(trackId, volume) {
    const entry = this._environmentHowls.get(trackId)
    if (!entry) return
    entry.targetVolume = Math.max(0, Math.min(1, volume))
    entry.howl.volume(entry.targetVolume * this._environmentMasterVolume)
  }

  setEnvironmentMasterVolume(v) {
    this._environmentMasterVolume = Math.max(0, Math.min(1, v))
    for (const entry of this._environmentHowls.values()) {
      entry.howl.volume(entry.targetVolume * this._environmentMasterVolume)
    }
  }

  // Crossfade between presets: fade out tracks not in next set, fade in new ones
  applyEnvironmentPreset(environmentTrackIds, volumes, fadeDuration = 1500) {
    const nextSet = new Set(environmentTrackIds)

    // Stop tracks not in next preset
    for (const trackId of this._environmentHowls.keys()) {
      if (!nextSet.has(trackId)) {
        this.stopEnvironmentTrack(trackId, fadeDuration)
      }
    }

    // Update volumes for already-playing tracks; they'll be started by the store if not yet playing
    for (let i = 0; i < environmentTrackIds.length; i++) {
      const trackId = environmentTrackIds[i]
      const vol = volumes[i] ?? 1.0
      const entry = this._environmentHowls.get(trackId)
      if (entry) {
        entry.targetVolume = Math.max(0, Math.min(1, vol))
        const target = entry.targetVolume * this._environmentMasterVolume
        entry.howl.fade(entry.howl.volume(), target, fadeDuration)
      }
    }
  }
}

export const audioEngine = new AudioEngine()
