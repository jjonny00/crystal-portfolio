import * as THREE from 'three';
import { projects } from '../data/projects';

// The project artwork shown on a focused facet. It isn't needed until a project
// is focused, so App starts it once the scene's own assets are in; the overlay
// hook reads the same promises, so the download is never repeated.
const imagePromises = new Map();

const imageLoader = new THREE.ImageLoader();
imageLoader.setCrossOrigin('anonymous');

export function loadOverlayImage(url) {
  if (!imagePromises.has(url)) {
    const promise = new Promise((resolve, reject) => {
      imageLoader.load(url, resolve, undefined, reject);
    }).then(async (image) => {
      // Decode off the main thread now, rather than synchronously on the frame
      // the overlay canvas first draws it.
      try {
        await image.decode?.();
      } catch {
        // drawImage still decodes it on demand.
      }
      return image;
    });
    // A failed load shouldn't stick: let the next caller retry.
    promise.catch(() => imagePromises.delete(url));
    imagePromises.set(url, promise);
  }
  return imagePromises.get(url);
}

export function preloadOverlayImages() {
  return Promise.allSettled(
    projects
      .map((project) => project.overlayImage)
      .filter(Boolean)
      .map(loadOverlayImage)
  );
}
