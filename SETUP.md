# Troubadour — Setup & Deployment Guide

> **New to self-hosting?** This guide assumes no prior experience. Every command is copy-pasteable.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [First-Time Setup](#first-time-setup)
3. [Keep It Running with PM2](#keep-it-running-with-pm2)
4. [Auto-Updates](#auto-updates)
5. [Remote Access with Tailscale](#remote-access-with-tailscale)
6. [Uninstall](#uninstall)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you start, install these two programs:

| Program | Why you need it | Download |
|---|---|---|
| **Node.js 18+** | Runs the Troubadour server | [nodejs.org](https://nodejs.org) — choose the **LTS** version |
| **Git** | Downloads the app and gets updates | [git-scm.com](https://git-scm.com/downloads) |

After installing, open a terminal (PowerShell on Windows, Terminal on Mac/Linux) and verify both installed:

```
node --version
git --version
```

Both commands should print a version number. If either says "command not found", restart your terminal and try again.

---

## First-Time Setup

Open a terminal, then run these commands **one at a time**:

```bash
git clone https://github.com/Artificer54/troubadour.git
cd Troubador
npm install
npm run build
```

That's it — the app is now built. To run it:

```bash
npm start
```

Open your browser and go to **http://localhost:3001**. You should see Troubadour.

> **Stop the server:** Press `Ctrl + C` in the terminal. Note: this stops the server. To keep it running permanently, use PM2 (next section).

### Optional: Custom Configuration

Copy the example config file and edit it if needed:

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**Mac / Linux:**
```bash
cp .env.example .env
```

Open `.env` in any text editor. Available options:

| Variable | Default | Description |
|---|---|---|
| `SERVER_PORT` | `3001` | Port the server listens on |
| `DATA_DIR` | project folder | Where the database and your uploaded files are stored |
| `UPDATE_POLL_MINUTES` | `15` | How often to check GitHub for updates |

---

## Keep It Running with PM2

PM2 is a process manager that keeps Troubadour running in the background — it starts automatically when your PC boots and restarts the app if it ever crashes.

### Install PM2

```bash
npm install -g pm2
```

### Windows — Extra Step Required

On Windows, PM2 needs a helper package to register as a startup task:

```powershell
npm install -g pm2-windows-startup
pm2-startup install
```

### Start Troubadour with PM2

```bash
pm2 start ecosystem.config.cjs
pm2 save
```

Check it's running:

```bash
pm2 status
```

You should see `troubadour` with status **online**.

### Mac / Linux — Startup on Boot

```bash
pm2 startup
```

This prints a command — copy it and run it exactly as shown (it will start with `sudo`). Then:

```bash
pm2 save
```

### Starting Fresh (Clear Old PM2 State)

If you ran PM2 previously and hit errors, clean up first:

```bash
pm2 delete troubadour
pm2 save
```

**Windows only** — if you already ran `pm2-startup install` and want to redo it:
```powershell
pm2-startup remove
pm2-startup install
```

Then re-run the setup steps above.

---

## Auto-Updates

Once Troubadour is running, it checks GitHub for new versions every 15 minutes automatically. **You don't need to do anything.**

When an update is available, a banner appears at the top of the app. Click **Update Now** — the server downloads the update, rebuilds the app, and restarts itself. Your data (database, uploaded tracks, images) is never touched during an update.

### Configure the Check Interval

To change how often updates are checked, set `UPDATE_POLL_MINUTES` in your `.env` file:

```
UPDATE_POLL_MINUTES=30
```

Then restart the server: `pm2 restart troubadour`

---

## Remote Access with Tailscale

Tailscale lets you access Troubadour from your phone, tablet, or any device — even when you're away from home — without opening your router to the internet. It's free for personal use.

### Setup

1. Install [Tailscale](https://tailscale.com/download) on the PC running Troubadour.
2. Install Tailscale on your phone or tablet.
3. Sign in with the **same account** on both.
4. Find your PC's Tailscale IP in the Tailscale app — it starts with `100.`.
5. On your phone, open `http://100.x.x.x:3001` in a browser.

### Add to Home Screen (App-Like Experience)

1. Open the Troubadour URL in Chrome or Safari on your phone.
2. Tap **Share → Add to Home Screen** (iOS) or **Menu → Add to Home Screen** (Android).
3. The icon appears on your home screen and launches full-screen.

---

## Uninstall

To fully remove Troubadour from your system:

**1. Stop the server and remove it from PM2:**
```bash
pm2 delete troubadour
pm2 save
```

**2. Remove PM2 auto-start:**

Windows:
```powershell
pm2-startup remove
```

Mac / Linux:
```bash
pm2 unstartup
```

**3. Uninstall PM2 (optional):**
```bash
npm uninstall -g pm2 pm2-windows-startup
```

**4. Back up your data first (optional but recommended):**

Your database and uploaded files are in the project folder (or wherever `DATA_DIR` points). Copy these before deleting:
- `troubador.db` — your scenarios, SFX layouts, and track metadata
- `tracks/` — uploaded audio files
- `images/` — uploaded background images

**5. Delete the project folder:**

Windows:
```powershell
Remove-Item -Recurse -Force .\Troubador
```

Mac / Linux:
```bash
rm -rf Troubador
```

**6. Remove Node.js (optional):**

If you don't use Node.js for anything else, you can uninstall it. See the official guide: [nodejs.org/en/download/package-manager](https://nodejs.org/en/download/package-manager)

---

## Development Mode

For live-reload during development:

```bash
npm run dev
```

Opens two servers:
- Express API on `http://localhost:3001`
- Vite dev server on `http://localhost:5173` (proxies `/api` to Express)

Open **http://localhost:5173** in your browser.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `npm: command not found` | Node.js not installed or not in PATH | Reinstall Node.js from nodejs.org, restart terminal |
| `git: command not found` | Git not installed | Install Git from git-scm.com, restart terminal |
| Browser shows "Cannot connect" | Server isn't running | Run `npm start` or check `pm2 status` |
| `pm2 status` shows `errored` | App crashed on startup | Run `pm2 logs troubadour` to see the error |
| `pm2 startup` does nothing on Windows | Not supported on Windows | Use `pm2-windows-startup` instead (see above) |
| Other devices can't reach it | Firewall blocking port 3001 | Allow port 3001 in Windows Defender Firewall / `ufw allow 3001` on Linux |
| Phone can't reach via Tailscale | Tailscale not running on both devices | Check Tailscale is connected on both |
| Audio doesn't play on mobile | Browser autoplay policy | Tap anywhere on the page first to allow audio |
| Upload fails | Disk space or permissions | Check the `tracks/` and `images/` folders are writable |
| Update banner never appears | Server can't reach GitHub | Check internet connection; updates are optional — app works offline |
