import { Router } from 'express'
import { randomUUID } from 'crypto'
import db from '../db.js'

const router = Router()

router.get('/asset/:assetId', (req, res) => {
  const rows = db.prepare(`SELECT tag FROM asset_tags WHERE asset_id = ? ORDER BY tag`).all(req.params.assetId)
  res.json(rows.map(r => r.tag))
})

router.post('/asset/:assetId', (req, res) => {
  const { tag } = req.body
  if (!tag?.trim()) return res.status(400).json({ error: 'tag required' })
  const normalized = tag.trim().toLowerCase()
  try {
    db.prepare(`INSERT OR IGNORE INTO asset_tags (id, asset_id, tag) VALUES (?, ?, ?)`).run(randomUUID(), req.params.assetId, normalized)
  } catch {}
  const rows = db.prepare(`SELECT tag FROM asset_tags WHERE asset_id = ? ORDER BY tag`).all(req.params.assetId)
  res.json(rows.map(r => r.tag))
})

router.delete('/asset/:assetId/:tag', (req, res) => {
  db.prepare(`DELETE FROM asset_tags WHERE asset_id = ? AND tag = ?`).run(req.params.assetId, req.params.tag)
  const rows = db.prepare(`SELECT tag FROM asset_tags WHERE asset_id = ? ORDER BY tag`).all(req.params.assetId)
  res.json(rows.map(r => r.tag))
})

export default router
