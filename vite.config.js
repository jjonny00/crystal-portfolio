import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const projectRoot = dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Two pages, not one: the portfolio, and the component catalogue on its own
    // at /catalog.html (src/catalog-main.jsx). The catalogue is a design tool —
    // it shares the case-study system but none of the 3D app, so building it as
    // a separate entry keeps the scene out of its bundle and the catalogue out
    // of the portfolio's.
    rollupOptions: {
      input: {
        main: resolve(projectRoot, 'index.html'),
        catalog: resolve(projectRoot, 'catalog.html'),
      },
    },
  },
})
