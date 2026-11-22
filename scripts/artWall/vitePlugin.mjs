// scripts/artWall/vitePlugin.mjs
//
// `virtual:art-wall-sizes`: the pixel size of every image in the art wall's
// folder (src/artWall/artwork), keyed the way artWallData.js's import.meta.glob
// keys them ('./artwork/02 James Lindsey.webp'). Read at build time with sharp,
// so a tile can reserve its artwork's shape before the image arrives and the
// wall's columns don't reshuffle as images load.
//
// Adding art stays folder-only: the module is rebuilt from whatever is in the
// folder, and the dev server reloads it when a file is added or removed.

import { readdir, readFile } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import sharp from 'sharp';

// sharp keeps files it has opened in a cache of open handles; on Windows an open
// handle stops the file being deleted for as long as the dev server runs. Each
// file is read into memory instead, and nothing is cached.
sharp.cache(false);

const VIRTUAL_ID = 'virtual:art-wall-sizes';
const RESOLVED_ID = `\0${VIRTUAL_ID}`;
const IMAGE = /\.(png|jpe?g|webp|avif|gif)$/i;

const walk = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const path = join(dir, entry.name);
      return entry.isDirectory() ? walk(path) : IMAGE.test(entry.name) ? [path] : [];
    })
  );
  return files.flat();
};

export const artWallSizes = ({ root = process.cwd() } = {}) => {
  const artworkDir = resolve(root, 'src/artWall/artwork');
  const wallDir = resolve(root, 'src/artWall');
  let server = null;

  const invalidate = (file) => {
    if (!server || !file.startsWith(artworkDir)) return;
    const module = server.moduleGraph.getModuleById(RESOLVED_ID);
    if (module) server.reloadModule(module);
  };

  return {
    name: 'art-wall-sizes',
    configureServer(devServer) {
      server = devServer;
      devServer.watcher.on('add', invalidate);
      devServer.watcher.on('unlink', invalidate);
    },
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null;
    },
    async load(id) {
      if (id !== RESOLVED_ID) return null;
      let files = [];
      try {
        files = await walk(artworkDir);
      } catch {
        // No folder yet: an empty wall.
      }
      const sizes = {};
      await Promise.all(
        files.map(async (file) => {
          const key = `./${relative(wallDir, file).split(sep).join('/')}`;
          try {
            const { width, height, pageHeight, orientation } = await sharp(await readFile(file)).metadata();
            // An animated image reports its frames stacked; one frame is the size.
            const frameHeight = pageHeight || height;
            // EXIF orientations 5–8 turn the image on its side.
            sizes[key] = orientation >= 5 ? [frameHeight, width] : [width, frameHeight];
          } catch {
            // Unreadable: the tile simply sizes itself once the image loads.
          }
        })
      );
      return `export default ${JSON.stringify(sizes)};`;
    },
  };
};

export default artWallSizes;
