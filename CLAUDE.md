# Project Guidelines

## Development Workflow
- **Changelog Automation:** Every time you make an app edit, modify source files, or fix a bug, you must immediately update the `CHANGELOG.md` file in the root directory. Do this as part of your "definition of done" before declaring the task finished.
- **Git Automation:** When you have completed a task, verified the changes, and updated the changelog, you must automatically commit your changes and push them to the remote GitHub repository before ending the session.

## Tech Stack & Commands
- **Development Server:** To run the local development server, use `npm run dev`. This starts both the Express API (port 3001) and the Vite frontend (port 5173).
- **Build Command:** To build the project, use `npm run build`.

## Server Restart Protocol
After every edit to any source file, you must restart the dev servers before verifying or declaring the task done:
1. Kill all running node processes: `Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force` (PowerShell)
2. Stop any preview server: call `preview_stop` for each running server ID
3. Start the API server: `preview_start` with name `troubadour-api` (Express on port 3001)
4. Start the UI server: `preview_start` with name `troubadour` (Vite on port 5173)
5. Verify in the preview screenshot that the app loads and the change is visible

## Changelog Format
- Group changes under standard headers: `### Added`, `### Changed`, or `### Fixed`.
- Keep descriptions concise, focusing on *what* changed and *why*.