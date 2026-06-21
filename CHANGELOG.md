# Changelog

All notable changes to Troubadour are recorded here.

---

## [Unreleased] — 2026-06-21 (session 13)

### Added
- **Multi-library music support** — Users can register any local folder as a music library via Settings → Libraries. Troubadour scans the folder and makes all audio files available without copying them. Remote clients (phone/tablet) stream audio from all libraries automatically via the server.
- `music_libraries` DB table — stores registered library paths, names, and enabled state.
- `library_id` column on `audio_assets` — links scanned library files back to their source library.
- `GET/POST/PUT/DELETE /api/libraries` and `POST /api/libraries/:id/scan` — full CRUD + per-library rescan endpoint.
- `GET /api/assets/stream/:id` — streams any audio asset (default or library) by ID with full HTTP Range support for seeking; used automatically for library files so arbitrary folder paths never need to be statically mounted.
- **LibraryManager component** — UI panel inside Settings → Libraries showing the built-in upload folder, registered external libraries (with track count, enable/disable toggle, scan button, remove button), and an add-library form.
- **`src/lib/storage.js`** — centralized localStorage utility with a consistent `troubadour-` prefix, replacing 30+ scattered inline `localStorage` calls.
- **`src/store/theme.js`** — extracted all theme constants, `applyTheme`, `applyIntensityColors`, and color helpers into a standalone module to eliminate circular imports.
- **`src/store/api.js`** — shared `api()` fetch wrapper (was duplicated in store).

### Changed
- **Store split into slices** — `useAppStore.js` (was 692 lines) refactored into six focused slice files: `settingsSlice`, `audioSlice`, `playlistSlice`, `assetSlice`, `sfxSlice`, `librarySlice`. All composed back into a single `useAppStore` so no component imports changed.
- **`getTrackUrl` now takes the full asset object** — returns `/api/assets/stream/:id` for library files (streamed) and `/tracks/:filename` for uploaded files (static). This is a transparent internal change; all audio playback and SFX continue to work unchanged.
- `server/db.js` migrations now log unexpected failures instead of silently swallowing all errors.
- `releases/` added to `.gitignore` — build artifacts no longer tracked.
- `NetworkStatusIcon` now uses the `storage` utility instead of a raw `localStorage` call.

### Fixed
- **Orphaned cover art** — deleting an audio asset now also removes its extracted album art from `images/covers/`.
- **Library-file safety** — deleting an asset that came from a user's library removes only the DB record; the original file on disk is untouched.
- **Image input validation** — blur (0–30) and darkness (0–90) are now clamped server-side before being passed to sharp.
- **Global Express error handler** — unhandled async route errors are now caught and returned as `{ error }` JSON instead of crashing or hanging the request.
- Scan endpoint now uses `WHERE library_id IS NULL` so it doesn't re-scan library files when scanning the default tracks folder.
- `library_id` propagated through all nested `audio_assets` JOIN queries (playlists, SFX routes) so the frontend always has enough context to build the correct stream URL.

## [Unreleased] — 2026-06-20 (session 12)

### Added
- **Android APK build** — `npm run tauri -- android build --apk` produces `app-universal-release-unsigned.apk` (63.7 MB) at `src-tauri/gen/android/app/build/outputs/apk/universal/release/`. Install on Android device and set server URL in Settings → Connection to the PC's IP or Tailscale address.
- **Network status icon** — WiFi icon with colored dot (green/amber/red) in the app header. Polls `/api/health` every 10 seconds. Clicking opens a popover showing the current server URL, connection status, step-by-step LAN WiFi setup instructions, and Tailscale setup instructions for cross-network sync.
- **`GET /api/health` endpoint** — lightweight health-check route returning `{ ok: true, ts }` used by the network status indicator.
- **Bundled Node.js sidecar** — `scripts/prepare-sidecar.js` copies the current `node.exe` into `src-tauri/binaries/` before a production build, so the shipped `.exe` is self-contained (no Node.js installation required on end-user machines).
- **`npm run tauri:prebuild` / `npm run tauri:build` scripts** — `tauri:build` automates copying node.exe then invoking `tauri build`.
- **`src-tauri/binaries/` and `src-tauri/target/` added to `.gitignore`** — prevents large build artifacts and the 50 MB node binary from being committed.

