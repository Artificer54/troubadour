import { Howl } from 'howler'

class PreviewEngine {
  _howl = null
  _volume = 0.8

  play(url, onEnd) {
    if (this._howl) {
      this._howl.stop()
      this._howl.unload()
      this._howl = null
    }
    this._howl = new Howl({
      src: [url],
      volume: this._volume,
      html5: true,
      onend: () => { onEnd?.() },
    })
    this._howl.play()
  }

  pause() {
    this._howl?.pause()
  }

  resume() {
    this._howl?.play()
  }

  stop() {
    if (this._howl) {
      this._howl.stop()
      this._howl.unload()
      this._howl = null
    }
  }

  seekTo(seconds) {
    this._howl?.seek(seconds)
  }

  getCurrentPosition() {
    if (!this._howl) return 0
    const pos = this._howl.seek()
    return typeof pos === 'number' ? pos : 0
  }

  getCurrentDuration() {
    if (!this._howl) return 0
    const dur = this._howl.duration()
    return typeof dur === 'number' ? dur : 0
  }

  isPlaying() {
    return this._howl?.playing() ?? false
  }

  setVolume(v) {
    this._volume = v
    this._howl?.volume(v)
  }
}

export const previewEngine = new PreviewEngine()
