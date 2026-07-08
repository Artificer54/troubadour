# Project Guidelines

## Development Workflow
- **Changelog Automation:** Every time you make an app edit, modify source files, or fix a bug, you must immediately update the `CHANGELOG.md` file in the root directory. Do this as part of your "definition of done" before declaring the task finished.
- **Git Automation:** When you have completed a task, verified the changes, and updated the changelog, you must automatically commit your changes and push them to the remote GitHub repository before ending the session.
- **Readme Automation:** When you complete a new edit, check the 'README.md' file if applicable to stay up to date with the latest changes. Do this as part of your "definition of done" before declaring the task finished.

## Tech Stack & Commands
- **Development Server:** To run the local development server, use `npm run dev`. This starts both the Express API (port 3001) and the Vite frontend (port 5173).
- **Build Command:** To build the project, use `npm run build`.
- **Local Build Requirement:** After completing any task that modifies source files (`src/`, `server/`, `vite.config.js`, `package.json`), you must run `npm run build` in this repo so `dist/` stays current. Do this after committing and before ending the session.

## Production Deployment Sync (Non-Negotiable)
This repo is dev-only. The actual PWA your phone connects to is a separate checkout at `C:\Users\Bperk\troubadour`, run under PM2 (process name `troubadour`, port 3101) alongside an unrelated app (`budget-hero`) on the same PM2 daemon. **After every `git push` to `main` in this session, you must also bring that checkout up to date before ending the session:**
1. `cd C:\Users\Bperk\troubadour` and `git status` — if there are uncommitted local changes, do not discard them; `git stash push -u`, pull, then `git stash pop` and resolve conflicts (ask the user if a conflict resolution isn't obvious — production-only patches have been made directly in that checkout before without ever being pushed).
2. `git pull --ff-only` (or after stashing, per above).
3. `npm install` (full install, not `--omit=dev` — the build needs `vite`, which is a devDependency; `--omit=dev` will break the build).
4. `npm run build`.
5. `pm2 restart troubadour` — restart **by name/id only**, never anything that could touch `budget-hero` or other PM2 apps.
6. Verify the fix actually landed, e.g. `curl -s http://localhost:3101/` and check for the expected content.
- Never run a blanket `Get-Process -Name node | Stop-Process` anywhere on this machine — it kills every PM2-managed production process, not just this app's dev servers. See Server Restart Protocol below for the safe, port-scoped alternative used in dev.

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