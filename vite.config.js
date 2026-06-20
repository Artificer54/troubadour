import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Prevent Vite from obscuring Rust errors
  clearScreen: false,
  server: {
    // Tauri expects a fixed port; fail if it's not available
    port: 5173,
    strictPort: true,
    // Dev proxy so relative /api calls reach Express on 3001
    proxy: {
      '/api': 'http://localhost:3001',
      '/tracks': 'http://localhost:3001',
      '/images': 'http://localhost:3001',
    },
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    // Tauri on Windows uses Chromium-based WebView2 — target a modern baseline
    target: ['es2021', 'chrome105'],
    // Don't minify for easier debugging; Tauri does its own optimizations
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG,
  },
})
