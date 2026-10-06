// src/loader/threeCache.js
//
// Hands the loader's downloads (src/loader/downloads.js) to three.js. Every
// loader the scene uses — GLTFLoader and RGBELoader through FileLoader, the
// texture loaders through ImageLoader — checks THREE.Cache by URL before it goes
// to the network, so seeding it with the bytes we already have means the scene
// parses those instead of downloading each file a second time.
//
// The cache is on only while the scene is being prepared. Left on, it would hold
// every file three ever loads for the life of the page.

import * as THREE from 'three';
import { getDownload } from './downloads';

const IMAGE_URL = /\.(png|jpe?g|webp|gif|avif)$/i;
const seeded = new Map(); // url -> Promise<void>

THREE.Cache.enabled = true;

async function toImage(buffer, contentType, url) {
  const type = contentType || (url.endsWith('.png') ? 'image/png' : 'image/jpeg');
  // The object URL stays alive with the image: a browser may drop the decoded
  // bitmap and decode again from `src` later.
  const image = new Image();
  image.src = URL.createObjectURL(new Blob([buffer], { type }));
  await image.decode();
  return image;
}

/** Put `url`'s downloaded bytes where three's loaders will find them. */
export function seedThreeCache(url) {
  if (!seeded.has(url)) {
    seeded.set(url, (async () => {
      const result = await getDownload(url);
      if (!result || !THREE.Cache.enabled) return;
      try {
        const value = IMAGE_URL.test(url)
          ? await toImage(result.buffer, result.contentType, url)
          : result.buffer;
        THREE.Cache.add(url, value);
      } catch (error) {
        // The scene's loader fetches it itself.
        if (import.meta.env.DEV) console.warn(`[loader] could not prepare ${url}`, error);
      }
    })());
  }
  return seeded.get(url);
}

export const seedThreeCacheAll = (urls) => Promise.all(urls.map(seedThreeCache));

/** The scene has what it needs: stop caching. */
export function releaseThreeCache() {
  THREE.Cache.clear();
  THREE.Cache.enabled = false;
}
