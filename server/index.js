import express from 'express'
import cors from 'cors'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'
import assetsRouter from './routes/assets.js'
import playlistsRouter from './routes/playlists.js'
import sfxRouter from './routes/sfx.js'
import imagesRouter from './routes/images.js'
import tagsRouter from './routes/tags.js'
import librariesRouter from './routes/libraries.js'
import updateRouter from './routes/update.js'
import environmentsRouter from './routes/environments.js'
import { DATA_ROOT } from './paths.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const PORT = process.env.SERVER_PORT ?? 3001

const app = express()
app.use(cors())
app.use(express.json())

// Health check for network status indicator
app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }))

// API routes
app.use('/api/assets', assetsRouter)
app.use('/api/playlists', playlistsRouter)
app.use('/api/sfx', sfxRouter)
app.use('/api/images', imagesRouter)
app.use('/api/tags', tagsRouter)
app.use('/api/libraries', librariesRouter)
app.use('/api/update', updateRouter)
app.use('/api/environments', environmentsRouter)

// Serve uploaded files (default tracks dir only; library files are streamed via /api/assets/stream/:id)
app.use('/tracks', express.static(join(DATA_ROOT, 'tracks')))
app.use('/images', express.static(join(DATA_ROOT, 'images')))

// Serve built SPA in production
const distDir = join(ROOT, 'dist')
if (existsSync(distDir)) {
  app.use(express.static(distDir))
  app.use((_req, res) => res.sendFile(join(distDir, 'index.html')))
}

// Global error handler — Express 5 propagates async throws here automatically
app.use((err, _req, res, _next) => {
  console.error(err.stack ?? err.message)
  res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Troubadour server running on http://0.0.0.0:${PORT}`)
})
