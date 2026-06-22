import { Router } from 'express'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { getUpdateState, applyUpdate, checkForUpdatesNow } from '../updater.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distPath = join(__dirname, '..', '..', 'dist')

const router = Router()

router.get('/status', (_req, res) => {
  res.json(getUpdateState())
})

router.post('/check', async (_req, res) => {
  const result = await checkForUpdatesNow()
  res.json(result)
})

router.post('/apply', (_req, res) => {
  const isProd = !!process.env.pm_id || existsSync(distPath)
  if (isProd) {
    // Send response before the process exits (PM2) or self-restarts (standalone)
    res.json({ ok: true, message: 'Update starting — server will restart automatically.' })
    setTimeout(applyUpdate, 500)
  } else {
    // Dev mode: applyUpdate() returns without exiting
    try {
      const result = applyUpdate()
      res.json({
        ok: true,
        devMode: true,
        message: result?.devMode
          ? 'Pulled latest changes. Please restart your dev server to apply the update.'
          : 'Update applied.',
      })
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message })
    }
  }
})

export default router
