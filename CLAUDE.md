# Project Guidelines

## Development Workflow
- **Changelog Automation:** Every time you make an app edit, modify source files, or fix a bug, you must immediately update the `CHANGELOG.md` file in the root directory. Do this as part of your "definition of done" before declaring the task finished.
- **Git Automation:** When you have completed a task, verified the changes, and updated the changelog, you must automatically commit your changes and push them to the remote GitHub repository before ending the session.
- **Readme Automation:** When you complete a new edit, check the 'README.md' file if applicable to stay up to date with the latest changes. Do this as part of your "definition of done" before declaring the task finished.

## Tech Stack & Commands
- **Development Server:** To run the local development server, use `npm run dev`. This starts both the Express API (port 3001) and the Vite frontend (port 5173).
- **Build Command:** To build the project, use `npm run build`.
- **Production Build Requirement:** After completing any task that modifies source files (`src/`, `server/`, `vite.config.js`, `package.json`), you must run `npm run build` so the production build on port 3001 stays current. Do this after committing and before ending the session.

## Server Restart Protocol
After every edit to any source file, you must restart the dev servers before verifying or declaring the task done:
1. Kill only the processes bound to the dev ports (3001, 5173) — **never** kill node processes by name. This machine also runs a PM2 daemon managing always-on production instances of this app and others (e.g. budget-hero); killing node by name takes all of them down too.
   ```powershell
   try { Get-NetTCPConnection -LocalPort 3001,5173 -ErrorAction Stop | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } } catch {}
   exit 0
   ```
   (the try/catch plus trailing `exit 0` are required: nothing listening on these ports is the normal case, not a failure, and must not abort the rest of the protocol)
2. Stop any preview server: call `preview_stop` for each running server ID
3. Start the API server: `preview_start` with name `troubadour-api` (Express on port 3001)
4. Start the UI server: `preview_start` with name `troubadour` (Vite on port 5173)
5. Verify in the preview screenshot that the app loads and the change is visible
6. If PM2 (`pm2 list`) ever comes up empty or missing an app that should be running, restore it with `pm2 resurrect` (restores from the last `pm2 save` snapshot) rather than manually re-starting individual apps.

## Changelog Format
- Group changes under standard headers: `### Added`, `### Changed`, or `### Fixed`.
- Keep descriptions concise, focusing on *what* changed and *why*.

## File Security (Non-Negotiable)
Before committing or pushing any changes, always verify:
- **No secrets in source files** — no API keys, tokens, passwords, or credentials hardcoded anywhere in `src/`, `server/`, or config files. All secrets must live in `.env` (which is gitignored).
- **`.gitignore` is respected** — confirm `.env`, `*.db`, `*.db-shm`, `*.db-wal`, `images/`, `tracks/`, and `releases/` are not staged or tracked.
- **No personal data** — no real user paths (e.g. `C:\Users\ActualName\...`), email addresses, or machine-specific config in committed files.
- **No large binaries** — do not commit executables, compiled native addons (`.node` files), or build artifacts outside the expected gitignored directories.
- If you discover a secret was previously committed, **stop and alert the user immediately** rather than proceeding with other work. The secret must be rotated before the repo is made public.