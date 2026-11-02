// src/components/three/CrystalDebris.jsx
// The explosion's debris: slender shards and fine chips of crystal (the
// shard_*/chip_* GLBs) that break off with the six project fragments, trail them
// out of the crystal, and hang about them in the overview.
//
// Every piece belongs to one fragment and follows it rather than a clock of its
// own. Its place is an authored offset from that fragment's centre (debris.items,
// laid out against the overview composition); each frame it closes on that place
// through a critically damped spring with its own lag. So when the fragment
// moves fast (the burst, the reform's last rush home) its debris strings out
// behind it along its path, and when it drifts (the overview float, the cursor
// magnet) the debris drifts with it, a beat behind. The offset and size follow
// how far the fragment is from its place in the whole crystal: the pieces come
// out of the crack with it. The reform plays that backwards: each piece's way
// out shrinks in step with its fragment's way home, so they arrive together.
//
// The larger pieces (debris.seatFrom) start as part of the whole crystal: each
// sits flat on one of its facet's outer faces, sunk just under it (hidden in the
// glass), rides the facet out through the crack, and breaks off it as the facet
// travels on, lifting straight off the face before it heads for its place. The
// reform sets them back on their faces. Every piece is kept out of the facets
// (debris.collide).
//
// A piece keeps its authored turn, and only rolls slowly about its own length
// (quicker while it is moving), so the shards stay pointed the way they were
// flung, as the fragments barely turn.
//
// One InstancedMesh per model, all on one material (a clone of the crystal
// material with the internal glow, made by UnifiedCrystalScene), whose emissive
// follows the fragments' flare at the crack and their glow as they reform.
// Mounted inside the fragments' group, and in its space, so it shares their
// visibility and mount.

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { advanceExplosionClock } from '../../lib/explosionTime';
import { frameEase } from '../../utils/frameEase';
import { HERO_RETURN_CINEMATIC } from '../../config/heroOverviewCinematicConfig';

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smoothstep = (a, b, x) => {
  const t = clamp01((x - a) / Math.max(b - a, 1e-6));
  return t * t * (3 - 2 * t);
};
// A fixed, well-spread value in [0, 1) per piece and channel.
const hash01 = (index, channel) => {
  const s = Math.sin(index * 91.3 + channel * 417.9) * 24634.6345;
  return s - Math.floor(s);
};

/**
 * The debris from its models ({ name: gltf scene }) and items: one InstancedMesh
 * per model in use, and a record per piece. The models are one mesh each, a unit
 * long on Y about their volume centroid.
 */
