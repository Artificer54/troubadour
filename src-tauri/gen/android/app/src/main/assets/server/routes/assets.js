import { Router } from 'express'
import multer from 'multer'
import { join, extname } from 'path'
import { unlink, readdir, stat, mkdir, writeFile } from 'fs/promises'
import { randomUUID } from 'crypto'
import { exec } from 'child_process'
import db from '../db.js'
import { TRACKS_DIR, COVERS_DIR } from '../paths.js'

// Ensure directories exist
mkdir(TRACKS_DIR, { recursive: true }).catch(() => {})
mkdir(COVERS_DIR, { recursive: true }).catch(() => {})

async function extractMetadata(filePath, fileHash) {
  try {
    const { parseFile } = await import('music-metadata')
    const meta = await parseFile(filePath, { skipCovers: false })
    const artist = meta.common.artist ?? null
    const album  = meta.common.album  ?? null
    let cover_art_path = null
    const pic = meta.common.picture?.[0]
    if (pic) {
      const ext = pic.format?.includes('png') ? 'png' : 'jpg'
      const fname = `${fileHash}.${ext}`
      await writeFile(join(COVERS_DIR, fname), pic.data)
      cover_art_path = fname
    }
    return { artist, album, cover_art_path }
  } catch {
    return { artist: null, album: null, cover_art_path: null }
  }
}

const storage = multer.diskStorage({
  destination: TRACKS_DIR,
  filename: (_req, file, cb) => cb(null, randomUUID() + extname(file.originalname)),
})
const upload = multer({ storage })

const router = Router()

router.get('/', (_req, res) => {
  const rows = db.prepare(`SELECT * FROM audio_assets ORDER BY name`).all()
  const tags = db.prepare(`SELECT asset_id, tag FROM asset_tags`).all()
  const tagMap = {}
  for (const t of tags) {
    if (!tagMap[t.asset_id]) tagMap[t.asset_id] = []
    tagMap[t.asset_id].push(t.tag)
  }
  res.json(rows.map(r => ({ ...r, tags: tagMap[r.id] ?? [] })))
})

router.post('/upload', upload.single('file'), async (req, res) => {
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
  const hash = file_hash ?? id

  const { artist, album, cover_art_path } = await extractMetadata(file.path, hash)

  db.prepare(`
    INSERT INTO audio_assets (id, name, storage_path, file_hash, mime_type, duration_sec, file_size, artist, album, cover_art_path)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, storage_path, hash, file.mimetype, duration_sec ? parseFloat(duration_sec) : null, file.size, artist, album, cover_art_path)

  const asset = db.prepare(`SELECT * FROM audio_assets WHERE id = ?`).get(id)
  res.json({ ...asset, tags: [] })
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
      const { artist, album, cover_art_path } = await extractMetadata(filePath, filename)
      db.prepare(`INSERT OR IGNORE INTO audio_assets (id, name, storage_path, file_hash, mime_type, file_size, artist, album, cover_art_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(id, name, filename, filename, 'audio/mpeg', stats.size, artist, album, cover_art_path)
      added++
    }
    const rows = db.prepare(`SELECT * FROM audio_assets ORDER BY name`).all()
    const tags = db.prepare(`SELECT asset_id, tag FROM asset_tags`).all()
    const tagMap = {}
    for (const t of tags) {
      if (!tagMap[t.asset_id]) tagMap[t.asset_id] = []
      tagMap[t.asset_id].push(t.tag)
    }
    res.json({ added, assets: rows.map(r => ({ ...r, tags: tagMap[r.id] ?? [] })) })
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
