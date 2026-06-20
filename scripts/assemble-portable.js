/**
 * Assembles a portable Troubadour distribution folder after `tauri build --bundles none`.
 * Output: dist-portable/
 *   troubadour.exe  ← Tauri binary
 *   node.exe        ← bundled Node runtime
 *   server/         ← Express server files
 */
import { copyFileSync, cpSync, mkdirSync, rmSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const targetDir = process.env.CARGO_TARGET_DIR
  ? join(process.env.CARGO_TARGET_DIR, 'release')
  : join(root, 'src-tauri', 'target', 'release')

const out = join(root, 'dist-portable')
if (existsSync(out)) rmSync(out, { recursive: true })
mkdirSync(out, { recursive: true })

// Main app binary
const exeSrc = join(targetDir, 'troubadour.exe')
copyFileSync(exeSrc, join(out, 'Troubadour.exe'))
console.log('✓ Troubadour.exe')

// Bundled Node runtime
const nodeSrc = join(root, 'src-tauri', 'binaries', 'node.exe')
copyFileSync(nodeSrc, join(out, 'node.exe'))
console.log('✓ node.exe')

// Express server files
cpSync(join(root, 'server'), join(out, 'server'), { recursive: true })
console.log('✓ server/')

console.log(`\nPortable build ready: ${out}`)
console.log('Run with: dist-portable\\Troubadour.exe')
