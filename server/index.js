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

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const PORT = process.env.SERVER_PORT ?? 3001

const app = express()
app.use(cors())
app.use(express.json())

// API routes
app.use('/api/assets', assetsRouter)
app.use('/api/playlists', playlistsRouter)
app.use('/api/sfx', sfxRouter)
app.use('/api/images', imagesRouter)
app.use('/api/tags', tagsRouter)

// Serve uploaded files
app.use('/tracks', express.static(join(ROOT, 'tracks')))
app.use('/images', express.static(join(ROOT, 'images')))

// Serve built SPA in production
const distDir = join(ROOT, 'dist')
if (existsSync(distDir)) {
  app.use(express.static(distDir))
  app.use((_req, res) => res.sendFile(join(distDir, 'index.html')))
}

app.listen(PORT, () => {
  console.log(`Troubadour server running on http://localhost:${PORT}`)
})
