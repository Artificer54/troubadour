import { Router } from 'express'
import { randomUUID } from 'crypto'
import db from '../db.js'

const router = Router()

router.get('/', (_req, res) => {
  const playlists = db.prepare(`SELECT * FROM playlists ORDER BY created_at DESC`).all()
  const tracks = db.prepare(`
    SELECT pt.*, a.id as a_id, a.name as a_name, a.storage_path, a.file_hash, a.mime_type, a.duration_sec, a.file_size
    FROM playlist_tracks pt
    JOIN audio_assets a ON a.id = pt.asset_id
  `).all()

  const result = playlists.map(p => ({
    ...p,
    has_intensities: !!p.has_intensities,
    playlist_tracks: tracks
      .filter(t => t.playlist_id === p.id)
      .map(t => ({
        id: t.id,
        playlist_id: t.playlist_id,
        asset_id: t.asset_id,
        intensity_level: t.intensity_level,
        position: t.position,
        created_at: t.created_at,
        audio_assets: {
          id: t.a_id,
          name: t.a_name,
          storage_path: t.storage_path,
          file_hash: t.file_hash,
          mime_type: t.mime_type,
          duration_sec: t.duration_sec,
          file_size: t.file_size,
        },
      })),
  }))
  res.json(result)
})

router.post('/', (req, res) => {
  const { name, has_intensities, intensity_count } = req.body
  if (!name) return res.status(400).json({ error: 'name required' })
  const id = randomUUID()
  db.prepare(`
    INSERT INTO playlists (id, name, has_intensities, intensity_count)
    VALUES (?, ?, ?, ?)
  `).run(id, name, has_intensities ? 1 : 0, intensity_count ?? 3)
  const row = db.prepare(`SELECT * FROM playlists WHERE id = ?`).get(id)
  res.json({ ...row, has_intensities: !!row.has_intensities, playlist_tracks: [] })
})

router.put('/:id', (req, res) => {
  const { name, description, background_image, background_image_original, bg_blur, bg_darkness } = req.body
  const current = db.prepare(`SELECT * FROM playlists WHERE id = ?`).get(req.params.id)
  if (!current) return res.status(404).json({ error: 'Not found' })
  db.prepare(`
    UPDATE playlists SET
      name = ?,
      description = ?,
      background_image = ?,
      background_image_original = ?,
      bg_blur = ?,
      bg_darkness = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    name ?? current.name,
    description !== undefined ? description : current.description,
    background_image !== undefined ? background_image : current.background_image,
    background_image_original !== undefined ? background_image_original : current.background_image_original,
    bg_blur !== undefined ? bg_blur : current.bg_blur,
    bg_darkness !== undefined ? bg_darkness : current.bg_darkness,
    req.params.id
  )
  const row = db.prepare(`SELECT * FROM playlists WHERE id = ?`).get(req.params.id)
  res.json({ ...row, has_intensities: !!row.has_intensities })
})

router.delete('/:id', (req, res) => {
  db.prepare(`DELETE FROM playlists WHERE id = ?`).run(req.params.id)
  res.json({ ok: true })
})

router.post('/:id/tracks', (req, res) => {
  const { asset_id, intensity_level } = req.body
  const pos = db.prepare(
    `SELECT COUNT(*) as c FROM playlist_tracks WHERE playlist_id = ? AND intensity_level = ?`
  ).get(req.params.id, intensity_level ?? 0)

  const id = randomUUID()
  db.prepare(`
    INSERT INTO playlist_tracks (id, playlist_id, asset_id, intensity_level, position)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, req.params.id, asset_id, intensity_level ?? 0, pos.c)

  const row = db.prepare(`
    SELECT pt.*, a.id as a_id, a.name as a_name, a.storage_path, a.file_hash, a.mime_type, a.duration_sec, a.file_size
    FROM playlist_tracks pt JOIN audio_assets a ON a.id = pt.asset_id WHERE pt.id = ?
  `).get(id)

  res.json({
    id: row.id,
    playlist_id: row.playlist_id,
    asset_id: row.asset_id,
    intensity_level: row.intensity_level,
    position: row.position,
    created_at: row.created_at,
    audio_assets: {
      id: row.a_id, name: row.a_name, storage_path: row.storage_path,
      file_hash: row.file_hash, mime_type: row.mime_type,
      duration_sec: row.duration_sec, file_size: row.file_size,
    },
  })
})

router.delete('/tracks/:trackId', (req, res) => {
  db.prepare(`DELETE FROM playlist_tracks WHERE id = ?`).run(req.params.trackId)
  res.json({ ok: true })
})

export default router
