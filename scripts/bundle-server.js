/**
 * Compiles the Express server into a single file using @vercel/ncc.
 * Native addons (better-sqlite3, sharp) are copied alongside the bundle.
 *
 * Output: server-bundle/index.js  +  server-bundle/node_modules/ (native .node files)
 *
 * Run automatically via `npm run tauri:prebuild` before `tauri build`.
 */
import { execSync } from 'child_process'
import { rmSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const out = join(root, 'server-bundle')

if (existsSync(out)) {
  rmSync(out, { recursive: true })
  console.log('[bundle-server] Cleaned old server-bundle/')
}

console.log('[bundle-server] Compiling server with ncc...')
execSync(
  `npx ncc build server/index.js --out server-bundle --external better-sqlite3 --external sharp`,
  { cwd: root, stdio: 'inherit' }
)

// ncc bundles JS but leaves native addons as external requires.
// We copy their node_modules manually so node.exe can find them at runtime.
import { cpSync } from 'fs'

const nativeModules = ['better-sqlite3', 'sharp', 'node-gyp-build', 'bindings']
for (const mod of nativeModules) {
  const src = join(root, 'node_modules', mod)
  const dest = join(out, 'node_modules', mod)
  if (existsSync(src)) {
    cpSync(src, dest, { recursive: true })
    console.log(`[bundle-server] Copied native module: ${mod}`)
  }
}

// Also copy music-metadata (pure JS but has many sub-deps that ncc may miss)
// ncc handles pure JS fine so this is only needed if you see missing module errors.

console.log(`\n[bundle-server] Done → ${out}`)