export const buildCrystalDebris = (modelScenes, items = []) => {
  const shapes = new Map();
  const pieces = [];
  items.forEach((item, index) => {
    const scene = modelScenes[item?.model];
    const authored = Array.isArray(item.rest) && Array.isArray(item.seat);
    if (!scene || (!authored && !Array.isArray(item.offset)) || !Array.isArray(item.turn)) return;
    let shape = shapes.get(item.model);
    if (!shape) {
      let source = null;
      scene.updateMatrixWorld(true);
      scene.traverse((child) => { if (!source && child.isMesh) source = child; });
      if (!source) return;
      const geometry = source.geometry.clone().applyMatrix4(source.matrixWorld);
      // The models carry no UVs, and the crystal material's normal map reads
      // them: lay its texture flat across the piece's face (X by Y).
      if (!geometry.getAttribute('uv')) {
        const positions = geometry.getAttribute('position');
        const uv = new Float32Array(positions.count * 2);
        for (let i = 0; i < positions.count; i += 1) {
          uv[i * 2] = positions.getX(i) + 0.5;
          uv[i * 2 + 1] = positions.getY(i) + 0.5;
        }
        geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      }
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
      // The middle of its length: the point the layout places, which the volume
      // centroid (the origin) is not, on a piece that tapers to a tip.
      const { min, max } = geometry.boundingBox;
      shape = { geometry, middle: (min.y + max.y) / 2, front: max.z, count: 0 };
      shapes.set(item.model, shape);
    }
    pieces.push({
      facet: item.facet,
      model: item.model,
      instance: shape.count,
      offset: new THREE.Vector3().fromArray(item.offset ?? [0, 0, 0]),
      // Authored in the parent facet's own space: where it sits in the crystal
      // (seat, seatTurn) and where it rests (rest, turn), so it moves and turns
      // with its parent.
      seatLocal: authored ? new THREE.Vector3().fromArray(item.seat) : null,
      seatTurn: authored && Array.isArray(item.seatTurn) ? new THREE.Quaternion().fromArray(item.seatTurn).normalize() : null,
      restLocal: authored ? new THREE.Vector3().fromArray(item.rest) : null,
      // Its own share of its parent's magnet pull, instead of one by its size.
      magnetFollow: Number.isFinite(item.magnetFollow) ? item.magnetFollow : null,
      // Or its own blend of several facets' pulls (by facet key), for a piece
      // between two facets that the magnet can draw together: it rides the gap.
      magnetShare: item.magnetShare && typeof item.magnetShare === 'object' ? Object.entries(item.magnetShare) : null,
      // Where it rests instead while a project is selected (by that project's
      // facet key), as an offset from `rest` in the same space.
      selectShift: authored && item.select
        ? Object.entries(item.select)
          .filter(([, sel]) => Array.isArray(sel?.rest))
          .map(([key, sel]) => [key, new THREE.Vector3().fromArray(sel.rest).sub(new THREE.Vector3().fromArray(item.rest))])
        : null,
      length: item.length ?? 0.1,
      turn: new THREE.Quaternion().fromArray(item.turn).normalize(),
      middle: shape.middle,
      front: shape.front,
      seed: index,
      seat: null,
      lagShare: hash01(index, 1),
      spinShare: hash01(index, 2),
      spinDirection: hash01(index, 3) < 0.5 ? -1 : 1,
      floatPhase: new THREE.Vector3(hash01(index, 4), hash01(index, 5), hash01(index, 6)).multiplyScalar(Math.PI * 2),
    });
    shape.count += 1;
  });
  const meshes = {};
  shapes.forEach((shape, model) => {
    const mesh = new THREE.InstancedMesh(shape.geometry, undefined, shape.count);
    mesh.name = `crystal-debris-${model}`;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    // The instances move every frame; a bounding sphere measured once would cull
    // them wherever they have gone since.
    mesh.frustumCulled = false;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    meshes[model] = mesh;
  });
  return { meshes: Object.values(meshes), meshByModel: meshes, pieces };
};

const _m = new THREE.Matrix4();
const _facetMatrix = new THREE.Matrix4();
const _rootInverse = new THREE.Matrix4();
const _relative = new THREE.Matrix4();
const _target = new THREE.Vector3();
const _gap = new THREE.Vector3();
const _vertex = new THREE.Vector3();
const _place = new THREE.Vector3();
const _middle = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _qSeat = new THREE.Quaternion();
// Separate from _q: slerpQuaternions(a, b) copies a into its target first, so
// a target that is also b blends a with itself.
const _qRest = new THREE.Quaternion();
const _seatPosition = new THREE.Vector3();
const _local = new THREE.Vector3();
const _lift = new THREE.Vector3();
const _lifted = new THREE.Vector3();
const _push = new THREE.Vector3();
const _roll = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _world = new THREE.Vector3();
const _camForward = new THREE.Vector3();
const _Y = new THREE.Vector3(0, 1, 0);

// A fragment's centre in its own space: the middle of its meshes' extent, from
// their vertices (as the layout was measured).
const measureFacetCentre = (root) => {
  root.updateMatrixWorld(true);
  _rootInverse.copy(root.matrixWorld).invert();
  const min = new THREE.Vector3(Infinity, Infinity, Infinity);
  const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
  root.traverse((child) => {
    const positions = child.isMesh ? child.geometry?.getAttribute('position') : null;
    if (!positions) return;
    _relative.multiplyMatrices(_rootInverse, child.matrixWorld);
    for (let i = 0; i < positions.count; i += 1) {
      _vertex.fromBufferAttribute(positions, i).applyMatrix4(_relative);
      min.min(_vertex);
      max.max(_vertex);
    }
  });
  return min.x <= max.x ? min.add(max).multiplyScalar(0.5) : null;
};

