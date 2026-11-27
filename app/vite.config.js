import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  // L065: GitHub Pages serves this repo's site from a subdirectory,
  // https://dylanp-12.github.io/ai-reliability-lab/, so every asset and data
  // path must start there. dataStore reads this via import.meta.env.BASE_URL.
  // Use '/' instead if the app ever moves to a root-domain host.
  base: '/ai-reliability-lab/',
  plugins: [react()],
  resolve: {
    alias: { '@core': fileURLToPath(new URL('../core', import.meta.url)) },
  },
  server: { fs: { allow: ['..'] } },
})