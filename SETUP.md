# Troubadour — Setup & Deployment Guide

## Self-Hosted Web Server

**Best for:** Running Troubadour on a home PC, server, or NAS so any browser on your network can reach it.

### Requirements

- [Node.js 18+](https://nodejs.org)
- Git

### First-time setup

```bash
git clone https://github.com/artificer54/Troubador.git
cd Troubador
npm install
npm run build
npm start
```

The server listens on `http://0.0.0.0:3001`.

- **On the host machine:** open `http://localhost:3001`
- **From other devices on the same network:** use the host's IP address, e.g. `http://192.168.1.10:3001`

### Configuration (optional)

Copy `.env.example` to `.env` and edit as needed:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `SERVER_PORT` | `3001` | Port the server listens on |
| `DATA_DIR` | project root | Where the database and uploaded files live |

### Keep it running with PM2

```bash
npm install -g pm2
pm2 start server/index.js --name troubadour
pm2 save
pm2 startup   # follow the printed command to auto-start on reboot
```

### Updating

```bash
git pull
npm install
npm run build
pm2 restart troubadour
```

---

## Development Mode

For live-reload during development:

```bash
npm install
npm run dev
```

Opens two servers:
- Express API on `http://localhost:3001`
- Vite dev server on `http://localhost:5173` (proxies `/api` to Express)

Open **http://localhost:5173** in your browser.

---

## Remote Access with Tailscale

**Best for:** Accessing Troubadour from a phone, tablet, or a different network — without port forwarding.

Tailscale creates an encrypted private tunnel between your devices. Free for personal use.

### Setup

1. Install [Tailscale](https://tailscale.com/download) on the PC running Troubadour.
2. Install Tailscale on your phone or tablet.
3. Sign in with the **same account** on both.
4. Find your PC's Tailscale IP in the Tailscale app — it starts with `100.`.
5. On your phone, open `http://100.x.x.x:3001` in a browser.

### Add to home screen (app-like experience)

1. Open the Troubadour URL in Chrome or Safari on your phone.
2. Tap **Add to Home Screen**.
3. The icon appears on your home screen and launches full-screen.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Browser shows "Cannot connect" | Server isn't running | Run `npm start` or check `pm2 status` |
| Other devices can't reach it | Firewall blocking port 3001 | Allow port 3001 in Windows Firewall / `ufw` |
| Phone can't reach via Tailscale | Tailscale not running on both devices | Check Tailscale is connected on both |
| Audio doesn't play on mobile | Browser autoplay policy | Tap anywhere on the page first to allow audio |
| Upload fails | Disk space or permissions | Check `tracks/` and `images/` are writable |
