import { Router } from 'express'
import { randomUUID } from 'crypto'
import { readdir, stat } from 'fs/promises'
import { existsSync } from 'fs'
import { join, extname } from 'path'
import { exec } from 'child_process'
import db from '../db.js'
import { COVERS_DIR } from '../paths.js'
import { mkdir, writeFile } from 'fs/promises'

const router = Router()

const AUDIO_EXTS = new Set(['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a', '.opus', '.weba'])

async function extractMetadata(filePath, fileHash) {
  try {
    const { parseFile } = await import('music-metadata')
    const meta = await parseFile(filePath, { skipCovers: false })
    const artist = meta.common.artist ?? null
    const album  = meta.common.album  ?? null
    let cover_art_path = null
    const pic = meta.common.picture?.[0]
    if (pic) {
      await mkdir(COVERS_DIR, { recursive: true }).catch(() => {})
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

function withAssetCount(library) {
  const { count } = db.prepare(`SELECT COUNT(*) as count FROM audio_assets WHERE library_id = ?`).get(library.id)
  return { ...library, enabled: !!library.enabled, asset_count: count }
}


router.get('/', (_req, res) => {
  const rows = db.prepare(`SELECT * FROM music_libraries ORDER BY name`).all()
  res.json(rows.map(withAssetCount))
})

router.post('/', (req, res) => {
  const { name, path: libPath } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'name required' })
  if (!libPath?.trim()) return res.status(400).json({ error: 'path required' })
  if (!existsSync(libPath)) return res.status(400).json({ error: 'Path does not exist on disk' })

  const existing = db.prepare(`SELECT id FROM music_libraries WHERE path = ?`).get(libPath)
  if (existing) return res.status(409).json({ error: 'Library with this path already exists' })

  const id = randomUUID()
  db.prepare(`INSERT INTO music_libraries (id, name, path) VALUES (?, ?, ?)`).run(id, name.trim(), libPath.trim())
  const row = db.prepare(`SELECT * FROM music_libraries WHERE id = ?`).get(id)
  res.json(withAssetCount(row))
})

router.post('/browse-folder', (_req, res) => {
  const ps =
    `Add-Type -AssemblyName System.Windows.Forms; ` +
    `$d = New-Object System.Windows.Forms.FolderBrowserDialog; ` +
    `$d.Description = 'Select a music folder for Troubadour'; ` +
    `$d.ShowNewFolderButton = $true; ` +
    `if ($d.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output $d.SelectedPath }`
  exec(`powershell -NonInteractive -Command "${ps}"`, { timeout: 30000 }, (err, stdout) => {
    if (err) return res.json({ path: null })
    const path = stdout.trim()
    res.json({ path: path || null })
  })
})

router.put('/:id', (req, res) => {
  const { name, enabled } = req.body
  const lib = db.prepare(`SELECT * FROM music_libraries WHERE id = ?`).get(req.params.id)
  if (!lib) return res.status(404).json({ error: 'Not found' })

  db.prepare(`UPDATE music_libraries SET name = ?, enabled = ? WHERE id = ?`).run(
    name?.trim() ?? lib.name,
    enabled !== undefined ? (enabled ? 1 : 0) : lib.enabled,
    req.params.id
  )
  const row = db.prepare(`SELECT * FROM music_libraries WHERE id = ?`).get(req.params.id)
  res.json(withAssetCount(row))
})

router.delete('/:id', (req, res) => {
  // Remove DB records for assets from this library (files on disk are untouched)
  db.prepare(`DELETE FROM audio_assets WHERE library_id = ?`).run(req.params.id)
  db.prepare(`DELETE FROM music_libraries WHERE id = ?`).run(req.params.id)
  res.json({ ok: true })
})

router.post('/:id/scan', async (req, res) => {
  const lib = db.prepare(`SELECT * FROM music_libraries WHERE id = ?`).get(req.params.id)
  if (!lib) return res.status(404).json({ error: 'Not found' })
  if (!existsSync(lib.path)) return res.status(400).json({ error: 'Library path no longer exists on disk' })

  try {
    const files = await readdir(lib.path)
    // Build set of already-registered (storage_path, library_id) pairs
    const existingInLib = new Set(
      db.prepare(`SELECT storage_path FROM audio_assets WHERE library_id = ?`).all(lib.id).map(r => r.storage_path)
    )
    // Also check for files registered in default tracks with the same hash (dedup)
    const existingHashes = new Set(db.prepare(`SELECT file_hash FROM audio_assets`).all().map(r => r.file_hash))

    let added = 0
    for (const filename of files) {
      if (existingInLib.has(filename)) continue
      const ext = extname(filename).toLowerCase()
      if (!AUDIO_EXTS.has(ext)) continue

      const filePath = join(lib.path, filename)
      const stats = await stat(filePath)
      const name = filename.replace(/\.[^.]+$/, '')
      const id = randomUUID()
      const hashKey = `lib:${lib.id}:${filename}`

      if (existingHashes.has(hashKey)) continue

      const { artist, album, cover_art_path } = await extractMetadata(filePath, id)
      db.prepare(`
        INSERT OR IGNORE INTO audio_assets (id, name, storage_path, file_hash, mime_type, file_size, artist, album, cover_art_path, library_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, name, filename, hashKey, 'audio/mpeg', stats.size, artist, album, cover_art_path, lib.id)
      existingHashes.add(hashKey)
      added++
    }

    const allAssets = db.prepare(`SELECT * FROM audio_assets ORDER BY name`).all()
    const tags = db.prepare(`SELECT asset_id, tag FROM asset_tags`).all()
    const tagMap = {}
    for (const t of tags) {
      if (!tagMap[t.asset_id]) tagMap[t.asset_id] = []
      tagMap[t.asset_id].push(t.tag)
    }
    res.json({ added, assets: allAssets.map(r => ({ ...r, tags: tagMap[r.id] ?? [] })) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
