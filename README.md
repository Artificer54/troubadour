# Troubadour

> **⚠️ Work in Progress** — Actively developed and used personally. Features may change or be incomplete.

A self-hosted audio manager for Dungeon Masters. Organize ambient music into **Scenarios**, switch intensity levels on the fly, and trigger sound effects from a customizable button matrix — all running locally, no cloud required.

![WIP](https://img.shields.io/badge/status-work%20in%20progress-orange) ![React](https://img.shields.io/badge/React-18-blue) ![Vite](https://img.shields.io/badge/Vite-6-purple) ![Express](https://img.shields.io/badge/Express-5-lightgrey) ![SQLite](https://img.shields.io/badge/SQLite-local-orange) ![Tailwind](https://img.shields.io/badge/Tailwind-CSS-teal)

---

## Quick Start

```bash
git clone https://github.com/Artificer54/troubadour.git
cd troubadour
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

> The `dev` command starts both the Express API (port 3001) and the Vite dev server (port 5173) together.

---

## Features

- **Scenarios** — Group tracks into named scenes (e.g. "Tavern", "Boss Fight"). Each has five intensity levels: Calm → Tense → Intense → Frantic → Legendary
- **Adaptive Playback** — Switch intensity mid-scene with a configurable crossfade. A spinning disk reflects the current level
- **Smart Shuffle** — Tracks cycle through once before repeating — no awkward early repeats
- **SFX Matrix** — Grid of one-shot sound effect buttons, organized per scenario
- **Multi-Library Support** — Point Troubadour at any folder; it scans and indexes audio without copying files
- **Audio Deduplication** — SHA-256 check prevents duplicate uploads
- **8 Themes** — Dark Fantasy, Arcane, Battlefield, Celestial, Blood Moon, Deep Sea, Sunset, Neon Void — plus fully customizable color presets
- **Remote Access** — Open from a phone or tablet over local WiFi or Tailscale

---

## Production Deployment

Build the app and run it as a persistent server:

```bash
npm run build
npm start
```

The server listens on `http://0.0.0.0:3001` and serves the built frontend. Access it from any browser on your network using the host machine's IP.

### Keep it running with PM2

```bash
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
```

**Windows only** — register as a startup task:
```powershell
npm install -g pm2-windows-startup
pm2-startup install
```

**Mac / Linux** — register as a startup service:
```bash
pm2 startup   # copy and run the printed command, then:
pm2 save
```

### Auto-Updates

Troubadour checks GitHub for new versions every 15 minutes. When an update is available, a banner appears in the app — click **Update Now** and the server updates and restarts itself. No manual commands needed.

See [SETUP.md](SETUP.md) for full deployment instructions, including Windows-specific steps and uninstall.

---

## Configuration

Create a `.env` file in the project root (copy from `.env.example`):

| Variable | Default | Description |
|---|---|---|
| `SERVER_PORT` | `3001` | Port the Express server listens on |
| `DATA_DIR` | project root | Where the SQLite database and uploaded files are stored |

---

## Project Structure

```
troubadour/
├── server/                  # Express API (Node.js)
│   ├── index.js             # App entry, static file serving, error handler
│   ├── db.js                # SQLite setup and schema migrations
│   ├── paths.js             # DATA_DIR resolution
│   └── routes/
│       ├── playlists.js     # Scenarios CRUD
│       ├── assets.js        # Audio file upload, streaming, metadata
│       ├── sfx.js           # SFX panels and buttons
│       ├── libraries.js     # External music library management
│       ├── images.js        # Background image upload and processing
│       └── tags.js          # Asset tag management
├── src/                     # React frontend
│   ├── App.jsx              # Root component
│   ├── components/
│   │   ├── scenario/        # Sidebar, control panel, edit modal
│   │   ├── playlist/        # Track list, add-track modal
│   │   ├── sfx/             # SFX matrix, buttons, panels
│   │   ├── library/         # Library browser and sidebar
│   │   └── ui/              # Shared components (Modal, Settings, etc.)
│   ├── lib/
│   │   ├── audioEngine.js   # Howler.js singleton with crossfade logic
│   │   └── storage.js       # localStorage utility
│   └── store/
│       ├── useAppStore.js   # Zustand root (composes slices)
│       ├── api.js           # Shared fetch wrapper
│       ├── theme.js         # Theme constants and helpers
│       └── slices/          # settingsSlice, audioSlice, playlistSlice, etc.
├── .env.example             # Configuration template
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

Data files (database, uploaded audio, images) live in the project root by default and are gitignored. Set `DATA_DIR` in `.env` to move them elsewhere.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite 6 |
| Styling | Tailwind CSS with CSS-variable theme system |
| State | Zustand (split into slice files) |
| Audio | Howler.js |
| Icons | Lucide React |
| Backend | Express 5 |
| Database | SQLite via better-sqlite3 |

---

## Phone / Tablet Access

The web interface is fully mobile-responsive. Access it over your local network or via [Tailscale](https://tailscale.com) for remote sessions. See **[SETUP.md](SETUP.md)** for step-by-step instructions.

Tap **Add to Home Screen** in your mobile browser for an app-like experience.