// A model's triangles in its root's space, from the meshes `pick` chooses.
const collectTriangles = (root, pick = (meshes) => meshes) => {
  root.updateMatrixWorld(true);
  const rootInverse = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const meshes = [];
  root.traverse((child) => { if (child.isMesh && child.geometry?.getAttribute('position')) meshes.push(child); });
  const triangles = [];
  pick(meshes).forEach((mesh) => {
    const relative = new THREE.Matrix4().multiplyMatrices(rootInverse, mesh.matrixWorld);
    const positions = mesh.geometry.getAttribute('position');
    const index = mesh.geometry.index;
    const count = index ? index.count : positions.count;
    const corner = (i) => new THREE.Vector3().fromBufferAttribute(positions, index ? index.getX(i) : i).applyMatrix4(relative);
    for (let i = 0; i + 2 < count; i += 3) {
      const triangle = new THREE.Triangle(corner(i), corner(i + 1), corner(i + 2));
      const area = triangle.getArea();
      if (area < 1e-6) continue;
      triangles.push({ triangle, area, normal: triangle.getNormal(new THREE.Vector3()), centroid: triangle.getMidpoint(new THREE.Vector3()) });
    }
  });
  return triangles;
};

// The facet's own body: its largest mesh, not the artwork face or its overlay.
const largestMesh = (meshes) => {
  const triangleCount = (mesh) => (mesh.geometry.index ?? mesh.geometry.getAttribute('position')).count;
  return meshes.length ? [meshes.reduce((a, b) => (triangleCount(b) > triangleCount(a) ? b : a))] : [];
};

// A facet's faces that are the whole crystal's outside: the ones lying on one of
// its faces. The rest are fracture faces between facets, inside the crystal.
const outerFaces = (facetTriangles, crystalTriangles) => {
  const closest = new THREE.Vector3();
  const faces = facetTriangles.filter((face) => crystalTriangles.some((outer) => (
    outer.normal.dot(face.normal) > 0.95
    && Math.abs(_gap.subVectors(face.centroid, outer.triangle.a).dot(outer.normal)) < 0.02
    && outer.triangle.closestPointToPoint(face.centroid, closest).distanceTo(face.centroid) < 0.05
  )));
  return faces.length ? faces : facetTriangles;
};

/**
 * Where a piece sits in the whole crystal: flat on one of its facet's outer
 * faces, sunk just under it, its length along the face's longest edge. The face
 * is the one that looks most squarely at where the piece lands (`centre` plus
 * its offset, in the facet's space), among those big enough to hold it, and not
 * one a sibling already took if another will do. A piece that lifts off a face
 * its landing spot is in front of never passes back through its facet on the
 * way: the facet is convex, so once past that face's plane it is outside it.
 */
const seatPiece = (piece, faces, taken, centre, { width, scale }) => {
  const lands = new THREE.Vector3().copy(centre).add(piece.offset);
  const toward = new THREE.Vector3();
  const size = piece.length * scale;
  const footprint = size * size * width * 0.12;
  let best = -1;
  let bestScore = -Infinity;
  faces.forEach((face, i) => {
    toward.subVectors(lands, face.centroid).normalize();
    const score = face.normal.dot(toward) - (face.area >= footprint ? 0 : 1) - (taken.get(i) ?? 0) * 0.5;
    if (score > bestScore) { bestScore = score; best = i; }
  });
  if (best < 0) return null;
  taken.set(best, (taken.get(best) ?? 0) + 1);
  const { triangle, normal, centroid } = faces[best];
  // A point on the face, drawn toward its middle so the piece stays on it.
  let u = hash01(piece.seed, 11);
  let v = hash01(piece.seed, 12);
  if (u + v > 1) { u = 1 - u; v = 1 - v; }
  const point = triangle.a.clone()
    .addScaledVector(_gap.subVectors(triangle.b, triangle.a), u)
    .addScaledVector(_vertex.subVectors(triangle.c, triangle.a), v)
    .lerp(centroid, 0.6);
  const edges = [[triangle.a, triangle.b], [triangle.b, triangle.c], [triangle.c, triangle.a]]
    .map(([p, q]) => new THREE.Vector3().subVectors(q, p));
  const along = edges.reduce((a, b) => (b.lengthSq() > a.lengthSq() ? b : a));
  along.addScaledVector(normal, -along.dot(normal)).normalize();
  const across = new THREE.Vector3().crossVectors(along, normal);
  const turn = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(across, along, normal));
  const sink = piece.front * size * width + 0.01;
  return { position: point.addScaledVector(normal, -sink), normal: normal.clone(), sink, turn };
};

