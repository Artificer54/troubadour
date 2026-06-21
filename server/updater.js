import { execSync } from 'child_process'

const REPO = 'Artificer54/troubadour'
const POLL_MINUTES = parseInt(process.env.UPDATE_POLL_MINUTES ?? '15', 10)
const GITHUB_API = `https://api.github.com/repos/${REPO}/commits/main`

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

export function startUpdatePoller() {
  // Initial check after 30s (let server finish starting up)
  setTimeout(checkForUpdates, 30_000)
  setInterval(checkForUpdates, POLL_MINUTES * 60 * 1000)
  console.log(`[updater] Polling GitHub every ${POLL_MINUTES} minutes`)
}

export function getUpdateState() {
  return { ...state }
}

export function applyUpdate() {
  console.log('[updater] Applying update...')
  execSync('git pull', { stdio: 'inherit' })
  execSync('npm install --omit=dev', { stdio: 'inherit' })
  execSync('npm run build', { stdio: 'inherit' })
  console.log('[updater] Update complete — restarting...')
  // PM2 will restart the process after exit
  process.exit(0)
}
