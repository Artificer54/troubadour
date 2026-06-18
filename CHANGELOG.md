# Changelog

All notable changes to Troubadour are recorded here.

---

## [Unreleased] — 2026-06-18

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
