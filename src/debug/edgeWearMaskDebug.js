// TEMPORARY DIAGNOSTIC — edge-wear vertex-color mask verification.
//
// Purpose: prove the data path
//   Blender `edgeWear` color attribute → GLB COLOR_0 → geometry.attributes.color → shader
// for CrystalWhole-EdgeWear01.glb, WITHOUT touching the real crystal material.
//
// Deliberately does NOT set `material.vertexColors`. That flag would make three
// multiply the mask into the crystal's base colour (and, for a VEC4 COLOR_0, into
// alpha too), which is exactly what we don't want — the attribute is a shader mask,
// not a tint. Instead the debug material declares `attribute vec4 color;` itself and
// reads the raw values. Because `vertexColors` stays false, three emits neither
// USE_COLOR nor USE_COLOR_ALPHA, so there is no duplicate declaration of `color`.
//
// Modes:
//   'solid'  opaque magenta MeshBasicMaterial. Reads NO attributes and compiles no
//            custom GLSL, so it isolates "is the material swap reaching the drawn
//            mesh at all" from "does my shader work". Start here.
//   'mask'   the raw authored mask: black = facet, white = bevel (binary).
//   'strict' same, but values that are neither ~0 nor ~1 render red.
//   'wear'   the FINAL wear value including the aEdgeDist falloff, as continuous
//            grayscale — black facet -> gray ramp -> white bevel. Shares the exact
//            edgeWearAmount() GLSL with the production injection, so they can't drift.
//
// The swap is non-destructive: the mesh's real material is parked on
// `userData.__edgeWearOriginalMaterial` and restored on toggle-off. The central
// material-assignment path (applyMaterial in UnifiedCrystalScene) calls
// `getEdgeWearDebugOverride()` so a tier/focus/config update re-applies the debug
// material instead of silently clobbering it while debugging is on.
//
// TO REMOVE: delete this file, the `edgeWearMaskDebug` import + useEffect block in
// UnifiedCrystalScene.jsx, and the two `getEdgeWearDebugOverride` call sites inside
// applyMaterial. Nothing else references it.

import * as THREE from 'three';
import { EDGE_WEAR_FUNCTION_GLSL } from '../components/materials/edgeWear';

const LOG = '[edgeWear]';

// Values are expected to be hard 0 / 1 per vertex (Blender splits the verts at the
// bevel boundary), so anything in between means the mask got smoothed/interpolated
// on export and would need re-authoring before it can drive a crisp effect.
const BINARY_EPSILON = 0.01;

let debugMode = false; // false | 'solid' | 'mask' | 'strict'

// Live accessors, installed by the component (it owns the r3f scene/renderer).
let ctx = { getTargetRoot: () => null, getRootScene: () => null, getRenderer: () => null };

// Meshes we have swapped, so restore and the applyMaterial override can be
// scoped precisely rather than guessing from geometry alone.
const targets = new Set();

const vertexShader = /* glsl */ `
  attribute vec4 color;
  varying vec4 vEdgeWear;
  void main() {
    vEdgeWear = color;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// uStrict: 0 = plain grayscale mask, 1 = flag non-binary values in red so a
// smeared/interpolated export is impossible to mistake for a clean mask.
const fragmentShader = /* glsl */ `
  uniform float uStrict;
  uniform float uEpsilon;
  varying vec4 vEdgeWear;
  void main() {
    float mask = vEdgeWear.r;
    vec3 rgb = vec3(mask);
    if (uStrict > 0.5 && mask > uEpsilon && mask < 1.0 - uEpsilon) {
      rgb = vec3(1.0, 0.0, 0.0);
    }
    gl_FragColor = vec4(rgb, 1.0);
  }