## [Unreleased] — 2026-06-20 (session 11)

### Fixed
- **Tauri dev window "refused to connect"** — Tauri was opening the WebView2 window before Vite and Express finished booting. Replaced `beforeDevCommand` with a dedicated `npm run tauri:dev` script that uses `concurrently` + `wait-on` to start both servers and explicitly wait for ports 5173 and 3001 to respond before handing off to `tauri dev`.

## [Unreleased] — 2026-06-20 (session 10)

### Fixed
- **Tauri Rust compile error** — `use tauri::Manager` and `struct ServerProcess` were conditionally compiled for release only, but the `run()` closure referenced them unconditionally. Moved all imports and the struct to unconditional scope; cfg-guarded only the sidecar spawn and shutdown logic.
- **Tauri linker investigation** — diagnosed that the GNU toolchain (`x86_64-pc-windows-gnu`) hits a hard BFD ordinal limit (>65535 exports) when linking Tauri. Added `.cargo/config.toml` documenting the fix: install VS Build Tools via `winget` to enable the MSVC toolchain.
- **`rust-toolchain.toml`** — added to `src-tauri/` pinning the stable MSVC target so `npm run tauri dev` picks the correct toolchain once VS Build Tools are installed.

## [Unreleased] — 2026-06-19 (session 9)

### Added
- **Tauri v2 native app scaffold** — added `src-tauri/` with `Cargo.toml`, `build.rs`, `src/main.rs`, and `src/lib.rs`. In production builds the Rust shell spawns the Express server as a child process and kills it cleanly on exit. Desktop dev mode reuses the existing `npm run dev` workflow.
- **Connection settings tab** — new "Connection" tab in the Settings modal lets users set the server address. Defaults to `http://localhost:3001`; mobile/tablet users enter their PC's local IP (e.g. `http://192.168.1.10:3001`) to use Troubadour as a WiFi remote control.

### Changed
- **Removed Electron** — deleted `electron/` folder and uninstalled `electron` + `electron-builder` packages. Tauri replaces both for desktop and mobile targets.
- **`getApiBase()` helper** — all API and asset URL calls in `useAppStore.js` now go through a single `api()` wrapper that prepends the configured server URL when running inside Tauri. In plain browser mode relative URLs are used unchanged (Vite proxy still works).
- **Express binds to `0.0.0.0`** — server now accepts connections from other devices on the local network, enabling phone/tablet access over WiFi.
- **`vite.config.js`** — removed Electron-specific `base` override; added Tauri-recommended `clearScreen`, `strictPort`, `envPrefix`, and build target settings.

## [Unreleased] — 2026-06-19 (session 8)

### Changed
- **Favicon** — replaced placeholder lute SVG with the custom vinyl-record PNG icon.

