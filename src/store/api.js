import { storage } from '../lib/storage'

function getApiBase() {
  if (typeof window !== 'undefined' && window.__TAURI_INTERNALS__) {
    return storage.getStr('server-url', 'http://localhost:3001')
  }
  return ''
}

export function api(path, opts) {
  return fetch(`${getApiBase()}${path}`, opts)
}
