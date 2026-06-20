import { Router } from 'express'
import multer from 'multer'
import sharp from 'sharp'
import { join, extname } from 'path'
import { randomUUID } from 'crypto'
import { mkdirSync } from 'fs'
import { unlink, copyFile } from 'fs/promises'
import { existsSync } from 'fs'
import db from '../db.js'
import { IMAGES_DIR } from '../paths.js'

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

async function processImage(origPath, destPath, blur) {
  const sigma = Math.max(0.3, blur) // sharp requires sigma >= 0.3
  await sharp(origPath)
    .blur(sigma)
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
    await processImage(origPath, bgPath, blur)
    res.json({ filename: bgName, original: origName })
  } catch (err) {
    console.error('Image processing failed:', err.message)
    res.status(500).json({ error: 'Image processing failed: ' + err.message })
  }
})

// Reprocess: re-run blur+darkness on the original, replace the processed file
router.post('/reprocess', async (req, res) => {
  const { playlistId, blur, darkness } = req.body
  if (!playlistId) return res.status(400).json({ error: 'playlistId required' })

  const playlist = db.prepare(`SELECT * FROM playlists WHERE id = ?`).get(playlistId)
  if (!playlist) return res.status(404).json({ error: 'Playlist not found' })

  let origName = playlist.background_image_original
  let adoptedOriginal = false

  // Legacy images uploaded before the pipeline had no _orig counterpart.
  // Adopt the current background_image as the original so we can process it.
  if (!origName) {
    const current = playlist.background_image
    if (!current) return res.status(400).json({ error: 'No image stored' })

    const ext = current.match(/\.[^.]+$/)?.[0] ?? '.jpg'
    const uuid = current.replace(/\.[^.]+$/, '')
    origName = `${uuid}_orig${ext}`
    const adoptSrc  = join(IMAGES_DIR, current)
    const adoptDest = join(IMAGES_DIR, origName)

    if (!existsSync(adoptSrc)) return res.status(404).json({ error: 'Image file not found on disk' })
    await copyFile(adoptSrc, adoptDest)
    adoptedOriginal = true
  }

  const origPath = join(IMAGES_DIR, origName)
  const bgName   = origName.replace('_orig', '_bg').replace(/\.[^.]+$/, '.jpg')
  const bgPath   = join(IMAGES_DIR, bgName)

  try {
    await processImage(origPath, bgPath, blur)

    db.prepare(`
      UPDATE playlists SET
        background_image = ?,
        background_image_original = ?,
        bg_blur = ?,
        bg_darkness = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(bgName, origName, blur, darkness, playlistId)

    const updated = db.prepare(`SELECT * FROM playlists WHERE id = ?`).get(playlistId)
    res.json({ ok: true, playlist: updated, bgFile: bgName, adoptedOriginal })
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
