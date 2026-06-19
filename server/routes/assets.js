import { Router } from 'express'
import multer from 'multer'
import { join, dirname, extname } from 'path'
import { fileURLToPath } from 'url'
import { unlink, readdir, stat } from 'fs/promises'
import { randomUUID } from 'crypto'
import { exec } from 'child_process'
import db from '../db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TRACKS_DIR = join(__dirname, '..', '..', 'tracks')

const storage = multer.diskStorage({
  destination: TRACKS_DIR,
  filename: (_req, file, cb) => cb(null, randomUUID() + extname(file.originalname)),
})
const upload = multer({ storage })

const router = Router()

router.get('/', (_req, res) => {
  const rows = db.prepare(`SELECT * FROM audio_assets ORDER BY name`).all()
  res.json(rows)
})

router.post('/upload', upload.single('file'), (req, res) => {
  const { file, body } = req
  if (!file) return res.status(400).json({ error: 'No file provided' })

  const { file_hash, duration_sec } = body

  // Dedup by hash
  if (file_hash) {
    const existing = db.prepare(`SELECT * FROM audio_assets WHERE file_hash = ?`).get(file_hash)
    if (existing) {
      // Remove the just-uploaded duplicate
      unlink(file.path).catch(() => {})
      return res.json(existing)
    }
  }

  const id = randomUUID()
  const name = file.originalname.replace(/\.[^.]+$/, '')
  const storage_path = file.filename

  db.prepare(`
    INSERT INTO audio_assets (id, name, storage_path, file_hash, mime_type, duration_sec, file_size)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, storage_path, file_hash ?? id, file.mimetype, duration_sec ? parseFloat(duration_sec) : null, file.size)

  const asset = db.prepare(`SELECT * FROM audio_assets WHERE id = ?`).get(id)
  res.json(asset)
})

const AUDIO_EXTS = new Set(['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a', '.opus', '.weba'])

router.post('/scan', async (_req, res) => {
  try {
    const files = await readdir(TRACKS_DIR)
    const existing = new Set(db.prepare(`SELECT storage_path FROM audio_assets`).all().map((r) => r.storage_path))
    let added = 0
    for (const filename of files) {
      if (existing.has(filename)) continue
      const ext = extname(filename).toLowerCase()
      if (!AUDIO_EXTS.has(ext)) continue
      const filePath = join(TRACKS_DIR, filename)
      const stats = await stat(filePath)
      const name = filename.replace(/\.[^.]+$/, '')
      const id = randomUUID()
      db.prepare(`INSERT OR IGNORE INTO audio_assets (id, name, storage_path, file_hash, mime_type, file_size) VALUES (?, ?, ?, ?, ?, ?)`)
        .run(id, name, filename, filename, 'audio/mpeg', stats.size)
      added++
    }
    const rows = db.prepare(`SELECT * FROM audio_assets ORDER BY name`).all()
    res.json({ added, assets: rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/open-folder', (_req, res) => {
  const platform = process.platform
  const cmd = platform === 'win32'
    ? `explorer "${TRACKS_DIR}"`
    : platform === 'darwin'
    ? `open "${TRACKS_DIR}"`
    : `xdg-open "${TRACKS_DIR}"`
  exec(cmd)
  res.json({ ok: true, path: TRACKS_DIR })
})

router.delete('/:id', (req, res) => {
  const asset = db.prepare(`SELECT * FROM audio_assets WHERE id = ?`).get(req.params.id)
  if (!asset) return res.status(404).json({ error: 'Not found' })

  db.prepare(`DELETE FROM audio_assets WHERE id = ?`).run(req.params.id)
  unlink(join(TRACKS_DIR, asset.storage_path)).catch(() => {})
  res.json({ ok: true })
})

export default router
