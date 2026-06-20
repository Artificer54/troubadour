/**
 * Copies the current node.exe into src-tauri/binaries/ so Tauri can bundle it
 * as a self-contained sidecar — no Node.js installation required on end users' machines.
 *
 * Run automatically via `npm run tauri:prebuild` before `tauri build`.
 */
import { copyFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const dest = join(root, 'src-tauri', 'binaries', 'node.exe')

mkdirSync(dirname(dest), { recursive: true })
copyFileSync(process.execPath, dest)
console.log(`[prepare-sidecar] Copied ${process.execPath} → ${dest}`)