// A facet's hull, for keeping the debris out of it: the planes of its faces
// (the facets are Voronoi cells, so convex: a point is inside when it is behind
// every one), each pointing out, and its reach from its centre.
const measureFacetHull = (object, centre) => {
  const triangles = collectTriangles(object, (meshes) => meshes.filter((mesh) => mesh.visible && !/projectOverlay/.test(mesh.name)));
  const planes = [];
  let radius = 0;
  triangles.forEach(({ triangle, normal }) => {
    let constant = normal.dot(triangle.a);
    const outward = normal.clone();
    if (outward.dot(centre) - constant > 0) { outward.negate(); constant = -constant; }
    if (!planes.some((plane) => plane.normal.dot(outward) > 0.9995 && Math.abs(plane.constant - constant) < 1e-3)) {
      planes.push({ normal: outward, constant });
    }
    radius = Math.max(radius, triangle.a.distanceTo(centre), triangle.b.distanceTo(centre), triangle.c.distanceTo(centre));
  });
  return { planes, radius };
};

/**
 * Keeps a piece out of a facet: inside it, straight back out through the
 * nearest face; within `margin` of it, a cushion that gives way by
 * `softness` of the intrusion, so a facet drifting closer (the cursor magnet)
 * eases the piece aside instead of stopping it dead. Takes the part of its
 * velocity that runs into that face. A cheap sphere test first: most pieces are
 * nowhere near most facets.
 */
const pushOutOfFacet = (position, velocity, facet, margin, softness) => {
  const { hull } = facet;
  if (!hull?.planes.length) return;
  const reach = hull.radius + margin;
  if (position.distanceToSquared(facet.centre) > reach * reach) return;
  _local.copy(position).applyMatrix4(facet.inverse);
  let nearest = null;
  let depth = -Infinity;
  for (let p = 0; p < hull.planes.length; p += 1) {
    const plane = hull.planes[p];
    const d = plane.normal.dot(_local) - plane.constant;
    if (d > depth) { depth = d; nearest = plane; }
  }
  if (depth >= margin) return;
  // To the surface if inside, then the cushion: continuous at the surface, and
  // never closer than (1 - softness) of the margin.
  const surfaced = Math.max(depth, 0);
  const settled = surfaced + (margin - surfaced) * softness;
  _local.addScaledVector(nearest.normal, settled - depth);
  _push.copy(nearest.normal).applyQuaternion(facet.object.quaternion);
  const into = velocity.dot(_push);
  if (into < 0) velocity.addScaledVector(_push, -into);
  position.copy(_local).applyMatrix4(facet.matrix);
};

