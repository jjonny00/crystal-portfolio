// scripts/generate-facet-map.mjs
//
// Writes src/data/facetMap.json: the outline of each project's crystal fragment
// as the overview shows it, drawn flat, for the facet map (the small 2D glyph that
// marks the current project; see docs/facet-map.md).
//
// The outlines are derived, not drawn. For each project, in the order of
// projects.js:
//
//   1. the fragment the scene shows for it: the project's scene key
//      (getSceneFacetKeyByProjectId, the lookup the camera, labels and glow use)
//      and the GLB the scene loads at that key (getProjectModelKeyByFacetKey);
//   2. that GLB placed where the overview places it: the layout's exploded
//      position and base rotation for the key (desktop.json over crystalConfig);
//   3. every vertex projected through the overview camera (desktop.json's
//      overview position and target, the canvas fov);
//   4. the convex hull of those points.
//
// All six share one viewBox, so the composition is the overview's. The desktop
// overview is the one used everywhere: the phone's overview camera sits lower and
// further back, which in 2D runs Mesa and Flying Axes into each other.
//
// Run when a fragment GLB, an exploded position or the overview camera changes,
// and commit the output:
//   npm run build:facet-map
// `npm run build` runs it with --check, which fails the build if the committed
// file no longer matches what the inputs produce.

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = resolve(root, 'src/data/facetMap.json');
const CHECK = process.argv.includes('--check');

// viewBox units: the composition is scaled so its taller side is this long.
const VIEW_SIZE = 100;
// Room around the composition so a stroke on the outermost edge is not clipped.
const VIEW_PADDING = 2;

// The app's own modules, loaded through Vite so their extensionless imports
// resolve exactly as they do in the app. No config file: none of the app's
// plugins are needed to read data.
const loadAppModules = async () => {
  const vite = await createServer({
    root,
    configFile: false,
    logLevel: 'error',
    appType: 'custom',
    server: { middlewareMode: true, hmr: false },
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  try {
    const projectsModule = await vite.ssrLoadModule('/src/data/projects.js');
    const crystalConfig = await vite.ssrLoadModule('/src/crystalConfig.js');
    const assetPaths = await vite.ssrLoadModule('/src/config/assetPaths.js');
    return { projectsModule, crystalConfig, assetPaths };
  } finally {
    await vite.close();
  }
};

const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));

const addVec = (a, b) => a.map((value, index) => value + (b?.[index] ?? 0));

// Geometry only. The GLBs embed textures, which need a browser to decode and
// play no part in an outline.
const gltfLoader = new GLTFLoader();
gltfLoader.register(() => ({ name: 'facet-map-skip-textures', loadTexture: () => Promise.resolve(null) }));

const loadGlb = async (publicPath) => {
  const bytes = await readFile(resolve(root, 'public', `.${publicPath}`));
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  return new Promise((resolveGltf, reject) => gltfLoader.parse(buffer, '', resolveGltf, reject));
};

/** Andrew's monotone chain. Counter-clockwise in screen space (y down). */
const convexHull = (points) => {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const point of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) lower.pop();
    lower.push(point);
  }
  const upper = [];
  for (const point of [...sorted].reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) upper.pop();
    upper.push(point);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
};

const round = (value) => Math.round(value * 100) / 100;

const polygonCentroid = (points) => {
  let area = 0;
  let cx = 0;
  let cy = 0;
  points.forEach(([x0, y0], index) => {
    const [x1, y1] = points[(index + 1) % points.length];
    const cross = x0 * y1 - x1 * y0;
    area += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  });
  area /= 2;
  return [cx / (6 * area), cy / (6 * area)];
};

