import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const projectRoot = dirname(fileURLToPath(import.meta.url))

// Hashed build output gets a folder of its own, apart from the unhashed files
// public/assets/ copies in (models, HDRIs), so netlify.toml can cache it forever
// without also pinning a model that is later replaced under the same name.
const ASSETS_DIR = '_app'

// https://vite.dev/config/
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react()],
  build: isSsrBuild
    ? {
        // `vite build --ssr src/seo/entry-server.jsx`: the build-time renderer
        // scripts/prerender.mjs imports to write one HTML file per route. Its
        // input is the --ssr entry, so none of the client options apply.
        outDir: 'dist-ssr',
        // Same as the client, so images the server render references resolve
        // to the files the client build wrote.
        assetsDir: ASSETS_DIR,
      }
    : {
        // Read by scripts/prerender.mjs to find which stylesheets and chunks a
        // prerendered case study needs.
        manifest: true,
        assetsDir: ASSETS_DIR,
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
}))