const CrystalDebris = ({
  debris,
  debrisConfig,
  crystalForm,
  selectedFacetKey,
  floatConfig,
  facetRefs,
  facetKeys,
  magnetRef,
  crystalScene,
  emissiveSourceRef,
  emissiveRestColor,
  emissiveFlareColor,
}) => {
  const { meshes, meshByModel, pieces } = debris;
  // Per piece: where it is and how fast it is moving (the spring), and how far
  // it has rolled. Per fragment: its measured centre, and the model measured.
  const stateRef = useRef(null);
  if (!stateRef.current || stateRef.current.pieces !== pieces) {
    stateRef.current = {
      pieces,
      position: pieces.map(() => new THREE.Vector3()),
      velocity: pieces.map(() => new THREE.Vector3()),
      roll: pieces.map(() => 0),
      // Per piece: its seat in the whole crystal (the larger pieces), in its
      // facet's space.
      seats: pieces.map(() => null),
      seatsConfig: undefined,
      crystalTriangles: null,
      facets: {},
      // Per facet key: how far toward its selected placement the debris is (0–1),
      // and how fast that is changing (a critically damped follow of the selection).
      select: {},
      // Per facet (by index): the cursor magnet's pull on it, eased as the facet
      // itself eases toward it, so a piece can take back part of its parent's.
      magnetLag: [],
      lastFrameMs: null,
      // Per piece: how far out of its facet it is (0 seated, 1 at its place).
      out: pieces.map(() => 0),
      // The reform: when it began, and how far each facet had to come home from.
      wholeSince: null,
      reformFrom: {},
      // A reform turned back before the facets were home eases the debris out
      // again until then.
      reverseUntil: 0,
    };
  }

  const objects = useMemo(() => meshes.map((mesh) => (
    <primitive key={mesh.name} object={mesh} dispose={null} />
  )), [meshes]);

  useFrame((state) => {
    const s = stateRef.current;
    if (!pieces.length) return;
    const cfg = debrisConfig ?? {};
    const now = performance.now();
    // After a gap (the group unmounted, the canvas frozen, a hidden tab), land
    // every piece on its place rather than spring across the scene.
    const snap = s.lastFrameMs == null || now - s.lastFrameMs > 250;
    // On the explosion's clock, so the debris slows with everything else through
    // its bullet time rather than catching up on the fragments in real time.
    const dt = snap ? 0 : Math.min(advanceExplosionClock(s.lastFrameMs, now).motion, 0.05);
    const realDt = s.lastFrameMs == null ? 0 : Math.max(0, now - s.lastFrameMs) / 1000;
    s.lastFrameMs = now;

    // The reform plays the explosion backwards: each piece comes in with its
    // facet, its way out shrinking in step with the facet's way home, so the two
    // arrive together. Turned back before the facets are home, the debris eases
    // out onto its explosion path again.
    // The selection's weights: toward 1 for the selected project's key, toward 0
    // for every other. Each follows its target over `selectSeconds` from wherever
    // it is, so a project-to-project move or an interrupted one never snaps, and
    // all of them back at 0 is exactly the overview placement.
    const selectOmega = 4 / Math.max(cfg.selectSeconds ?? 0.7, 0.05);
    const selectDt = Math.min(realDt, 0.1);
    if (selectedFacetKey && !s.select[selectedFacetKey]) s.select[selectedFacetKey] = { w: 0, v: 0 };
    Object.entries(s.select).forEach(([key, sel]) => {
      const goal = key === selectedFacetKey ? 1 : 0;
      if (snap) { sel.w = goal; sel.v = 0; return; }
      const decay = Math.exp(-selectOmega * selectDt);
      const gap = sel.w - goal;
      const tt = (sel.v + selectOmega * gap) * selectDt;
      sel.v = (sel.v - selectOmega * tt) * decay;
      sel.w = Math.min(1, Math.max(0, goal + (gap + tt) * decay));
      if (goal === 0 && sel.w < 1e-4) { sel.w = 0; sel.v = 0; }
    });
    // The facets' magnet pulls, lagged the way the facets follow them (the
    // scene's 0.04-per-frame ease toward their steered target).
    const magnetOffsets = magnetRef?.current?.offsets ?? [];
    const magnetEase = snap ? 1 : frameEase(cfg.magnet?.facetEase ?? 0.04, Math.min(realDt, 0.1));
    (facetRefs?.current ?? []).forEach((_, index) => {
      const lag = s.magnetLag[index] ?? (s.magnetLag[index] = new THREE.Vector3());
      const offset = magnetOffsets[index];
      if (offset) lag.lerp(offset, magnetEase);
      else lag.multiplyScalar(1 - magnetEase);
    });
    const [followMin, followMax] = cfg.magnet?.follow ?? [1, 1];
    const [followSizeMin, followSizeMax] = cfg.magnet?.size ?? [0.05, 0.45];

    const selectTotal = Object.values(s.select).reduce((sum, sel) => sum + sel.w, 0);
    const selectNorm = selectTotal > 1 ? 1 / selectTotal : 1;

    const whole = crystalForm === 'whole';
    const reformStarting = whole && s.wholeSince == null;
    const returnSeconds = Math.max(cfg.returnSeconds ?? 0.6, 1e-3);
    if (whole) {
      if (s.wholeSince == null) s.wholeSince = now;
    } else if (s.wholeSince != null) {
      if (now - s.wholeSince < HERO_RETURN_CINEMATIC.reformSeconds * 1000) s.reverseUntil = now + returnSeconds * 1000;
      s.wholeSince = null;
    }

    const [lagMin, lagMax] = cfg.lag ?? [0.12, 0.6];
    const [spinMin, spinMax] = cfg.idleSpin ?? [0.02, 0.07];
    const travelSpin = cfg.travelSpin ?? 0.6;
    const outReach = Math.max(cfg.outReach ?? 0.35, 1e-3);
    const floatAmp = (floatConfig?.baseAmplitude ?? 0.007) * (floatConfig?.overviewMultiplier ?? 1) * (cfg.floatMultiplier ?? 1);
    const elapsed = state.clock.elapsedTime;
    const camera = state.camera;
    camera.getWorldDirection(_camForward);
    const [fadeNear, fadeFar] = cfg.nearFade ?? [0.3, 1.1];
    const seatFrom = cfg.seatFrom ?? Infinity;
    const [releaseMin, releaseMax] = cfg.release?.at ?? [0.05, 0.45];
    const releaseSpan = Math.max(cfg.release?.span ?? 0.35, 1e-3);
    const restAlign = cfg.restAlign ?? 0;
    const liftShare = Math.min(Math.max(cfg.release?.lift ?? 0.25, 0.01), 0.99);

    // Seats are measured against the whole crystal, once, and again if the
    // config changes (a piece's size decides the face it can sit on).
    if (s.seatsConfig !== debrisConfig) {
      s.seatsConfig = debrisConfig;
      s.facets = {};
    }
    if (!s.crystalTriangles && crystalScene) s.crystalTriangles = collectTriangles(crystalScene);

    // Each fragment: where its centre is now, in the group's space, and how far
    // out of the crystal it is (0 seated, 1 clear of it).
    const live = {};
    (facetRefs?.current ?? []).forEach((ref, index) => {
      const object = ref?.current;
      const key = facetKeys?.[index];
      if (!object || !key) return;
      let facet = s.facets[key];
      if (!facet || facet.object !== object) {
        const centre = measureFacetCentre(object);
        if (!centre) return;
        facet = {
          object,
          centre,
          now: new THREE.Vector3(),
          matrix: new THREE.Matrix4(),
          inverse: new THREE.Matrix4(),
          hull: cfg.collide === false ? null : measureFacetHull(object, centre),
        };
        s.facets[key] = facet;
        // The larger pieces' seats on this facet's outer faces.
        pieces.forEach((piece, i) => {
          if (piece.facet !== key || !piece.seatLocal || !piece.seatTurn) return;
          const model = cfg.models?.[piece.model];
          const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(piece.seatTurn);
          const sink = piece.front * piece.length * (model?.scale ?? 1) * (model?.width ?? 1) + 0.01;
          s.seats[i] = { position: piece.seatLocal.clone().addScaledVector(normal, -sink), normal, sink, turn: piece.seatTurn };
        });
        const seated = pieces.map((piece, i) => [piece, i]).filter(([piece]) => piece.facet === key && !piece.seatLocal && piece.length >= seatFrom);
        if (seated.length && s.crystalTriangles) {
          const faces = outerFaces(collectTriangles(object, largestMesh), s.crystalTriangles);
          const taken = new Map();
          seated.forEach(([piece, i]) => {
            const model = cfg.models?.[piece.model];
            s.seats[i] = seatPiece(piece, faces, taken, centre, { width: model?.width ?? 1, scale: model?.scale ?? 1 });
          });
        }
      }
      facet.matrix.compose(object.position, object.quaternion, object.scale);
      facet.inverse.copy(facet.matrix).invert();
      facet.now.copy(facet.centre).applyMatrix4(facet.matrix);
      const travelled = facet.now.distanceTo(facet.centre);
      live[key] = {
        key,
        index,
        object,
        matrix: facet.matrix,
        inverse: facet.inverse,
        hull: object.visible ? facet.hull : null,
        centre: facet.now,
        travelled,
        visible: object.visible,
        out: object.visible ? smoothstep(0, outReach, travelled) : 0,
      };
    });

    const liveFacets = Object.values(live);
    if (reformStarting) liveFacets.forEach((facet) => { s.reformFrom[facet.key] = facet.travelled; });
    const collisionMargin = cfg.collisionMargin ?? 0.4;
    // How much of an intrusion into a facet's margin a piece gives way by: a
    // cushion that grows with the intrusion, rather than a hard stop.
    const collisionSoftness = Math.min(Math.max(cfg.collisionSoftness ?? 0.5, 0), 1);

    pieces.forEach((piece, i) => {
      const mesh = meshByModel[piece.model];
      const facet = live[piece.facet];
      if (!facet) {
        mesh.setMatrixAt(piece.instance, _m.makeScale(0, 0, 0));
        return;
      }
      const position = s.position[i];
      const velocity = s.velocity[i];
      const model = cfg.models?.[piece.model];
      const seat = s.seats[i];
      // A seated piece is part of its facet until the facet has travelled past
      // its release (a window spread across the pieces), then breaks off it for
      // its place. Any other piece comes out of the facet's middle, growing as
      // the facet clears the crystal. On the reform, both come in with the facet.
      const released = seat
        ? (facet.visible ? smoothstep(0, 1, (facet.travelled - THREE.MathUtils.lerp(releaseMin, releaseMax, hash01(piece.seed, 13))) / releaseSpan) : 0)
        : facet.out;
      let out = released;
      if (whole) {
        const from = s.reformFrom[piece.facet] ?? 0;
        out = Math.min(s.out[i], from > 1e-3 ? clamp01(facet.travelled / from) : 0);
      } else if (now < s.reverseUntil && !snap) {
        out = Math.min(released, s.out[i] + realDt / returnSeconds);
      }
      s.out[i] = out;
      // A seated piece lifts straight off its face over the first `lift` of its
      // way out, clear of the facet, then heads for its place.
      const away = seat ? smoothstep(liftShare, 1, out) : out;

      // Its size: a seated piece is whole from the start; any other grows as its
      // facet clears the crystal.
      const size = facet.visible ? piece.length * (model?.scale ?? 1) * (seat ? 1 : out) : 0;

      // Its place: beside the fragment (in the parent's own space when authored
      // so, turning with it), and drifting a little on its own.
      if (piece.restLocal) {
        _target.copy(piece.restLocal);
        piece.selectShift?.forEach(([key, shift]) => {
          const w = (s.select[key]?.w ?? 0) * selectNorm;
          if (w > 0) _target.addScaledVector(shift, w);
        });
        _target.applyMatrix4(facet.matrix);
        // The cursor magnet pulls the facet, and the facet carries its debris;
        // a smaller piece takes back more of that pull, so it drifts less.
        const lag = s.magnetLag[facet.index];
        if (lag && piece.magnetShare) {
          _target.sub(lag);
          piece.magnetShare.forEach(([key, share]) => {
            const other = s.magnetLag[live[key]?.index];
            if (other) _target.addScaledVector(other, share);
          });
        } else if (lag && (followMin < 1 || piece.magnetFollow != null)) {
          const sizeNow = piece.length * (model?.scale ?? 1);
          const follow = piece.magnetFollow
            ?? THREE.MathUtils.lerp(followMin, followMax, smoothstep(followSizeMin, followSizeMax, sizeNow));
          _target.addScaledVector(lag, follow - 1);
        }
      }
      else _target.copy(facet.centre).add(piece.offset);
      const amp = floatAmp * out;
      _target.x += Math.sin(elapsed * (floatConfig?.xFrequency ?? 0.9) * 1.3 + piece.floatPhase.x) * amp * (floatConfig?.xMultiplier ?? 1);
      _target.y += Math.sin(elapsed * (floatConfig?.yFrequency ?? 1.2) * 1.3 + piece.floatPhase.y) * amp;
      _target.z += Math.sin(elapsed * (floatConfig?.zFrequency ?? 0.7) * 1.3 + piece.floatPhase.z) * amp * (floatConfig?.zMultiplier ?? 1);
      // Drawn in from its seat, or from the facet's middle.
      if (seat) {
        _seatPosition.copy(seat.position).applyMatrix4(facet.matrix);
        _lift.copy(seat.normal).applyQuaternion(facet.object.quaternion);
        _lifted.copy(_seatPosition).addScaledVector(_lift, seat.sink + size * collisionMargin + 0.02);
        if (out < liftShare) _target.copy(_seatPosition).lerp(_lifted, out / liftShare);
        else _target.lerp(_lifted, 1 - (out - liftShare) / (1 - liftShare));
      } else {
        _target.lerp(facet.centre, 1 - out);
      }

      if (snap) {
        position.copy(_target);
        velocity.set(0, 0, 0);
      } else {
        // A critically damped spring onto the place, solved exactly for the step:
        // it lags a moving target without ever overshooting it.
        // Held fast while it is still part of its facet, and drawn in tighter
        // through the reform, so it keeps with the facet to the end.
        const lag = THREE.MathUtils.lerp(lagMin, lagMax, piece.lagShare) * (seat ? away : 1) * (whole ? out : 1);
        const omega = 2 / Math.max(lag, 1e-3);
        const decay = Math.exp(-omega * dt);
        _gap.subVectors(position, _target);
        const tx = (velocity.x + omega * _gap.x) * dt;
        const ty = (velocity.y + omega * _gap.y) * dt;
        const tz = (velocity.z + omega * _gap.z) * dt;
        velocity.set((velocity.x - omega * tx) * decay, (velocity.y - omega * ty) * decay, (velocity.z - omega * tz) * decay);
        position.set(_target.x + (_gap.x + tx) * decay, _target.y + (_gap.y + ty) * decay, _target.z + (_gap.z + tz) * decay);
      }

      // Kept out of the facets: any it has got into, and its own once it has
      // mostly broken away from it (until then it is coming out of it).
      if (out > 0.02 && !snap) {
        const margin = size * collisionMargin + 0.01;
        // A few passes, so a piece between two facets settles between them
        // rather than being pushed out of one into the other.
        for (let pass = 0; pass < 3; pass += 1) {
          for (let f = 0; f < liveFacets.length; f += 1) {
            const other = liveFacets[f];
            if (other.key === piece.facet && (seat ? out < liftShare : out < 0.5)) continue;
            pushOutOfFacet(position, velocity, other, margin, collisionSoftness);
          }
        }
      }

      // A very slow roll about its length at rest, quicker while it moves.
      s.roll[i] += piece.spinDirection
        * (THREE.MathUtils.lerp(spinMin, spinMax, piece.spinShare) + velocity.length() * travelSpin) * dt;
      if (seat && piece.restLocal) {
        // Both turns in the parent's space: it starts as the face it broke from
        // and eases to its own, a small tumble off that, turning with the parent.
        _qSeat.copy(facet.object.quaternion).multiply(seat.turn);
        _qRest.copy(facet.object.quaternion).multiply(piece.turn);
        _q.slerpQuaternions(_qSeat, _qRest, away).multiply(_roll.setFromAxisAngle(_Y, s.roll[i] * away));
      } else if (seat) {
        // From its turn in the facet to its own, keeping `restAlign` of the
        // facet's, so it still lies the way the face it broke from does.
        _qSeat.copy(facet.object.quaternion).multiply(seat.turn);
        _qRest.copy(piece.turn).slerp(_qSeat, restAlign);
        _q.slerpQuaternions(_qSeat, _qRest, away).multiply(_roll.setFromAxisAngle(_Y, s.roll[i] * away));
      } else {
        _q.copy(piece.turn).multiply(_roll.setFromAxisAngle(_Y, s.roll[i]));
      }

      // It shrinks away close to the camera, and is placed by the middle of its
      // length.
      _world.copy(position).applyMatrix4(mesh.matrixWorld);
      const depth = _world.sub(camera.position).dot(_camForward) - size / 2;
      const scale = size * smoothstep(fadeNear, fadeFar, depth);
      const width = scale * (model?.width ?? 1);
      _middle.set(0, piece.middle * scale, 0).applyQuaternion(_q);
      _place.copy(position).sub(_middle);
      mesh.setMatrixAt(piece.instance, _m.compose(_place, _q, _scale.set(width, scale, width)));
    });
    meshes.forEach((mesh) => { mesh.instanceMatrix.needsUpdate = true; });

    // The fragments' emissive: their flare at the crack and their glow as they
    // reform, on the debris' one shared material.
    const material = meshes[0]?.material;
    const source = emissiveSourceRef?.current?.[0];
    if (material?.emissive && source?.emissive && emissiveRestColor && emissiveFlareColor) {
      const base = source.userData?.baseEmissiveIntensity ?? 0;
      const intensity = source.emissiveIntensity;
      material.emissive.copy(emissiveRestColor).lerp(emissiveFlareColor, clamp01(intensity - base));
      material.emissiveIntensity = intensity;
    }
  });

  return <group name="crystal-debris">{objects}</group>;
};

export default CrystalDebris;
