import { Router } from 'express'
import multer from 'multer'
import sharp from 'sharp'
import { join, dirname, extname } from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'
import { mkdirSync } from 'fs'
import { unlink } from 'fs/promises'
import db from '../db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const IMAGES_DIR = join(__dirname, '..', '..', 'images')
mkdirSync(IMAGES_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: IMAGES_DIR,
  filename: (_req, file, cb) => cb(null, randomUUID() + '_orig' + extname(file.originalname)),
})
const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Not an image'))
  },
  limits: { fileSize: 10 * 1024 * 1024 },
})

async function processImage(origPath, destPath, blur, darkness) {
  const sigma = Math.max(0.3, blur) // sharp requires sigma >= 0.3
  const alpha = Math.round(Math.min(100, Math.max(0, darkness)) / 100 * 255)

  const base = sharp(origPath)
  const meta = await base.metadata()
  const w = meta.width
  const h = meta.height

  const overlay = await sharp({
    create: { width: w, height: h, channels: 4, background: { r: 0, g: 0, b: 0, alpha } },
  }).png().toBuffer()

  await sharp(origPath)
    .blur(sigma)
    .composite([{ input: overlay, blend: 'over' }])
    .jpeg({ quality: 85 })
    .toFile(destPath)
}

const router = Router()

// Upload: save original, generate processed version, return both filenames
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image provided' })

  const blur     = parseInt(req.body.blur     ?? '12')
  const darkness = parseInt(req.body.darkness ?? '55')
  const origName = req.file.filename
  const bgName   = origName.replace('_orig', '_bg').replace(/\.[^.]+$/, '.jpg')
  const origPath = join(IMAGES_DIR, origName)
  const bgPath   = join(IMAGES_DIR, bgName)

  try {
    await processImage(origPath, bgPath, blur, darkness)
    res.json({ filename: bgName, original: origName })
  } catch (err) {
    // If processing fails (e.g. unusual format), fall back to original
    console.error('Image processing failed:', err.message)
    res.json({ filename: origName, original: origName })
  }
})

// Reprocess: re-run blur+darkness on the original, replace the processed file
router.post('/reprocess', async (req, res) => {
  const { playlistId, blur, darkness } = req.body
  if (!playlistId) return res.status(400).json({ error: 'playlistId required' })

  const playlist = db.prepare(`SELECT * FROM playlists WHERE id = ?`).get(playlistId)
  if (!playlist) return res.status(404).json({ error: 'Playlist not found' })

  const origName = playlist.background_image_original
  if (!origName) return res.status(400).json({ error: 'No original image stored' })

  const origPath = join(IMAGES_DIR, origName)
  const bgName   = origName.replace('_orig', '_bg').replace(/\.[^.]+$/, '.jpg')
  const bgPath   = join(IMAGES_DIR, bgName)

  try {
    await processImage(origPath, bgPath, blur, darkness)

    db.prepare(`UPDATE playlists SET bg_blur = ?, bg_darkness = ?, updated_at = datetime('now') WHERE id = ?`)
      .run(blur, darkness, playlistId)

    const updated = db.prepare(`SELECT * FROM playlists WHERE id = ?`).get(playlistId)
    res.json({ ok: true, playlist: updated, bgFile: bgName })
  } catch (err) {
    console.error('Reprocess failed:', err.message)
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:filename', async (req, res) => {
  const safeName = req.params.filename.replace(/[^a-zA-Z0-9._-]/g, '')
  try { await unlink(join(IMAGES_DIR, safeName)) } catch {}
  res.json({ ok: true })
})

export default router
