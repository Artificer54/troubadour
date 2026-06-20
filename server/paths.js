import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// DATA_DIR is injected by Electron in production so data survives app updates.
// Falls back to the repo root in dev.
export const DATA_ROOT = process.env.DATA_DIR ?? join(__dirname, '..')
export const TRACKS_DIR = join(DATA_ROOT, 'tracks')
export const IMAGES_DIR = join(DATA_ROOT, 'images')
export const COVERS_DIR = join(DATA_ROOT, 'images', 'covers')
