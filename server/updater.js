import { execSync, spawn } from 'child_process'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DIST = join(ROOT, 'dist')

const REPO = 'Artificer54/troubadour'
const GITHUB_API = `https://api.github.com/repos/${REPO}/commits/main`

// PM2 sets pm_id on managed processes; dist/ existing means we're serving a production build
const isUnderPM2 = process.env.pm_id !== undefined
const isProduction = isUnderPM2 || existsSync(DIST)

let state = {
  currentSha: null,
  remoteSha: null,
  updateAvailable: false,
  lastChecked: null,
  error: null,
}

function getLocalSha() {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
  } catch {
    return null
  }
}

async function fetchRemoteSha() {
  const res = await fetch(GITHUB_API, {
    headers: { 'User-Agent': 'troubadour-updater' },
  })
  if (!res.ok) throw new Error(`GitHub API returned ${res.status}`)
  const data = await res.json()
  return data.sha ?? null
}

async function checkForUpdates() {
  try {
    state.currentSha = getLocalSha()
    state.remoteSha = await fetchRemoteSha()
    state.updateAvailable = !!(state.currentSha && state.remoteSha && state.currentSha !== state.remoteSha)
    state.lastChecked = new Date().toISOString()
    state.error = null
    if (state.updateAvailable) {
      console.log(`[updater] Update available: ${state.currentSha?.slice(0, 7)} → ${state.remoteSha?.slice(0, 7)}`)
    }
  } catch (err) {
    state.error = err.message
    state.lastChecked = new Date().toISOString()
  }
}

export async function checkForUpdatesNow() {
  await checkForUpdates()
  return { ...state }
}

export function getUpdateState() {
  return { ...state }
}

export function applyUpdate() {
  console.log('[updater] Applying update...')
  execSync('git pull', { stdio: 'inherit' })

  if (isProduction) {
    execSync('npm install --omit=dev', { stdio: 'inherit' })
    execSync('npm run build', { stdio: 'inherit' })
    console.log('[updater] Update complete — restarting...')

    if (isUnderPM2) {
      // PM2 will restart the process after exit
      process.exit(0)
    } else {
      // Production without PM2: spawn a fresh server instance then exit
      const child = spawn(process.execPath, ['server/index.js'], {
        detached: true,
        stdio: 'ignore',
        cwd: ROOT,
        env: process.env,
      })
      child.unref()
      process.exit(0)
    }
  } else {
    // Dev mode (no dist/, no PM2): pull and install all deps but don't build or exit.
    // User needs to restart their dev server manually.
    execSync('npm install', { stdio: 'inherit' })
    console.log('[updater] Dev mode: pulled latest. Restart your dev server to apply changes.')
    return { devMode: true }
  }
}
