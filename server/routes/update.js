import { Router } from 'express'
import { getUpdateState, applyUpdate, checkForUpdatesNow } from '../updater.js'

const router = Router()

router.get('/status', (_req, res) => {
  res.json(getUpdateState())
})

router.post('/check', async (_req, res) => {
  const result = await checkForUpdatesNow()
  res.json(result)
})

router.post('/apply', (_req, res) => {
  // In PM2/production: send response first, then apply (process.exit needs response sent)
  // In dev mode: applyUpdate() returns { devMode: true } without exiting
  const isPM2 = process.env.pm_id !== undefined
  if (isPM2) {
    res.json({ ok: true, message: 'Update starting — server will restart automatically.' })
    setTimeout(applyUpdate, 500)
  } else {
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
