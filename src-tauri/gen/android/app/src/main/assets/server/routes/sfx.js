import { Router } from 'express'
import { randomUUID } from 'crypto'
import db from '../db.js'

const router = Router()

function getPanelsWithNested() {
  const panels = db.prepare(`SELECT * FROM sfx_panels ORDER BY position`).all()
  const buttons = db.prepare(`SELECT * FROM sfx_buttons ORDER BY position`).all()
  const files = db.prepare(`
    SELECT sbf.*, a.id as a_id, a.name as a_name, a.storage_path, a.file_hash, a.mime_type, a.duration_sec, a.file_size
    FROM sfx_button_files sbf JOIN audio_assets a ON a.id = sbf.asset_id
  `).all()

  return panels.map(p => ({
    ...p,
    sfx_buttons: buttons
      .filter(b => b.panel_id === p.id)
      .map(b => ({
        ...b,
        sfx_button_files: files
          .filter(f => f.button_id === b.id)
          .map(f => ({
            id: f.id, button_id: f.button_id, asset_id: f.asset_id, created_at: f.created_at,
            audio_assets: { id: f.a_id, name: f.a_name, storage_path: f.storage_path, file_hash: f.file_hash, mime_type: f.mime_type, duration_sec: f.duration_sec, file_size: f.file_size },
          })),
      })),
  }))
}

function getButtonsWithNested() {
  const buttons = db.prepare(`SELECT b.*, p.id as p_id, p.name as p_name, p.panel_type FROM sfx_buttons b LEFT JOIN sfx_panels p ON p.id = b.panel_id ORDER BY b.name`).all()
  const files = db.prepare(`
    SELECT sbf.*, a.id as a_id, a.name as a_name, a.storage_path, a.file_hash, a.mime_type, a.duration_sec, a.file_size
    FROM sfx_button_files sbf JOIN audio_assets a ON a.id = sbf.asset_id
  `).all()

  return buttons.map(b => ({
    id: b.id, panel_id: b.panel_id, name: b.name, color: b.color, icon: b.icon, position: b.position, created_at: b.created_at,
    sfx_panels: b.p_id ? { id: b.p_id, name: b.p_name, panel_type: b.panel_type } : null,
    sfx_button_files: files
      .filter(f => f.button_id === b.id)
      .map(f => ({
        id: f.id, button_id: f.button_id, asset_id: f.asset_id, created_at: f.created_at,
        audio_assets: { id: f.a_id, name: f.a_name, storage_path: f.storage_path, file_hash: f.file_hash, mime_type: f.mime_type, duration_sec: f.duration_sec, file_size: f.file_size },
      })),
  }))
}

// Panels
router.get('/panels', (_req, res) => res.json(getPanelsWithNested()))

router.post('/panels', (req, res) => {
  const { panel_type, name } = req.body
  const pos = db.prepare(`SELECT COUNT(*) as c FROM sfx_panels WHERE panel_type = ?`).get(panel_type ?? 'global')
  const id = randomUUID()
  db.prepare(`INSERT INTO sfx_panels (id, panel_type, name, position) VALUES (?, ?, ?, ?)`)
    .run(id, panel_type ?? 'global', name, pos.c)
  const row = db.prepare(`SELECT * FROM sfx_panels WHERE id = ?`).get(id)
  res.json({ ...row, sfx_buttons: [] })
})

router.delete('/panels/:id', (req, res) => {
  db.prepare(`DELETE FROM sfx_panels WHERE id = ?`).run(req.params.id)
  res.json({ ok: true })
})

// Buttons
router.get('/buttons', (_req, res) => res.json(getButtonsWithNested()))

router.post('/buttons', (req, res) => {
  const { panel_id, name, color, asset_ids } = req.body
  const pos = db.prepare(`SELECT COUNT(*) as c FROM sfx_buttons WHERE panel_id = ?`).get(panel_id)
  const id = randomUUID()
  db.prepare(`INSERT INTO sfx_buttons (id, panel_id, name, color, position) VALUES (?, ?, ?, ?, ?)`)
    .run(id, panel_id ?? null, name, color ?? '#d4af37', pos.c)

  if (asset_ids?.length) {
    const ins = db.prepare(`INSERT OR IGNORE INTO sfx_button_files (id, button_id, asset_id) VALUES (?, ?, ?)`)
    for (const assetId of asset_ids) ins.run(randomUUID(), id, assetId)
  }

  res.json({ panels: getPanelsWithNested(), buttons: getButtonsWithNested() })
})

router.put('/buttons/:id', (req, res) => {
  const { name, color, icon } = req.body
  db.prepare(`UPDATE sfx_buttons SET name = ?, color = ?, icon = ? WHERE id = ?`)
    .run(name, color, icon ?? null, req.params.id)
  res.json({ panels: getPanelsWithNested(), buttons: getButtonsWithNested() })
})

router.delete('/buttons/:id', (req, res) => {
  db.prepare(`DELETE FROM sfx_buttons WHERE id = ?`).run(req.params.id)
  res.json({ ok: true })
})

router.post('/buttons/:id/duplicate', (req, res) => {
  const { target_panel_id, new_name } = req.body
  const src = db.prepare(`SELECT * FROM sfx_buttons WHERE id = ?`).get(req.params.id)
  if (!src) return res.status(404).json({ error: 'Not found' })

  const newId = randomUUID()
  const pos = db.prepare(`SELECT COUNT(*) as c FROM sfx_buttons WHERE panel_id = ?`).get(target_panel_id ?? src.panel_id)
  db.prepare(`INSERT INTO sfx_buttons (id, panel_id, name, color, icon, position) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(newId, target_panel_id ?? src.panel_id, new_name ?? `${src.name} (copy)`, src.color, src.icon, pos.c)

  const srcFiles = db.prepare(`SELECT * FROM sfx_button_files WHERE button_id = ?`).all(req.params.id)
  const ins = db.prepare(`INSERT OR IGNORE INTO sfx_button_files (id, button_id, asset_id) VALUES (?, ?, ?)`)
  for (const f of srcFiles) ins.run(randomUUID(), newId, f.asset_id)

  res.json({ panels: getPanelsWithNested(), buttons: getButtonsWithNested() })
})

router.post('/buttons/:id/files', (req, res) => {
  const { asset_id } = req.body
  db.prepare(`INSERT OR IGNORE INTO sfx_button_files (id, button_id, asset_id) VALUES (?, ?, ?)`)
    .run(randomUUID(), req.params.id, asset_id)
  res.json({ panels: getPanelsWithNested(), buttons: getButtonsWithNested() })
})

export default router