`;

// 'wear' mode: the FINAL wear value, falloff included, as continuous grayscale —
// black facet -> gray ramp -> white bevel. It calls the very same
// edgeWearAmount() the production injection uses, so the two cannot drift.
const wearVertexShader = /* glsl */ `
  attribute vec4 color;
  attribute vec3 aEdgeDist;
  varying float vEdgeWearMask;
  varying vec3 vEdgeWearDist;
  varying vec3 vEdgeWearPos;
  void main() {
    vEdgeWearMask = color.r;
    vEdgeWearDist = aEdgeDist;
    vEdgeWearPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  }
`;

const wearFragmentShader = /* glsl */ `
  uniform float uFalloff;
  uniform float uNoiseAmount;
  uniform float uNoiseScale;
  varying float vEdgeWearMask;
  varying vec3 vEdgeWearDist;
  varying vec3 vEdgeWearPos;
  ${EDGE_WEAR_FUNCTION_GLSL}
  void main() {
    float wear = edgeWearAmount( vEdgeWearMask, vEdgeWearDist, vEdgeWearPos,
                                 uFalloff, uNoiseAmount, uNoiseScale );
    gl_FragColor = vec4( vec3( wear ), 1.0 );
  }
`;

let maskMaterial = null;
let solidMaterial = null;
let wearMaterial = null;

// Kept in step with the live config/tuning values by setEdgeWearDebugParams() so
// 'wear' always visualises what the crystal is actually doing.
const debugParams = { falloff: 0, noiseAmount: 0, noiseScale: 1 };

const getMaskMaterial = () => {
  if (!maskMaterial) {
    maskMaterial = new THREE.ShaderMaterial({
      name: 'EdgeWearMaskDebug',
      vertexShader,
      fragmentShader,
      uniforms: {
        uStrict: { value: 0 },
        uEpsilon: { value: BINARY_EPSILON },
      },
      // Match the crystal's double-sided draw so bevels aren't culled away.
      side: THREE.DoubleSide,
      transparent: false,
      opacity: 1,
      depthWrite: true,
      depthTest: true,
      colorWrite: true,
      toneMapped: false,
      vertexColors: false, // see header note — intentional
    });
    maskMaterial.userData.isEdgeWearDebug = true;
  }
  return maskMaterial;
};

// No custom GLSL, no attributes beyond position: if THIS doesn't show, the problem
// is upstream of the shader (mesh not drawn, occluded, swap overwritten, etc.).
const getSolidMaterial = () => {
  if (!solidMaterial) {
    solidMaterial = new THREE.MeshBasicMaterial({
      name: 'EdgeWearSolidDebug',
      color: 0xff00ff,
      side: THREE.DoubleSide,
      transparent: false,
      opacity: 1,
      depthWrite: true,
      depthTest: true,
      colorWrite: true,
      toneMapped: false,
      fog: false,
    });
    solidMaterial.userData.isEdgeWearDebug = true;
  }
  return solidMaterial;
};

const getWearMaterial = () => {
  if (!wearMaterial) {
    wearMaterial = new THREE.ShaderMaterial({
      name: 'EdgeWearValueDebug',
      vertexShader: wearVertexShader,
      fragmentShader: wearFragmentShader,
      uniforms: {
        uFalloff: { value: debugParams.falloff },
        uNoiseAmount: { value: debugParams.noiseAmount },
        uNoiseScale: { value: debugParams.noiseScale },
      },
      side: THREE.DoubleSide,
      transparent: false,
      opacity: 1,
      depthWrite: true,
      depthTest: true,
      colorWrite: true,
      toneMapped: false,
      vertexColors: false, // see header note — intentional
    });
    wearMaterial.userData.isEdgeWearDebug = true;
  }
  return wearMaterial;
};

const isDebugMaterial = (mat) => !!mat?.userData?.isEdgeWearDebug;

/**
 * Keep the 'wear' visualisation matching the live shape of the effect (config or
 * __setEdgeWear). Brightness is deliberately NOT mirrored — this view shows the wear
 * VALUE that drives roughness/transmission/glow, not the resulting glow.
 */
export const setEdgeWearDebugParams = ({ falloff, noiseAmount, noiseScale } = {}) => {
  if (typeof falloff === 'number') debugParams.falloff = falloff;
  if (typeof noiseAmount === 'number') debugParams.noiseAmount = noiseAmount;
  if (typeof noiseScale === 'number') debugParams.noiseScale = noiseScale;
  if (!wearMaterial) return;
  wearMaterial.uniforms.uFalloff.value = debugParams.falloff;
  wearMaterial.uniforms.uNoiseAmount.value = debugParams.noiseAmount;
  wearMaterial.uniforms.uNoiseScale.value = debugParams.noiseScale;
};

const materialForMode = (mode) => {
  if (mode === 'solid') return getSolidMaterial();
  if (mode === 'wear') {
    const mat = getWearMaterial();
    mat.uniforms.uFalloff.value = debugParams.falloff;
    mat.uniforms.uNoiseAmount.value = debugParams.noiseAmount;
    mat.uniforms.uNoiseScale.value = debugParams.noiseScale;
    return mat;
  }
  if (mode === 'mask' || mode === 'strict') {
    const mat = getMaskMaterial();
    mat.uniforms.uStrict.value = mode === 'strict' ? 1 : 0;
    return mat;
  }
  return null;
};

/**
 * Summarise a geometry's color attribute: array type, normalization, and how the
 * values actually distribute. Cached on the geometry so repeated toggles are cheap.
 */
const summariseColorAttribute = (geometry) => {
  const attr = geometry?.attributes?.color;
  if (!attr) return null;
  if (geometry.userData.__edgeWearSummary) return geometry.userData.__edgeWearSummary;

  let near0 = 0;
  let near1 = 0;
  let between = 0;
  let min = Infinity;
  let max = -Infinity;
  const unique = new Set();

  for (let i = 0; i < attr.count; i += 1) {
    // getX() applies the normalized→0..1 conversion for integer-backed attributes.
    const v = attr.getX(i);
    min = Math.min(min, v);
    max = Math.max(max, v);
    if (unique.size < 16) unique.add(Number(v.toFixed(4)));
    if (v <= BINARY_EPSILON) near0 += 1;
    else if (v >= 1 - BINARY_EPSILON) near1 += 1;
    else between += 1;
  }

  const summary = {
    itemSize: attr.itemSize,
    count: attr.count,
    normalized: attr.normalized,
    arrayType: attr.array?.constructor?.name,
    min,
    max,
    near0,
    near1,
    between,
    uniqueValues: [...unique].sort((a, b) => a - b),
  };
  geometry.userData.__edgeWearSummary = summary;
  return summary;
};

const describeMaterial = (mat) => {
  if (!mat) return null;
  return {
    type: mat.type,
    name: mat.name,
    uuid: mat.uuid,
    isDebug: isDebugMaterial(mat),
    visible: mat.visible,
    opacity: mat.opacity,
    transparent: mat.transparent,
    colorWrite: mat.colorWrite,
    depthTest: mat.depthTest,
    depthWrite: mat.depthWrite,
    side: mat.side,
    transmission: mat.transmission,
    vertexColors: mat.vertexColors,
  };
};

const materialsOf = (mesh) => (Array.isArray(mesh.material) ? mesh.material : [mesh.material]);

/** Walk up from the mesh: is it under the live r3f scene, and is anything hiding it? */
const describeAncestry = (mesh) => {
  const rootScene = ctx.getRootScene?.();
  const chain = [];
  let attachedToLiveScene = false;
  let hiddenBy = null;

  let node = mesh;
  while (node) {
    chain.push({
      name: node.name || node.type,
      type: node.type,
      visible: node.visible,
      scaleX: Number(node.scale?.x?.toFixed?.(4)),
    });
    if (!node.visible && !hiddenBy) hiddenBy = node.name || node.type;
    if (rootScene && node === rootScene) attachedToLiveScene = true;
    node = node.parent;
  }

  return { attachedToLiveScene, hiddenBy, chain };
};

/** Full state dump for one mesh — the answer to "is this thing actually drawn?". */
const auditMesh = (mesh, label) => {
  const worldPos = new THREE.Vector3();
  mesh.getWorldPosition(worldPos);
  const worldScale = new THREE.Vector3();
  mesh.getWorldScale(worldScale);
  const ancestry = describeAncestry(mesh);

  console.log(`${LOG} ${label} mesh`, {
    name: mesh.name,
    uuid: mesh.uuid,
    geometryUuid: mesh.geometry?.uuid,
    visible: mesh.visible,
    attachedToLiveScene: ancestry.attachedToLiveScene,
    hiddenByAncestor: ancestry.hiddenBy,
    renderOrder: mesh.renderOrder,
    layersMask: mesh.layers.mask,
    frustumCulled: mesh.frustumCulled,
    worldPosition: worldPos.toArray().map((n) => Number(n.toFixed(3))),
    worldScale: worldScale.toArray().map((n) => Number(n.toFixed(3))),
    materialIsArray: Array.isArray(mesh.material),
  });
  console.log(`${LOG} ${label} ancestry (mesh → root):`, ancestry.chain);
  materialsOf(mesh).forEach((m, i) => {
    console.log(`${LOG} ${label} material[${i}]`, describeMaterial(m));
  });

  if (!ancestry.attachedToLiveScene) {
    console.warn(
      `${LOG} ${label} is NOT under the live r3f scene — you are looking at a ` +
      `different instance than the one being drawn.`
    );
  }
  if (ancestry.hiddenBy) {
    console.warn(`${LOG} ${label} is hidden: ancestor "${ancestry.hiddenBy}" has visible=false`);
  }
};

/**
 * Re-read the material at +1 frame and +500ms. If the uuid stops matching the debug
 * material, some other path re-assigned it and the timestamp says roughly when.
 */
const scheduleMaterialAudit = (mesh, expectedMaterial, label) => {
  const check = (when) => {
    const current = materialsOf(mesh)[0];
    const stillOurs = current === expectedMaterial;
    const line = `${LOG} ${label} @${when}: material=${current?.type}/${current?.name || '—'} ` +
      `uuid=${current?.uuid?.slice(0, 8)} stillDebugMaterial=${stillOurs}`;
    if (stillOurs) console.log(line, describeMaterial(current));
    else console.warn(`${line}  ← OVERWRITTEN`, describeMaterial(current));
  };
  requestAnimationFrame(() => check('next rAF'));
  setTimeout(() => check('+500ms'), 500);
};

/**
 * The decisive test: temporarily hook onBeforeRender and count actual draw calls.
 * Zero calls in ~1s => the mesh is not rendered at all (hidden, culled, detached,
 * or showWholeCrystal is false). Non-zero + no magenta on screen => it IS drawing
 * and the pixels are being occluded or covered by another layer.
 */
const probeDrawCall = (mesh, label) => {
  const previous = mesh.onBeforeRender;
  let fired = 0;
  let first = null;

  mesh.onBeforeRender = function probe(renderer, renderScene, camera, geometry, mat, group) {
    fired += 1;
    if (!first) {
      first = { material: mat?.name || mat?.type, camera: camera?.name || camera?.type };
    }
    if (typeof previous === 'function') {
      previous.call(this, renderer, renderScene, camera, geometry, mat, group);
    }
  };

  setTimeout(() => {
    mesh.onBeforeRender = previous;
    if (fired === 0) {
      console.error(
        `${LOG} ${label} was NEVER submitted to a draw call in ~1s — it is not being ` +
        `rendered. Check visible/ancestors/showWholeCrystal/frustum culling above.`
      );
    } else {
      console.log(
        `${LOG} ${label} drew ${fired}x in ~1s`, first,
        '→ the mesh IS rendering. If you still see no magenta it is occluded or covered.'
      );
    }
  }, 1000);
};

/**
 * Find other meshes sitting on the same transform or sharing the same geometry —
 * i.e. a clone of the crystal that is the thing actually on screen.
 */
const scanForDuplicates = (mesh) => {
  const rootScene = ctx.getRootScene?.();
  if (!rootScene) {
    console.warn(`${LOG} no live scene available — cannot scan for duplicate meshes`);
    return;
  }
  const targetPos = new THREE.Vector3();
  mesh.getWorldPosition(targetPos);

  const matches = [];
  let meshCount = 0;
  rootScene.traverse((node) => {
    if (!node.isMesh) return;
    meshCount += 1;
    if (node === mesh) return;
    const p = new THREE.Vector3();
    node.getWorldPosition(p);
    const sameGeometry = node.geometry?.uuid === mesh.geometry?.uuid;
    const sameSpot = p.distanceTo(targetPos) < 0.01;
    const sameVertexCount =
      node.geometry?.attributes?.position?.count === mesh.geometry?.attributes?.position?.count;
    if (sameGeometry || (sameSpot && sameVertexCount)) {
      matches.push({
        name: node.name,
        uuid: node.uuid,
        geometryUuid: node.geometry?.uuid,
        sameGeometry,
        sameSpot,
        visible: node.visible,
        material: materialsOf(node)[0]?.type,
      });
    }
  });

  console.log(`${LOG} scanned ${meshCount} mesh(es) in the live scene`);
  if (matches.length) {
    console.warn(`${LOG} POSSIBLE DUPLICATE/CLONE of the crystal:`, matches);
  } else {
    console.log(`${LOG} no duplicate/clone crystal meshes found — target is unique`);
  }
};

/**
 * Log every geometry attribute on each mesh under `root`, plus a breakdown of the
 * color attribute if one made it through.
 */
export const inspectEdgeWearAttributes = (root, label = 'wholeCrystal') => {
  if (!root) {
    console.log(`${LOG} ${label}: no scene`);
    return;
  }
  let meshCount = 0;
  root.traverse((child) => {
    if (!child?.isMesh || !child.geometry) return;
    meshCount += 1;
    const geometry = child.geometry;
    const meshLabel = `${label}/"${child.name || 'mesh'}"`;
    console.log(
      `${LOG} ${meshLabel} attributes:`,
      Object.keys(geometry.attributes),
      { indexed: !!geometry.index, positions: geometry.attributes.position?.count }
    );

    const summary = summariseColorAttribute(geometry);
    if (!summary) {
      console.warn(`${LOG} ${meshLabel} has NO geometry.attributes.color`);
      return;
    }
    console.log(`${LOG} ${meshLabel} color attribute:`, summary);
    if (summary.between > 0) {
      console.warn(
        `${LOG} ${summary.between} vertices hold non-binary mask values ` +
        `(expected only ~0 or ~1) — run __setEdgeWearDebug('strict') to see them in red.`
      );
    }

    // The real material must NOT be consuming this attribute as a colour tint.
    materialsOf(child).forEach((mat, i) => {
      if (mat?.vertexColors && !isDebugMaterial(mat)) {
        console.warn(
          `${LOG} ${meshLabel} mat[${i}] (${mat.type}) has vertexColors=true — ` +
          `the mask is tinting the crystal. Expected false.`
        );
      }
    });
  });
  console.log(`${LOG} ${label}: ${meshCount} mesh(es) inspected`);
};

/**
 * Should this mesh be showing a debug material right now? Called by the central
 * material-assignment path so tier/focus/config updates re-apply the debug material
 * instead of clobbering it. `intendedMaterial` is what that path was about to set —
 * we remember it as the restore target so toggling off returns the correct material.
 */
export const getEdgeWearDebugOverride = (mesh, intendedMaterial) => {
  if (!import.meta.env.DEV) return null;
  if (!debugMode || !mesh || !targets.has(mesh)) return null;
  if (intendedMaterial && !isDebugMaterial(intendedMaterial)) {
    mesh.userData.__edgeWearOriginalMaterial = intendedMaterial;
  }
  return materialForMode(debugMode);
};

/**
 * Swap the whole-crystal meshes to (or back from) a debug material.
 * Only meshes that carry a color attribute are targeted, so a missing attribute can
 * never produce an unbound-attribute draw.
 */
export const applyEdgeWearMaskDebug = (root, mode, { verbose = false } = {}) => {
  if (!root) return;
  const material = materialForMode(mode);
  const enabled = !!material;

  const touched = [];
  root.traverse((child) => {
    if (!child?.isMesh || !child.geometry) return;
    if (enabled && !child.geometry.attributes.color) return;

    if (enabled) {
      targets.add(child);
      const current = materialsOf(child)[0];
      // Never record a debug material as the thing to restore.
      if (current && !isDebugMaterial(current)) {
        child.userData.__edgeWearOriginalMaterial = child.material;
      }
      if (child.material !== material) child.material = material;
      material.needsUpdate = true;
      touched.push(child);
    } else if (child.userData.__edgeWearOriginalMaterial) {
      child.material = child.userData.__edgeWearOriginalMaterial;
      delete child.userData.__edgeWearOriginalMaterial;
      targets.delete(child);
      touched.push(child);
    } else if (isDebugMaterial(materialsOf(child)[0])) {
      console.warn(
        `${LOG} "${child.name}" still holds a debug material but no stored original — ` +
        `cannot restore automatically. Reload the page.`
      );
      targets.delete(child);
    }
  });

  if (!verbose) return;

  // Note: whether the frameloop is running is answered by probeDrawCall below
  // (a paused canvas reports zero draw calls), so it isn't read off the renderer.
  console.log(`${LOG} mode -> ${mode || 'off'} (${touched.length} mesh(es) touched)`);
  touched.forEach((mesh) => {
    auditMesh(mesh, 'target');
    if (enabled) {
      scanForDuplicates(mesh);
      scheduleMaterialAudit(mesh, material, 'target');
      probeDrawCall(mesh, 'target');
    }
  });
};

export const getEdgeWearDebugMode = () => debugMode;

/**
 * Install the DEV console handles. Mirrors the existing `window.__setFlatNormals`
 * pattern so the toggle is available without a rebuild:
 *   __setEdgeWearDebug('solid')  opaque magenta — proves the mesh is drawn at all
 *   __setEdgeWearDebug('mask')   raw authored mask: black = facet, white = bevel
 *   __setEdgeWearDebug('strict') same, but non-binary values render red
 *   __setEdgeWearDebug('wear')   FINAL wear incl. distance falloff, continuous
 *                                grayscale: black -> gray ramp -> white at the bevel
 *   __setEdgeWearDebug(false)    restore the real crystal material
 *   __inspectEdgeWear()          re-log the attribute dump + mesh audit
 */
export const installEdgeWearMaskDebug = (accessors) => {
  if (!import.meta.env.DEV || typeof globalThis === 'undefined') return undefined;
  ctx = { ...ctx, ...accessors };

  globalThis.__setEdgeWearDebug = (mode) => {
    const normalised =
      mode === true ? 'mask' : (mode === false || mode == null) ? false : mode;
    if (normalised && !['solid', 'mask', 'strict', 'wear'].includes(normalised)) {
      console.warn(
        `${LOG} unknown mode "${normalised}" — use 'solid' | 'mask' | 'strict' | 'wear' | false`
      );
      return debugMode;
    }
    debugMode = normalised;
    applyEdgeWearMaskDebug(ctx.getTargetRoot(), debugMode, { verbose: true });
    return debugMode;
  };

  globalThis.__inspectEdgeWear = () => {
    const root = ctx.getTargetRoot();
    inspectEdgeWearAttributes(root, 'wholeCrystal');
    root?.traverse((child) => {
      if (child.isMesh) {
        auditMesh(child, 'wholeCrystal');
        scanForDuplicates(child);
      }
    });
  };

  return () => {
    delete globalThis.__setEdgeWearDebug;
    delete globalThis.__inspectEdgeWear;
  };
};
