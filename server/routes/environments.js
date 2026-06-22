import { Router } from 'express'
import { randomUUID } from 'crypto'
import { existsSync } from 'fs'
import { copyFile } from 'fs/promises'
import { join } from 'path'
import sharp from 'sharp'
import db from '../db.js'
import { IMAGES_DIR } from '../paths.js'

const router = Router()

function getEnvironmentsWithNested() {
  const envs = db.prepare(`SELECT * FROM environments ORDER BY position, created_at`).all()

  const tracks = db.prepare(`
    SELECT et.*, a.name as a_name, a.storage_path, a.mime_type, a.duration_sec, a.library_id as a_library_id
    FROM environment_tracks et
    JOIN audio_assets a ON a.id = et.asset_id
    ORDER BY et.position
  `).all()

  const presets = db.prepare(`SELECT * FROM environment_presets ORDER BY position, created_at`).all()

  const presetTracks = db.prepare(`SELECT * FROM environment_preset_tracks`).all()

  return envs.map(env => ({
    ...env,
    environment_tracks: tracks
      .filter(t => t.environment_id === env.id)
      .map(t => ({
        id: t.id,
        environment_id: t.environment_id,
        asset_id: t.asset_id,
        position: t.position,
        created_at: t.created_at,
        audio_assets: {
          id: t.asset_id,
          name: t.a_name,
          storage_path: t.storage_path,
          mime_type: t.mime_type,
          duration_sec: t.duration_sec,
          library_id: t.a_library_id ?? null,
        },
      })),
    environment_presets: presets
      .filter(p => p.environment_id === env.id)
      .map(p => ({
        ...p,
        preset_tracks: presetTracks
          .filter(pt => pt.preset_id === p.id)
          .map(pt => ({ ...pt })),
      })),
  }))
}

// List all environments
router.get('/', (_req, res) => res.json(getEnvironmentsWithNested()))

// Create environment
router.post('/', (req, res) => {
  const { name, color } = req.body
  if (!name) return res.status(400).json({ error: 'name required' })
  const pos = db.prepare(`SELECT COUNT(*) as c FROM environments`).get().c
  const id = randomUUID()
  db.prepare(`INSERT INTO environments (id, name, color, position) VALUES (?, ?, ?, ?)`)
    .run(id, name, color ?? '#7c9885', pos)
  res.json(getEnvironmentsWithNested().find(e => e.id === id))
})

// Update environment (name / color / image)
router.put('/:id', (req, res) => {
  const { name, color, background_image, background_image_original, bg_blur, bg_darkness } = req.body
  const env = db.prepare(`SELECT * FROM environments WHERE id = ?`).get(req.params.id)
  if (!env) return res.status(404).json({ error: 'Not found' })
  db.prepare(`
    UPDATE environments SET
      name = ?, color = ?,
      background_image = ?,
      background_image_original = ?,
      bg_blur = ?,
      bg_darkness = ?
    WHERE id = ?
  `).run(
    name ?? env.name,
    color ?? env.color,
    background_image !== undefined ? background_image : env.background_image,
    background_image_original !== undefined ? background_image_original : env.background_image_original,
    bg_blur !== undefined ? bg_blur : env.bg_blur,
    bg_darkness !== undefined ? bg_darkness : env.bg_darkness,
    req.params.id,
  )
  res.json(getEnvironmentsWithNested().find(e => e.id === req.params.id))
})

