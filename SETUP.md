# Troubadour — Setup & Deployment Guide

## What is Troubadour?

A self-hosted TTRPG audio manager. Organize music into Scenarios, switch between intensity levels at the table, and trigger sound effects from a configurable matrix. Works on Windows desktop and in any modern browser.

---

## Option 1: Windows Desktop App (MSI Installer)

**Best for:** DMs who want a one-click install with no server management.

1. Download `Troubadour_x.x.x_x64-setup.msi` from the [GitHub Releases](https://github.com/artificer54/Troubador/releases) page.
2. Run the installer.
   - If Windows SmartScreen blocks it, click **More info → Run anyway**. This is expected for unsigned community apps.
3. Launch Troubadour from the Start menu.
4. The app automatically starts its own Express server in the background — no Node.js required.

### Firewall
If Windows Firewall asks for network access, **allow it**. This is needed for the app's internal audio server to function.

### Data location
User data (uploaded audio, database) is stored at:
```
C:\Users\<you>\AppData\Roaming\com.troubadour.app\
```

### Updates
The app checks for new versions on GitHub automatically at launch and prompts you to install them.

---

## Option 2: Self-Hosted Web Server

**Best for:** Running Troubadour on a home server or NAS so any browser on your network can access it.

### Requirements
- Node.js 18 or newer
- Git

### First-time setup

```bash
git clone https://github.com/artificer54/Troubador.git
cd Troubador
npm install
npm run build
npm start
```

The server listens on `http://0.0.0.0:3001`. On the host machine, open `http://localhost:3001`. From other devices on the same network, use the host's IP address.

### Keep it running (PM2)

```bash
npm install -g pm2
pm2 start server/index.js --name troubadour
pm2 save
pm2 startup    # follow the printed instructions to auto-start on reboot
```

### Updating

```bash
git pull
npm install
npm run build
pm2 restart troubadour
```

### Data location
- Audio files: `./tracks/` (relative to the project directory)
- Database: `./troubador.db`
- Custom library paths are configurable from Settings → Libraries

---

## Option 3: Remote Access with Tailscale

**Best for:** Accessing Troubadour from a phone, tablet, or a friend's machine — even when not on the same WiFi.

Tailscale creates an encrypted private network between your devices. No port forwarding or router configuration required.

### Setup

1. Install [Tailscale](https://tailscale.com/download) on the PC running Troubadour.
2. Install Tailscale on your phone or tablet.
3. Sign in to Tailscale with the **same account** on both.
4. Find your PC's Tailscale IP in the Tailscale app — it starts with `100.`.
5. On your phone, open `http://100.x.x.x:3001` in a browser.

### Using from a phone (without installing an app)

1. Navigate to the Troubadour URL in Chrome or Firefox on your phone.
2. Tap the browser's **"Add to Home Screen"** option.
3. The app icon appears on your home screen and launches full-screen.

### Configuring the Desktop App for Tailscale

If you want the Windows desktop app to connect to a different Troubadour server:

1. Open **Settings → Connection**
2. Change the Server Address to your Tailscale IP: `http://100.x.x.x:3001`
3. Click **Save**

---

## Android — Important Note

> **The APK build is not supported.**

The Troubadour server runs on Node.js, which cannot run natively on Android ARM. Any APK generated from this project bundles a Windows executable that Android cannot execute. The APK will either fail to install or crash immediately.

**The correct approach for Android** is to use the browser method described above in the Tailscale or WiFi sections. The web interface is fully mobile-responsive and can be pinned to your home screen for an app-like experience.

---

## Developer Setup

```bash
git clone https://github.com/artificer54/Troubador.git
cd Troubador
npm install
npm run dev        # starts Express (3001) + Vite (5173) concurrently
```

Open `http://localhost:5173`.

### Building the Windows installer

```bash
npm run tauri:build
```

This runs:
1. `scripts/prepare-sidecar.js` — copies the current `node.exe` into `src-tauri/binaries/`
2. `scripts/bundle-server.js` — compiles the Express server via `@vercel/ncc` into `server-bundle/`
3. `tauri build` — produces the MSI in `src-tauri/target/release/bundle/msi/`

### Why ncc bundling?

The Tauri installer bundles `node.exe` and the compiled `server-bundle/index.js`. Without bundling, the server would fail to start in production because `node_modules/` is not included in the installer. `@vercel/ncc` inlines all JavaScript dependencies into a single file. Native addons (better-sqlite3, sharp) are copied alongside it.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| App opens but shows "Cannot connect" | Internal Express server failed to start | Check Windows Firewall; allow the app network access |
| `Cannot find module 'express'` in logs | Building without running `tauri:prebuild` | Run `npm run tauri:prebuild` before `tauri build` |
| Phone can't reach the server | Network mismatch | Ensure Tailscale is running on both devices, or both are on the same WiFi |
| APK fails to install | Windows binary bundled in APK | Use the browser via Tailscale instead |
| Audio doesn't play on phone | Browser autoplay policy | Tap anywhere on the page to allow audio |