const main = async () => {
  const { projectsModule, crystalConfig, assetPaths } = await loadAppModules();
  const { projects, getSceneFacetKeyByProjectId, getProjectModelKeyByFacetKey } = projectsModule;
  const layout = await readJson('src/config/layout/desktop.json');

  // Where the overview puts each fragment and how it is turned: the layout's
  // values over crystalConfig's, the order Fixed3DCanvas merges them in.
  const explodedPositions = {
    ...crystalConfig.explodedPositions,
    ...(layout.projects?.explodedPositions || {}),
  };
  const baseRotationsDeg = {
    ...crystalConfig.facetRotationsEulerDeg,
    ...(layout.projects?.facetRotationsEulerDeg || {}),
  };

  // The overview camera, with the offsets the camera controller adds to it.
  const offsets = layout.camera?.offsets || {};
  const cameraPosition = addVec(
    addVec(layout.camera?.positions?.overview || crystalConfig.cameraPositions.overview, offsets.global?.position),
    offsets.zones?.overview?.position,
  );
  const cameraTarget = addVec(
    addVec(layout.camera?.targets?.overview || crystalConfig.cameraTargets.overview, offsets.global?.target),
    offsets.zones?.overview?.target,
  );
  const fov = layout.camera?.fov ?? crystalConfig.camera?.fov ?? 45;

  // Aspect 1: projected x then needs no correction for the canvas shape, since
  // NDC x times the aspect is the same at any aspect.
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.01, 100);
  camera.position.fromArray(cameraPosition);
  camera.lookAt(new THREE.Vector3().fromArray(cameraTarget));
  camera.updateMatrixWorld(true);
  camera.updateProjectionMatrix();

  const fragments = [];
  for (const project of projects) {
    const projectId = project.facetKey || project.id;
    const sceneKey = getSceneFacetKeyByProjectId(projectId);
    const modelKey = sceneKey ? getProjectModelKeyByFacetKey(sceneKey) : null;
    const exploded = sceneKey ? explodedPositions[sceneKey] : null;
    if (!sceneKey || !modelKey || !exploded) {
      throw new Error(`facet map: no fragment for ${projectId} (scene key ${sceneKey}, model ${modelKey})`);
    }

    const gltf = await loadGlb(assetPaths.projectModelPathForTier(modelKey, 'high'));
    const [rx = 0, ry = 0, rz = 0] = baseRotationsDeg[sceneKey] || [];
    gltf.scene.position.fromArray(exploded);
    gltf.scene.rotation.set(
      THREE.MathUtils.degToRad(rx),
      THREE.MathUtils.degToRad(ry),
      THREE.MathUtils.degToRad(rz),
    );
    gltf.scene.updateMatrixWorld(true);

    const points = [];
    const vertex = new THREE.Vector3();
    gltf.scene.traverse((node) => {
      if (!node.isMesh) return;
      const positions = node.geometry.attributes.position;
      for (let index = 0; index < positions.count; index += 1) {
        vertex.fromBufferAttribute(positions, index).applyMatrix4(node.matrixWorld).project(camera);
        // Screen space, y down.
        points.push([vertex.x, -vertex.y]);
      }
    });

    fragments.push({ projectId, sceneKey, modelKey, hull: convexHull(points) });
  }

  // One shared frame for all six.
  const all = fragments.flatMap((fragment) => fragment.hull);
  const minX = Math.min(...all.map(([x]) => x));
  const maxX = Math.max(...all.map(([x]) => x));
  const minY = Math.min(...all.map(([, y]) => y));
  const maxY = Math.max(...all.map(([, y]) => y));
  const scale = VIEW_SIZE / Math.max(maxX - minX, maxY - minY);
  const toView = ([x, y]) => [round((x - minX) * scale + VIEW_PADDING), round((y - minY) * scale + VIEW_PADDING)];

  const output = {
    generatedBy: 'scripts/generate-facet-map.mjs (npm run build:facet-map). Do not edit by hand.',
    viewBox: [0, 0, round((maxX - minX) * scale + VIEW_PADDING * 2), round((maxY - minY) * scale + VIEW_PADDING * 2)],
    order: fragments.map((fragment) => fragment.projectId),
    fragments: Object.fromEntries(fragments.map((fragment) => {
      const outline = fragment.hull.map(toView);
      return [fragment.projectId, {
        sceneKey: fragment.sceneKey,
        model: fragment.modelKey,
        points: outline,
        path: `M${outline.map(([x, y]) => `${x} ${y}`).join('L')}Z`,
        center: polygonCentroid(outline).map(round),
      }];
    })),
  };

  const text = `${JSON.stringify(output, null, 2)}\n`;

  if (CHECK) {
    const committed = await readFile(OUTPUT, 'utf8').catch(() => null);
    if (committed?.replace(/\r\n/g, '\n') !== text) {
      console.error(
        'facet map: src/data/facetMap.json is out of date with the fragment GLBs, exploded '
        + 'positions or overview camera. Run `npm run build:facet-map` and commit the result.',
      );
      process.exit(1);
    }
    console.log('facet map: up to date');
    return;
  }

  await writeFile(OUTPUT, text);
  console.log(`facet map: wrote ${fragments.length} outlines to src/data/facetMap.json`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
