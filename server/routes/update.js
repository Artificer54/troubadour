import { Router } from 'express'
import { getUpdateState, applyUpdate } from '../updater.js'

const router = Router()

router.get('/status', (_req, res) => {
  res.json(getUpdateState())
})

router.post('/apply', (_req, res) => {
  res.json({ ok: true, message: 'Update starting — server will restart automatically.' })
  // Slight delay so the response can be sent before process.exit
  setTimeout(applyUpdate, 500)
})

export default router
