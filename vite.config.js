import { Buffer } from 'node:buffer'
import { statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import {
  CRYSTAL_NORMAL_MAP,
  DUST_TEXTURE,
  FRACTURE_RAYS_MODEL,
  FRACTURE_RING_TEXTURE,
  GLOW_SPHERE_TEXTURE,
  MIST_TEXTURE,
  PROJECT_MODEL_KEYS,
  WIZARD_SMOKE_TEXTURE,
  crystalWholePathForTier,
  hdriPathForTier,
  projectModelPathForTier,
} from './src/config/assetPaths.js'

const projectRoot = dirname(fileURLToPath(import.meta.url))

// Hashed build output gets a folder of its own, apart from the unhashed files
// public/assets/ copies in (models, HDRIs), so netlify.toml can cache it forever
// without also pinning a model that is later replaced under the same name.
const ASSETS_DIR = '_app'

// The loader's first ring counts bytes (src/loader/downloads.js), so it needs to
// know how big each file is before requesting it. These are every file it can
// request, on any tier, sized from public/ when the config loads.
const loaderAssetBytes = () => {
  const tiers = ['low', 'medium', 'high']
  const urls = new Set([
    CRYSTAL_NORMAL_MAP,
    DUST_TEXTURE,
    FRACTURE_RAYS_MODEL,
    FRACTURE_RING_TEXTURE,
    GLOW_SPHERE_TEXTURE,
    MIST_TEXTURE,
    WIZARD_SMOKE_TEXTURE,
    ...tiers.map((tier) => crystalWholePathForTier(tier)),
    ...tiers.map((tier) => hdriPathForTier(tier)),
    ...tiers.flatMap((tier) => PROJECT_MODEL_KEYS.map((key) => projectModelPathForTier(key, tier))),
  ])
  const sizes = {}
  urls.forEach((url) => {
    try {
      sizes[url] = statSync(resolve(projectRoot, 'public', `.${url}`)).size
    } catch {
      // Missing file: downloads.js sizes it as it arrives instead.
    }
  })
  return sizes
}

// The app chunk (src/App.jsx, split from the entry so the loader paints first) is
// part of what the first ring counts: main.jsx fetches it with progress before
// importing it (the import then comes from the HTTP cache — /_app/* is immutable,
// netlify.toml). The entry holds placeholders for the chunk's URL and sizes,
// filled in here once the chunk exists: its decoded size (what a fetch's body
// reads) and its compressed size (what crosses the wire, which is what time is
// spent on). Rewriting after hashing is safe — the entry imports the app chunk by
// its hashed name, so any change to the chunk changes the entry's hash.
const appChunkPlaceholders = (app, base) => ({
  __APP_CHUNK_URL__: JSON.stringify(`${base}${app.fileName}`),
  __APP_CHUNK_BYTES__: String(gzipSync(app.code).length),
  __APP_CHUNK_RAW_BYTES__: String(Buffer.byteLength(app.code)),
})

const appChunkInfo = () => {
  let base = '/'
  return {
    name: 'loader-app-chunk-info',
    apply: 'build',
    configResolved(config) {
      base = config.base
    },
    generateBundle(_, bundle) {
      const chunks = Object.values(bundle).filter((file) => file.type === 'chunk')
      const app = chunks.find((chunk) => chunk.isDynamicEntry && chunk.name === 'App')
      if (!app) return
      const values = appChunkPlaceholders(app, base)
      chunks.forEach((chunk) => {
        Object.entries(values).forEach(([token, value]) => {
          if (!chunk.code.includes(token)) return
          chunk.code = chunk.code.replace(new RegExp(`(["'\`])${token}\\1`, 'g'), value)
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react(), appChunkInfo()],
  define: {
    __LOADER_ASSET_BYTES__: JSON.stringify(loaderAssetBytes()),
  },
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