// Reprocess environment background image with new blur
router.post('/:id/reprocess-bg', async (req, res) => {
  const { blur, darkness } = req.body
  const env = db.prepare(`SELECT * FROM environments WHERE id = ?`).get(req.params.id)
  if (!env) return res.status(404).json({ error: 'Not found' })

  let origName = env.background_image_original
  if (!origName) {
    const current = env.background_image
    if (!current) return res.status(400).json({ error: 'No image stored' })
    const ext = current.match(/\.[^.]+$/)?.[0] ?? '.jpg'
    const uuid = current.replace(/\.[^.]+$/, '')
    origName = `${uuid}_orig${ext}`
    const adoptSrc = join(IMAGES_DIR, current)
    const adoptDest = join(IMAGES_DIR, origName)
    if (!existsSync(adoptSrc)) return res.status(404).json({ error: 'Image file not found' })
    await copyFile(adoptSrc, adoptDest)
  }

  const origPath = join(IMAGES_DIR, origName)
  const bgName = origName.replace('_orig', '_bg').replace(/\.[^.]+$/, '.jpg')
  const bgPath = join(IMAGES_DIR, bgName)
  const sigma = Math.max(0.3, blur ?? 12)

  try {
    await sharp(origPath).blur(sigma).jpeg({ quality: 85 }).toFile(bgPath)
    db.prepare(`
      UPDATE environments SET background_image = ?, background_image_original = ?, bg_blur = ?, bg_darkness = ?
      WHERE id = ?
    `).run(bgName, origName, blur ?? 12, darkness ?? 55, req.params.id)
    res.json(getEnvironmentsWithNested().find(e => e.id === req.params.id))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Delete environment
router.delete('/:id', (req, res) => {
  db.prepare(`DELETE FROM environments WHERE id = ?`).run(req.params.id)
  res.json({ ok: true })
})

// Add track to environment
router.post('/:id/tracks', (req, res) => {
  const { assetId } = req.body
  if (!assetId) return res.status(400).json({ error: 'assetId required' })
  const pos = db.prepare(`SELECT COUNT(*) as c FROM environment_tracks WHERE environment_id = ?`).get(req.params.id).c
  const id = randomUUID()
  try {
    db.prepare(`INSERT INTO environment_tracks (id, environment_id, asset_id, position) VALUES (?, ?, ?, ?)`)
      .run(id, req.params.id, assetId, pos)
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Track already in environment' })
    throw e
  }
  res.json(getEnvironmentsWithNested().find(e => e.id === req.params.id))
})

// Remove track from environment
router.delete('/:id/tracks/:trackId', (req, res) => {
  db.prepare(`DELETE FROM environment_tracks WHERE id = ? AND environment_id = ?`)
    .run(req.params.trackId, req.params.id)
  res.json(getEnvironmentsWithNested().find(e => e.id === req.params.id))
})

// List presets for an environment
router.get('/:id/presets', (req, res) => {
  const env = getEnvironmentsWithNested().find(e => e.id === req.params.id)
  if (!env) return res.status(404).json({ error: 'Not found' })
  res.json(env.environment_presets)
})

// Create preset
router.post('/:id/presets', (req, res) => {
  const { name, fadeDuration, tracks } = req.body
  if (!name) return res.status(400).json({ error: 'name required' })
  const pos = db.prepare(`SELECT COUNT(*) as c FROM environment_presets WHERE environment_id = ?`).get(req.params.id).c
  const presetId = randomUUID()
  db.prepare(`INSERT INTO environment_presets (id, environment_id, name, position, fade_duration) VALUES (?, ?, ?, ?, ?)`)
    .run(presetId, req.params.id, name, pos, fadeDuration ?? 1500)

  if (tracks?.length) {
    const ins = db.prepare(`INSERT OR REPLACE INTO environment_preset_tracks (id, preset_id, environment_track_id, volume, active) VALUES (?, ?, ?, ?, ?)`)
    for (const t of tracks) {
      ins.run(randomUUID(), presetId, t.environmentTrackId, t.volume ?? 1.0, t.active ? 1 : 0)
    }
  }

  res.json(getEnvironmentsWithNested().find(e => e.id === req.params.id))
})

// Update preset
router.put('/:id/presets/:presetId', (req, res) => {
  const { name, fadeDuration, tracks } = req.body
  const preset = db.prepare(`SELECT * FROM environment_presets WHERE id = ? AND environment_id = ?`).get(req.params.presetId, req.params.id)
  if (!preset) return res.status(404).json({ error: 'Not found' })

  db.prepare(`UPDATE environment_presets SET name = ?, fade_duration = ? WHERE id = ?`)
    .run(name ?? preset.name, fadeDuration ?? preset.fade_duration, req.params.presetId)

  if (tracks) {
    db.prepare(`DELETE FROM environment_preset_tracks WHERE preset_id = ?`).run(req.params.presetId)
    const ins = db.prepare(`INSERT INTO environment_preset_tracks (id, preset_id, environment_track_id, volume, active) VALUES (?, ?, ?, ?, ?)`)
    for (const t of tracks) {
      ins.run(randomUUID(), req.params.presetId, t.environmentTrackId, t.volume ?? 1.0, t.active ? 1 : 0)
    }
  }

  res.json(getEnvironmentsWithNested().find(e => e.id === req.params.id))
})

// Delete preset
router.delete('/:id/presets/:presetId', (req, res) => {
  db.prepare(`DELETE FROM environment_presets WHERE id = ? AND environment_id = ?`)
    .run(req.params.presetId, req.params.id)
  res.json(getEnvironmentsWithNested().find(e => e.id === req.params.id))
})

export default router
