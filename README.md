# Troubadour

A self-hosted audio manager built for Dungeon Masters. Organize ambient music into **Scenarios**, switch between intensity levels on the fly, and trigger sound effects from a customizable button matrix — all running locally with no cloud dependencies.

![React](https://img.shields.io/badge/React-18-blue) ![Vite](https://img.shields.io/badge/Vite-5-purple) ![Express](https://img.shields.io/badge/Express-5-lightgrey) ![SQLite](https://img.shields.io/badge/SQLite-local-orange) ![Tauri](https://img.shields.io/badge/Tauri-2-yellow) ![Tailwind](https://img.shields.io/badge/Tailwind-CSS-teal)

---

## Features

- **Scenarios** — Group tracks into named scenes (e.g. "Tavern", "Boss Fight"). Each scenario has five intensity levels: Calm → Tense → Intense → Frantic → Legendary
- **Adaptive Playback** — Switch intensity levels with a configurable crossfade. A spinning disk visualizer reflects the current intensity
- **Smart Shuffle** — Tracks cycle through once each before repeating; no awkward early repeats
- **SFX Matrix** — A grid of one-shot sound effect buttons, organized into panels per scenario
- **Multi-Library Support** — Point Troubadour at any folder on your PC; it scans and indexes audio files without copying them
- **Audio Deduplication** — SHA-256 hash check prevents uploading duplicate files
- **8 Themes** — Dark Fantasy, Arcane, Battlefield, Celestial, Blood Moon, Deep Sea, Sunset, Neon Void — plus fully customizable color presets
- **Remote Access** — Access from a phone or tablet via local WiFi or Tailscale; no internet required

---

## How to Use It

| Mode | Best for |
|---|---|
| **Windows MSI installer** | DMs who want one-click setup on their own PC |
| **Self-hosted web server** | Running on a home server so any browser on the network can access it |
| **Browser via Tailscale** | Remote sessions, phone/tablet access across different networks |

See **[SETUP.md](SETUP.md)** for step-by-step instructions for each mode.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite 5 |
| Styling | Tailwind CSS with CSS-variable theme system |
| State | Zustand (split into slice files) |
| Audio | Howler.js |
| Icons | Lucide React |
| Backend | Express 5 |
| Database | SQLite via better-sqlite3 |
| Desktop | Tauri 2 (Windows MSI) |
| Server bundling | @vercel/ncc (inlines all JS deps for the Tauri build) |

---

## Getting Started (Development)

### Prerequisites

- Node.js 18+
- Rust + Cargo (only needed for Tauri desktop builds)

### Run locally

```bash
git clone https://github.com/Artificer54/troubadour.git
cd troubadour
npm install
npm run dev
```

Opens two servers:
- Express API on `http://localhost:3001`
- Vite dev server on `http://localhost:5173` (proxies `/api` to Express)

### Build for production (web server)

```bash
npm run build
npm start
```

Serves the built frontend and API from `http://localhost:3001`.

### Build the Windows installer (MSI)

Requires Rust and the Tauri CLI. See [Tauri prerequisites](https://tauri.app/start/prerequisites/).

```bash
npm run tauri:build
```

This will:
1. Copy the current `node.exe` sidecar (`scripts/prepare-sidecar.js`)
2. Bundle the Express server with ncc (`scripts/bundle-server.js`)
3. Build the Tauri app and produce an MSI in `src-tauri/target/release/bundle/msi/`

---

## Project Structure

```
src/
├── components/
│   ├── scenario/       # Sidebar, control panel, edit modal
│   ├── playlist/       # Track list and add-track modal
│   ├── sfx/            # SFX matrix, buttons, panels
│   ├── library/        # Library browser and sidebar
│   └── ui/             # Shared components (Modal, Settings, etc.)
├── lib/
│   ├── audioEngine.js  # Howler.js singleton with crossfade logic
│   └── storage.js      # localStorage utility
├── store/
│   ├── useAppStore.js  # Zustand root (composes slices)
│   └── slices/         # settingsSlice, audioSlice, playlistSlice, etc.
└── App.jsx
server/
├── index.js            # Express entry point
├── db.js               # SQLite setup and migrations
├── paths.js            # Data directory resolution
└── routes/             # assets, playlists, sfx, libraries, images, tags
src-tauri/
├── tauri.conf.json     # Tauri config (bundled resources, updater endpoint)
└── src/lib.rs          # Spawns the Express sidecar in production
scripts/
├── prepare-sidecar.js  # Copies node.exe for bundling
└── bundle-server.js    # Compiles server with ncc for the MSI build
```

---

## Android / Phone

> **The APK build is not supported.**

The server runs on Node.js and cannot execute natively on Android ARM. Use the **browser via Tailscale** instead — open the server URL in Chrome on your phone and tap "Add to Home Screen" for an app-like experience. See [SETUP.md](SETUP.md#android--phone) for details.

---

## Updates

- **Desktop app:** checks GitHub Releases automatically on launch and prompts to install new versions.
- **Self-hosted:** `git pull && npm install && npm run build && pm2 restart troubadour`
