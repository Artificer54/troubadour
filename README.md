# Troubadour

A web-based audio manager built for Dungeon Masters. Troubadour lets you organize ambient music into **Scenarios**, switch between intensity levels on the fly, and trigger sound effects from a customizable button matrix — all synced to the cloud.

![React](https://img.shields.io/badge/React-18-blue) ![Vite](https://img.shields.io/badge/Vite-5-purple) ![Supabase](https://img.shields.io/badge/Supabase-backend-green) ![Tailwind](https://img.shields.io/badge/Tailwind-CSS-teal)

---

## Features

- **Scenarios** — Group tracks into named scenes (e.g. "Tavern", "Boss Fight"). Each scenario has five intensity levels: Calm → Tense → Intense → Frantic → Legendary
- **Adaptive Playback** — Switch intensity levels with a configurable crossfade (default 1.5s). A spinning disk visualizer reflects the current intensity
- **Smart Shuffle** — Tracks cycle through once each before repeating; no awkward early repeats
- **SFX Matrix** — A grid of one-shot sound effect buttons, organized into panels per scenario
- **Audio Deduplication** — SHA-256 hash check prevents uploading duplicate files
- **4 Themes** — Dark Fantasy, Arcane, Battlefield, Celestial (saved to localStorage)
- **Cloud Sync** — Auth + storage via Supabase; your library follows you anywhere

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite 5 |
| Styling | Tailwind CSS with CSS-variable theme system |
| State | Zustand |
| Audio | Howler.js |
| Icons | Lucide React |
| Backend | Supabase (Auth, PostgreSQL, Storage) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/Artificer54/troubadour.git
   cd troubadour
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   Fill in your Supabase project URL and anon key in `.env`.

4. **Set up the database**
   - Open your Supabase project → SQL Editor
   - Run the contents of `supabase/schema.sql`

5. **Create the storage bucket**
   - In your Supabase project → Storage
   - Create a bucket named **`audio`**

6. **Run the dev server**
   ```bash
   npm run dev
   ```

---

## Project Structure

```
src/
├── components/
│   ├── scenario/       # Sidebar, control panel, edit modal
│   ├── playlist/       # Track list and add-track modal
│   ├── sfx/            # SFX matrix, buttons, panels
│   └── ui/             # Shared components (Modal, VolumeSlider, etc.)
├── lib/
│   ├── audioEngine.js  # Howler.js singleton with crossfade logic
│   ├── supabase.js     # Supabase client
│   └── supabaseKeepAlive.js
├── store/
│   └── useAppStore.js  # Zustand global state
└── App.jsx
supabase/
└── schema.sql          # Full DB schema
```

---

## Building for Production

```bash
npm run build
```

Output goes to `dist/`. Deploy to any static host (Netlify, Vercel, etc.) — point it at the `dist` folder.
