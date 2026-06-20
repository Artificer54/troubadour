import Database from 'better-sqlite3'
import { join } from 'path'
import { DATA_ROOT } from './paths.js'

const DB_PATH = join(DATA_ROOT, 'troubador.db')

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS audio_assets (
    id           TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_hash    TEXT NOT NULL UNIQUE,
    mime_type    TEXT,
    duration_sec REAL,
    file_size    INTEGER,
    created_at   TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS playlists (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    description     TEXT,
    has_intensities INTEGER DEFAULT 1,
    intensity_count INTEGER DEFAULT 3,
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS playlist_tracks (
    id              TEXT PRIMARY KEY,
    playlist_id     TEXT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    asset_id        TEXT NOT NULL REFERENCES audio_assets(id) ON DELETE CASCADE,
    intensity_level INTEGER DEFAULT 0,
    position        INTEGER DEFAULT 0,
    created_at      TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sfx_panels (
    id         TEXT PRIMARY KEY,
    panel_type TEXT NOT NULL DEFAULT 'global',
    name       TEXT NOT NULL,
    position   INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sfx_buttons (
    id         TEXT PRIMARY KEY,
    panel_id   TEXT REFERENCES sfx_panels(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    color      TEXT DEFAULT '#d4af37',
    icon       TEXT,
    position   INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sfx_button_files (
    id         TEXT PRIMARY KEY,
    button_id  TEXT NOT NULL REFERENCES sfx_buttons(id) ON DELETE CASCADE,
    asset_id   TEXT NOT NULL REFERENCES audio_assets(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE (button_id, asset_id)
  );
`)

// Migrations for columns added after initial schema
try { db.exec(`ALTER TABLE playlists ADD COLUMN background_image TEXT`) } catch {}
try { db.exec(`ALTER TABLE playlists ADD COLUMN background_image_original TEXT`) } catch {}
try { db.exec(`ALTER TABLE playlists ADD COLUMN bg_blur INTEGER DEFAULT 12`) } catch {}
try { db.exec(`ALTER TABLE playlists ADD COLUMN bg_darkness INTEGER DEFAULT 55`) } catch {}
try { db.exec(`ALTER TABLE playlists ADD COLUMN scenario_type TEXT NOT NULL DEFAULT 'scene'`) } catch {}
try { db.exec(`ALTER TABLE audio_assets ADD COLUMN artist TEXT`) } catch {}
try { db.exec(`ALTER TABLE audio_assets ADD COLUMN album TEXT`) } catch {}
try { db.exec(`ALTER TABLE audio_assets ADD COLUMN cover_art_path TEXT`) } catch {}

db.exec(`
  CREATE TABLE IF NOT EXISTS asset_tags (
    id       TEXT PRIMARY KEY,
    asset_id TEXT NOT NULL REFERENCES audio_assets(id) ON DELETE CASCADE,
    tag      TEXT NOT NULL,
    UNIQUE(asset_id, tag)
  );
`)

export default db
