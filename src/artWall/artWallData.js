// src/artWall/artWallData.js
//
// The art wall's contents, read from one folder at build time:
//
//   src/artWall/artwork/
//     01 The Veil Lifted/       a subfolder is one SERIES tile; its pages open
//       Page 00.webp            in order, from the first
//       Page 01.webp
//       cover.txt               optional: the file to show on the wall
//       caption.txt             optional: a line under every page in the viewer
//       pixelated.txt           optional: pixel art, drawn with hard edges
//     02 Mage Wave/
//       00 Crank demo.mp4       a video: muted, looping, autoplaying
//       00 Crank demo.poster.webp   optional: its poster frame
//     07 Took.webp              an image at the root is one tile
//     07 Took.txt               optional: its caption
//
// Nothing else needs editing to add art: Vite's import.meta.glob finds every
// file under the folder on each build. Order is natural and numeric, so "2"
// comes before "10", for the wall (by file or folder name) and for a series'
// pages alike. A number at the start of a name orders it and is stripped from
// the title a visitor sees ("02 James Lindsey" -> "James Lindsey");
// underscores read as spaces.
//
// A video's poster is `<its name>.poster.<image>` beside it; without one, the
// first still in its series. See README.md beside this file for sizes and
// formats.

import sizes from 'virtual:art-wall-sizes';

const media = import.meta.glob(
  './artwork/**/*.{png,PNG,jpg,JPG,jpeg,JPEG,webp,WEBP,avif,AVIF,gif,GIF,mp4,MP4,webm,WEBM}',
  { eager: true, import: 'default' }
);

const texts = import.meta.glob('./artwork/**/*.txt', {
  eager: true,
  query: '?raw',
  import: 'default',
});

const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

const VIDEO = /\.(mp4|webm)$/i;
const POSTER = /\.poster\.[^.]+$/i;

const stripExtension = (name) => name.replace(/\.[^.]+$/, '');

/** "02 James_Lindsey.webp" -> "James Lindsey". */
const titleFromName = (name) =>
  stripExtension(name)
    .replace(/^\d+[\s._-]*/, '')
    .replace(/_/g, ' ')
    .trim();

const textAt = (path) => {
  const text = texts[path];
  return typeof text === 'string' && text.trim() ? text.trim() : null;
};

const buildWall = () => {
  const items = new Map();
  const posters = new Map();

  Object.keys(media)
    .sort(collator.compare)
    .forEach((path) => {
      // A poster frame belongs to its video, not to the wall.
      if (POSTER.test(path)) {
        posters.set(path.replace(POSTER, ''), path);
        return;
      }

      // './artwork/<first>/<...rest>'
      const parts = path.replace(/^\.\/artwork\//, '').split('/');
      const [first] = parts;
      const series = parts.length > 1;
      const folder = series ? `./artwork/${first}` : null;

      if (!items.has(first)) {
        items.set(first, {
          // The file or folder name: unique, where a title might not be.
          key: first,
          title: titleFromName(first) || 'Untitled',
          series,
          caption: series
            ? textAt(`${folder}/caption.txt`)
            : textAt(`./artwork/${stripExtension(first)}.txt`),
          pixelated: series
            ? `${folder}/pixelated.txt` in texts
            : `./artwork/${stripExtension(first)}.pixelated.txt` in texts,
          coverName: series ? textAt(`${folder}/cover.txt`) : null,
          pages: [],
        });
      }

      const item = items.get(first);
      const fileName = parts[parts.length - 1];
      const [width, height] = sizes[path] || [];
      item.pages.push({
        type: VIDEO.test(fileName) ? 'video' : 'image',
        src: media[path],
        fileName,
        base: stripExtension(path),
        width: width || null,
        height: height || null,
        title: series ? titleFromName(fileName) : item.title,
      });
    });

  return [...items.values()]
    .sort((a, b) => collator.compare(a.key, b.key))
    .map(({ coverName, ...item }) => {
      const firstStill = item.pages.find((page) => page.type === 'image') || null;
      const pages = item.pages.map((source, index) => {
        // The file name and path only served the lookups here.
        const { base } = source;
        const page = { ...source };
        delete page.fileName;
        delete page.base;
        if (page.type !== 'video') {
          // A page named only by its number ("03.webp") still needs a label.
          return { ...page, title: page.title || `Page ${index + 1}` };
        }
        // A video takes its own poster, or the series' first still; either
        // also lends the video its shape until the video itself has loaded.
        const posterPath = posters.get(base) || null;
        const posterSize = posterPath ? sizes[posterPath] : null;
        const poster = posterPath ? media[posterPath] : firstStill?.src || null;
        const [width, height] = posterSize || [firstStill?.width, firstStill?.height];
        return {
          ...page,
          title: page.title || `Page ${index + 1}`,
          poster,
          width: width || null,
          height: height || null,
        };
      });
      const coverIndex = coverName
        ? Math.max(0, item.pages.findIndex((page) => page.fileName === coverName))
        : 0;
      return { ...item, pages, cover: pages[coverIndex] };
    });
};

/**
 * The wall, in order:
 *   { key, title, series, caption, pixelated, cover, pages }
 * where each page is { type: 'image' | 'video', src, width, height, title }
 * (and a video's `poster`), and `cover` is the page shown on the wall.
 * Sizes come from the build (scripts/artWall/vitePlugin.mjs), so a tile holds its
 * shape before its media arrives. A single illustration is a series of one page
 * with `series: false`.
 */
export const artWall = buildWall();

export default artWall;
