import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Dev proxy so relative /api calls reach Express on 3001
    proxy: {
      '/api': 'http://localhost:3001',
      '/tracks': 'http://localhost:3001',
      '/images': 'http://localhost:3001',
    },
  },
})
