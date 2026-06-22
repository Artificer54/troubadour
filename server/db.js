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

  CREATE TABLE IF NOT EXISTS music_libraries (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    path       TEXT NOT NULL UNIQUE,
    enabled    INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS asset_tags (
    id       TEXT PRIMARY KEY,
    asset_id TEXT NOT NULL REFERENCES audio_assets(id) ON DELETE CASCADE,
    tag      TEXT NOT NULL,
    UNIQUE(asset_id, tag)
  );

  CREATE TABLE IF NOT EXISTS environments (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    color      TEXT DEFAULT '#7c9885',
    position   INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS environment_tracks (
    id             TEXT PRIMARY KEY,
    environment_id TEXT NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    asset_id       TEXT NOT NULL REFERENCES audio_assets(id) ON DELETE CASCADE,
    position       INTEGER DEFAULT 0,
    created_at     TEXT DEFAULT (datetime('now')),
    UNIQUE(environment_id, asset_id)
  );

  CREATE TABLE IF NOT EXISTS environment_presets (
    id             TEXT PRIMARY KEY,
    environment_id TEXT NOT NULL REFERENCES environments(id) ON DELETE CASCADE,
    name           TEXT NOT NULL,
    position       INTEGER DEFAULT 0,
    fade_duration  INTEGER DEFAULT 1500,
    created_at     TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS environment_preset_tracks (
    id                   TEXT PRIMARY KEY,
    preset_id            TEXT NOT NULL REFERENCES environment_presets(id) ON DELETE CASCADE,
    environment_track_id TEXT NOT NULL REFERENCES environment_tracks(id) ON DELETE CASCADE,
    volume               REAL DEFAULT 1.0,
    active               INTEGER DEFAULT 1,
    UNIQUE(preset_id, environment_track_id)
  );
`)

// Migrations — log unexpected failures but swallow idempotent "duplicate column" errors
function migrate(sql, label) {
  try {
    db.exec(sql)
  } catch (e) {
    if (!e.message.includes('duplicate column name')) {
      console.warn(`Migration "${label}" skipped:`, e.message)
    }
  }
}

migrate(`ALTER TABLE playlists ADD COLUMN background_image TEXT`, 'playlists.background_image')
migrate(`ALTER TABLE playlists ADD COLUMN background_image_original TEXT`, 'playlists.background_image_original')
migrate(`ALTER TABLE playlists ADD COLUMN bg_blur INTEGER DEFAULT 12`, 'playlists.bg_blur')
migrate(`ALTER TABLE playlists ADD COLUMN bg_darkness INTEGER DEFAULT 55`, 'playlists.bg_darkness')
migrate(`ALTER TABLE playlists ADD COLUMN scenario_type TEXT NOT NULL DEFAULT 'scene'`, 'playlists.scenario_type')
migrate(`ALTER TABLE audio_assets ADD COLUMN artist TEXT`, 'audio_assets.artist')
migrate(`ALTER TABLE audio_assets ADD COLUMN album TEXT`, 'audio_assets.album')
migrate(`ALTER TABLE audio_assets ADD COLUMN cover_art_path TEXT`, 'audio_assets.cover_art_path')
migrate(`ALTER TABLE audio_assets ADD COLUMN library_id TEXT REFERENCES music_libraries(id) ON DELETE SET NULL`, 'audio_assets.library_id')
migrate(`ALTER TABLE audio_assets ADD COLUMN hidden INTEGER NOT NULL DEFAULT 0`, 'audio_assets.hidden')
migrate(`ALTER TABLE environments ADD COLUMN background_image TEXT`, 'environments.background_image')
migrate(`ALTER TABLE environments ADD COLUMN background_image_original TEXT`, 'environments.background_image_original')
migrate(`ALTER TABLE environments ADD COLUMN bg_blur INTEGER DEFAULT 12`, 'environments.bg_blur')
migrate(`ALTER TABLE environments ADD COLUMN bg_darkness INTEGER DEFAULT 55`, 'environments.bg_darkness')
migrate(`ALTER TABLE audio_assets ADD COLUMN track_type TEXT NOT NULL DEFAULT 'music'`, 'audio_assets.track_type')

export default db