### Added
- **Library sidebar** — "Music Library" button in the scenario sidebar now expands the left sidebar (from ~240px to ~420px) into a full library browser, keeping the scenario control panel always visible. Includes seekable preview player, search, tag filters, draggable tracks, and an arrow button to add a track to the current scenario at a chosen intensity.
- **Drag-and-drop from library to scenario** — tracks in the library sidebar can be dragged directly onto the scenario playlist area; the track is added to the currently-viewed intensity. Drop zone highlights gold when a drag is active.
- **Scenario type filter** — three-lines filter icon in the scenario sidebar reveals type-filter pills (All / Scene / Combat / Location) for quickly narrowing the scenario list by type.
- **Music Library panel** — new dedicated view (accessible via "Music Library" entry at the top of the sidebar) showing all audio assets with cover art, artist, album metadata. Includes a seekable preview player (independent of scenario playback), full-text search by name/artist/album, tag filter pills, inline tag management (add/remove tags per track), and "Add to Scenario" popover to assign a track to any scenario/intensity without leaving the library.
- **Song tags** — users can tag audio assets with custom labels (e.g. "angry", "upbeat", "intense"). Tags persist in a new `asset_tags` SQLite table and are displayed as chips on tracks in the library. Tag filter pills appear above the track list when any tags exist.
- **Audio metadata extraction** — artist, album, and embedded cover art are automatically extracted on upload and scan using `music-metadata`. Cover art images are saved to `images/covers/` and served statically. Existing assets can gain metadata by re-scanning.
- **Rich track rows** — tracks in scenario playlists now show a 32×32 cover art thumbnail (fallback to music icon), track name, and artist below it, mirroring how audio players like Spotify display tracks.
- **Click-to-play in scenario playlist** — clicking any track row in the scenario panel now immediately starts playback from that track (replaces the old play-from-random behavior for that click action). Pin/delete buttons still work via their own click targets.
- **Scenario types** — each scenario now has a required type: `scene` (director's clapperboard icon), `combat` (crossed swords icon), or `location` (map pin icon). The type icon appears before the scenario name in the sidebar. Type can be set on creation and changed in the edit modal.
- **Scenario search/filter** — a search input in the sidebar filters the scenario list by name in real time.
- **Tags API** — new `/api/tags/asset/:id` endpoints (GET, POST, DELETE) for managing per-asset tags.
- **`previewEngine`** — lightweight Howler.js singleton for library preview playback, independent of the main `audioEngine` used by scenarios.

### Changed
- **Pin button tooltip** updated from "Start from this track" to "Always start here" to better convey the intent.
- **Scenario creation wizard** now includes a Scenario Type selector as the first step (defaults to Scene).
- **Edit Scenario modal** now includes a Scenario Type selector.
- `GET /api/assets` now returns `tags[]` array on each asset.
- `POST/PUT /api/playlists` now accepts and returns `scenario_type`.
- Playlist tracks in API responses now include `artist`, `album`, `cover_art_path` from the joined audio asset.

---

## [Unreleased] — 2026-06-19 (session 7)

### Changed
- **Darkness is now a live CSS overlay, not baked into the image** — `sharp` now only applies blur to background images. The "Darkness" slider (renamed "Overlay") controls a `rgba(--color-darkbg / opacity)` layer applied at render time in `App.jsx` and `ScenarioControlPanel.jsx`. This means overlay changes are instant with no server round-trip, and the blur/overlay are fully independent.
- **Reprocess no longer fires on overlay-only changes** — `EditScenarioModal` only calls `reprocessBackground` when the blur value changes (or a legacy image needs adopting), since overlay is now CSS-only.
- Existing Zen Garden `_bg.jpg` reprocessed to strip the previously baked-in darkness.

---

## [Unreleased] — 2026-06-19 (session 6)

### Changed
- **Dev server split into two preview configs** — `troubadour-api` (Express, port 3001) and `troubadour` (Vite, port 5173) are now separate launch configs in `.claude/launch.json`. Fixes a bug where the preview tool injected `PORT=5173` into `npm run dev`, causing Express to steal Vite's port and break the API proxy. Express now reads `SERVER_PORT` instead of `PORT`.
- **CLAUDE.md server restart protocol** — Documents the required restart steps (kill node, stop preview, start api then ui) to run after every source edit.

### Fixed
- **Background blur now actually works** — Diagnosed that legacy images (uploaded before the `sharp` pipeline) were stored as plain `uuid.jpg` with no `_orig` counterpart, causing the processed `_bg.jpg` to never be generated. The `/reprocess` endpoint now detects legacy images, copies the file as `_orig`, produces a proper blurred `_bg.jpg`, and updates `background_image` in the DB to point to the processed version.
- **Removed silent fallback on upload failure** — Upload errors now return HTTP 500 with a message instead of silently serving the unblurred original. A user-visible error is shown in the Edit Scenario modal.
- **Edit Scenario modal triggers reprocess for legacy images** — Previously skipped if `background_image_original` was null; now always reprocesses when there is an existing image and the original is missing, so old scenarios get blurred backgrounds on next save.

### Added
- **`panel-frost` CSS utility** — Zero-GPU-cost frosted-glass panel style (subtle border + inset highlight + shadow depth) that pairs with the server-blurred background image. Applied to all `ScenarioControlPanel` sections when a background image is active, replacing the old `bg-midnight/50` solid overlays.

---

## [Unreleased] — 2026-06-19 (session 5)

### Changed
- **Image settings moved into modals** — Blur and darkness sliders now live inside the Create Scenario wizard and Edit Scenario modal, directly below the image preview. On save/create the image is uploaded and processed server-side (via `sharp`) with the chosen values baked in. In Edit modal, if the scenario already has a stored original, adjusting sliders reprocesses from the original on save. Removed the stale image-settings block from Advanced Controls.

### Added
- **Replace button on existing image in Edit modal** — Small "Replace" button overlaid on the preview lets users swap the image without having to clear it first.

---

## [Unreleased] — 2026-06-19 (session 4)

### Added
- **Server-side image processing** — Background images are now blurred and darkened by the server (using `sharp`) at upload time rather than relying on CSS filters. The original file is preserved as `*_orig.*`; the processed version `*_bg.jpg` is what gets displayed.
- **Background blur & darkness sliders** — Advanced Controls now shows "Background Image" sliders (Blur 0–30px, Darkness 0–90%) when the selected scenario has a background image. Adjusting either slider debounces 600ms then re-processes the original on the server and hot-swaps the image in the browser using `updated_at` as a cache-buster.
- **`bg_blur` / `bg_darkness` / `background_image_original` DB columns** — Added via runtime migrations. Existing scenarios without originals gracefully skip the reprocess controls.

### Fixed
- **Splash screen pill shape** — Changed pill corners from `rounded-xl` (square-ish) to `rounded-full` (fully capsule-shaped).
- **Background image not displaying** — SQLite's `datetime('now')` produces timestamps with a space (e.g. `"2026-06-19 10:30:00"`). When interpolated unencoded into a CSS `background-image: url(...)` cache-buster param, the space broke the CSS value and the browser silently skipped the image. Fixed by wrapping `updated_at` in `encodeURIComponent` in both `App.jsx` and `ScenarioControlPanel.jsx`.
- **Image controls always hidden** — `AdvancedControls` required `background_image_original` to show the blur/darkness sliders, but that field was never saved (the PUT route ignored it). Changed the `hasBg` guard to only require `background_image`. The reprocess endpoint still checks for `background_image_original` gracefully — re-uploading will populate it going forward.
- **PUT route not saving image metadata** — `PUT /api/playlists/:id` was silently dropping `background_image_original`, `bg_blur`, and `bg_darkness`. Fixed to persist all four image fields.

---

## [Unreleased] — 2026-06-19 (session 3)

### Fixed
- **Splash screen title** — Replaced text-shadow-only approach with a dark semi-transparent pill (`rgba(8,8,16,0.72)`) behind the title and subtitle, with a matching box-shadow halo so it bleeds cleanly into the disk. Both "TROUBADOUR" and "TTRPG Audio Manager" are now clearly legible against the spinning disk at any color.
- **Background image animation stutter** — Removed all `backdrop-filter: blur` from `ScenarioControlPanel` and the main `App` layout. `backdrop-blur` is GPU-expensive and was the root cause of stutter when a scenario background image was active. Panels now use solid semi-transparent `bg-midnight/*` backgrounds instead, which has no compositing cost.

---

## [Unreleased] — 2026-06-19 (session 2)

### Added
- **Library folder workflow** — "Open Library Folder" and "Scan for New Files" buttons in AddTrackModal and the scenario wizard. Users can copy audio files directly into the `tracks/` directory and scan to register them without uploading through the browser. Server-side routes `POST /api/assets/open-folder` and `POST /api/assets/scan` power this.
- **Upload demoted to fallback** — FileUpload is now collapsed under an "Upload files directly" toggle in AddTrackModal and the scenario creation wizard. Library-first workflow is the default.

### Fixed
- **Splash screen text legibility** — Added a dark drop-shadow to "TROUBADOUR" and "TTRPG Audio Manager" text so they stand out from the spinning disk behind them.
- **Intensity tab bug** — Clicking intensity tabs no longer triggers "no tracks" error and blocked the tab from switching. Tabs now switch the view (and track list) independently of playback; play button starts the selected intensity.
- **Intensity colors in wizard** — Scenario creation wizard now reads intensity colors from the user's settings (custom presets, etc.) instead of hardcoded Tailwind blue/yellow/orange classes.
- **Performance: RAF loop** — Progress bar animation loop now stops when playback is paused or stopped, instead of running at 60fps continuously.

---

## [Unreleased] — 2026-06-19

### Added
- **Scenario creation wizard** — New multi-step modal replaces the single-form dialog. Step 1 collects name, background image, and intensity count (now buttons, not a slider). Steps 2–N let you pre-assign tracks to each intensity level with search and toggle-style selection. Final step shows a summary before creation.
- **Background image per scenario** — Scenarios can have a background image (PNG/JPG/WEBP, up to 10MB) set during creation or via the edit modal. When active, the image appears behind the UI with a frosted glass / backdrop-blur effect on all panels.
- **Frosted glass UI** — When a scenario with a background image is selected, panels switch to semi-transparent backgrounds with `backdrop-filter: blur` for a polished layered look.
- **Pinned start track** — Hovering a track in the intensity list reveals a pin icon. Clicking it sets that track as the first to play when starting that intensity. Smart shuffle continues after. Pin persists across sessions via localStorage. Click again to toggle off.
- **Scaled intensity buttons** — Intensity buttons now stretch equally across the full panel width (`flex-1`) rather than wrapping — 3 intensities = each takes 1/3, etc.
- **Splash screen** — On first page load, a full-screen title screen appears showing a large spinning disk (in the last-played intensity color) with the TROUBADOUR logo overlaid. A random fun welcome message and fake loading line display beneath. Auto-dismisses after ~3 seconds or click anywhere to skip.
- **Image upload server route** — New `server/routes/images.js` serving `/api/images/upload`. Images saved to `./images/` directory and served at `/images/*`.
- **DB migration** — `background_image TEXT` column added to `playlists` table via runtime migration.

### Changed
- **Scenario edit modal** — Added background image upload/remove field alongside name and description.
- **Intensity switch** — Saves last-played intensity index to localStorage for use by the splash screen disk color.

---

## [Unreleased] — 2026-06-18

### Changed
- **Self-hosted refactor: Supabase → SQLite + Express** — Removed all Supabase and Vercel dependencies. The app now runs entirely on Windows with no cloud services required.
  - **Auth removed** — Eliminated login screen, `AuthGate.jsx`, session middleware, and the Supabase keep-alive pinger. App launches directly into single-user mode.
  - **SQLite database** — Added `better-sqlite3`; schema auto-initializes in `troubador.db` on first run, mirroring all prior tables (playlists, tracks, audio assets, SFX panels/buttons).
  - **Local file storage** — Audio uploads now save to `./tracks/` on disk and are served at `/tracks/*`. No signed URLs or cloud bucket needed.
  - **Express API server** — New `server/` directory with `index.js` (entry point), `db.js` (SQLite setup), and REST routes for assets, playlists, and SFX. Serves the built SPA in production.
  - **Dev workflow** — `npm run dev` runs Express (port 3001) + Vite (port 5173) concurrently with proxy. `npm run build && npm start` for production. Compatible with PM2 (`pm2 start server/index.js --name troubador`).



### Added
- **README.md** — Project overview, feature list, tech stack, and local setup instructions.

### Fixed
- **Playing glow animation hardcoded to gold** — `pulse-glow` keyframes used a hardcoded `rgba(212,175,55,...)` value instead of the theme's `--color-accent` variable. Replaced with `rgb(var(--color-accent) / ...)` so the glow on the play button, disk, and indicator dots follows the active theme's accent color.
- **Intensity button text, border, and playing dot not using custom colors** — Dynamic CSS injected by `applyIntensityColors` was being overridden by static `index.css` rules due to specificity/load order. Added `!important` to `color`, `border-color`, and `background` in the dynamic style block so custom intensity colors always apply correctly to the active button's text, outline, and indicator dot.
- **Theme system not applying on page load** — Added an inline `<script>` to `index.html` that reads the saved theme from `localStorage` and sets the `data-theme` attribute on `<html>` before React mounts. This eliminates the flash of Dark Fantasy colors on every load.
- **Theme `useEffect` not reactive** — Changed the `App.jsx` theme effect dependency from `[]` (mount-only) to `[activeTheme]` so CSS variables are re-synced whenever the active theme changes.
- **Intensity button text and border color not changing** — `ScenarioControlPanel` was using hardcoded Tailwind classes (`text-blue-400`, `bg-yellow-400`, etc.) for active intensity buttons instead of the dynamic `intensity-${i}` CSS classes. Replaced with `intensity-${i}` so text color, border color, and background dot all respond to custom intensity color settings.
- **`intensity-${i}-bg-dot` had no CSS defaults** — Added fallback CSS rules in `index.css` so the playing indicator dot has the correct color even before `applyIntensityColors` runs.
- **`ThemeSelector.jsx` was dead code** — The component was never imported anywhere in the app. Removed from sidebar (where it caused a blank-page crash) and left as a standalone component. Theme switching is handled exclusively by Settings → Theme.

### Added
- **4 new built-in themes** — Blood Moon (deep red + orange), Deep Sea (teal + emerald), Sunset (orange + red), Neon Void (neon cyan + neon purple). Total is now 8 preset themes.
- **Named custom presets** — The single "Custom" color slot is replaced with a full preset system. Users can:
  - Create multiple named presets
  - Rename presets (click the pen icon or press Enter)
  - Delete presets
  - Edit each preset's 6 color variables inline
  - Switch between presets instantly
  - Legacy single custom theme is auto-migrated to a preset named "My Theme" on first load
- **Reset button for intensity colors** — Made the existing reset button more prominent (now styled as a border button instead of a plain text link).

### Changed
- `THEMES` export in `useAppStore.js` is now an alias for `PRESET_THEMES`. Both names work so existing code doesn't break.
- Custom theme state (`customThemeColors`, `setCustomThemeColor`, `resetCustomTheme`) replaced by the preset API (`customPresets`, `createCustomPreset`, `deleteCustomPreset`, `renameCustomPreset`, `updateCustomPresetColor`, `applyCustomPreset`).
- Settings modal theme grid is now 4 columns (was 3) to accommodate 8 preset themes.
- Intensity tab description updated to reflect that intensity colors now correctly affect button text and border, not just the glow.

---

## [0.1.0] — 2026-06-18 (Initial build)

### Added
- 3-column desktop layout: Scenario Sidebar | Scenario Control Panel | SFX Matrix
- Scenario management (create, rename, delete, select)
- Multi-intensity playlist system (1–5 intensity levels per scenario)
- Smart shuffle — tracks play once per cycle before repeating
- Configurable crossfade (default 1.5 s)
- SFX panels and buttons with multi-file random playback
- SFX button duplication (reuses asset references)
- Audio deduplication via SHA-256 hash check before upload
- Supabase auth, PostgreSQL storage, and Storage bucket for audio files
- Supabase keep-alive ping every 3 days to prevent free-tier hibernation
- 4 built-in themes: Dark Fantasy, Arcane, Battlefield, Celestial
- Custom theme color editor
- Intensity glow color customization
- Scenario disk with spin animation and intensity-colored glow
- Seekable playback progress bar
- Volume sliders for playlist and SFX independently
- Mobile tabbed layout
