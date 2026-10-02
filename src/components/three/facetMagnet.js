// Overview cursor magnetism: facets near the pointer lean a little toward it.
//
// The scene's overview writer computes each facet's rest target (config
// position + idle float, anchor-adjusted) and lerps the facet toward it. This
// module only offsets that target, so the existing lerp still owns the motion
// and the pull composes with the float instead of fighting it.
//
// Proximity is measured on screen from the facet's *rest* centre, never its
// current position — measuring from where the pull has already moved it would
// feed back into itself. The pull is the gap between that centre and the cursor
// unprojected to the same depth, scaled by a falloff that is zero at the facet
// and at the edge of its reach, so it eases in as the cursor approaches, peaks
// near the facet's silhouette and settles back to nearly centred when the cursor
// is right over it.
//
// The facets the cursor is *not* closing in on give way instead. Each facet's
// engagement is how close the cursor is to it; a facet that another one
// out-engages is pushed away from the cursor and its own pull fades, in
// proportion to the gap. The facet with the cursor's attention is never
// out-engaged, so its pull is untouched, and two facets the cursor sits between
// are level, so sliding from one to the next hands over without a flip. It is read from the previous frame, which saves a second
// pass over the facets and is a lag nobody can see.
//
// Per frame this is a projection and an unprojection for six facets with
// scratch vectors only: no allocation, no raycast, and nothing at all once the
// magnet is idle and every offset has decayed.

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const EPSILON_SQ = 1e-10
// Scales the engagement gap into how fully a facet gives way. Neighbours sit
// close enough to share some of the cursor's reach; without the gain their
// own pull and the push roughly cancel and they just hang there.
const DOMINANCE_GAIN = 2

const _center = new THREE.Vector3()
const _ndc = new THREE.Vector3()
const _cursor = new THREE.Vector3()
const _desired = new THREE.Vector3()
const _repel = new THREE.Vector3()
const _localOrigin = new THREE.Vector3()
const _box = new THREE.Box3()
const _zero = new THREE.Vector3()

export const createFacetMagnet = () => ({
  active: false,
  wasActive: false,
  // Smoothed pull per facet, in the facets' parent space.
  offsets: [],
  // Each facet's visual centre in its own local space. The group origin is the
  // model's pivot, not the middle of the shard, so distance is taken from here.
  localCenters: [],
  // How close the cursor is to each facet (0–1), written by applyFacetMagnet
  // and read back next frame to find the facets that dominate.
  engagement: [],
  leaderIndex: -1,
  leaderEngagement: 0,
  runnerUpEngagement: 0,
  parentInverse: new THREE.Matrix4(),
})

/**
 * Tracks the mouse across the window rather than through the canvas, since the
 * DOM content layer sits over the canvas and swallows its pointer events.
 * Touch is ignored (no hover to speak of); leaving the window releases the pull.
 */
export const useWindowPointer = (enabled) => {
  const pointerRef = useRef({ x: 0, y: 0, inside: false })

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return undefined
    const pointer = pointerRef.current

    const handleMove = (event) => {
      if (event.pointerType === 'touch') return
      pointer.x = event.clientX
      pointer.y = event.clientY
      pointer.inside = true
    }
    const handleOut = (event) => {
      if (!event.relatedTarget) pointer.inside = false
    }
    const handleBlur = () => {
      pointer.inside = false
    }

    window.addEventListener('pointermove', handleMove, { passive: true })
    document.addEventListener('pointerout', handleOut, { passive: true })
    window.addEventListener('blur', handleBlur)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      document.removeEventListener('pointerout', handleOut)
      window.removeEventListener('blur', handleBlur)
      pointer.inside = false
    }
  }, [enabled])

  return pointerRef
}

/** Call once per frame, before the facet loop. */
export const beginFacetMagnetFrame = (magnet, active, parent) => {
  // Re-measure the facet centres on every way in, so a model swapped by a tier
  // change since the last visit is measured fresh.
  if (active && !magnet.wasActive) magnet.localCenters.length = 0
  magnet.wasActive = active
  magnet.active = active && Boolean(parent)
  if (magnet.active) magnet.parentInverse.copy(parent.matrixWorld).invert()

  let leaderIndex = -1
  let leader = 0
  let runnerUp = 0
  magnet.engagement.forEach((value, index) => {
    if (value > leader) {
      runnerUp = leader
      leader = value
      leaderIndex = index
    } else if (value > runnerUp) {
      runnerUp = value
    }
  })
  magnet.leaderIndex = leaderIndex
  magnet.leaderEngagement = leader
  magnet.runnerUpEngagement = runnerUp
}

const measureLocalCenter = (facet) => {
  _box.setFromObject(facet)
  if (_box.isEmpty()) return new THREE.Vector3()
  return facet.worldToLocal(_box.getCenter(new THREE.Vector3()))
}

/**
 * Returns the target to steer facet `index` toward: `restLocal` itself while
 * there is no pull, otherwise `out` filled with rest + pull. Never mutates
 * `restLocal` (it can be a shared config vector).
 */
export const applyFacetMagnet = (magnet, index, facet, restLocal, out, frame) => {
  const { camera, pointer, size, config, deltaTime } = frame
  let offset = magnet.offsets[index]

  _desired.set(0, 0, 0)
  magnet.engagement[index] = 0
  if (magnet.active && pointer.inside && size.width > 0 && size.height > 0) {
    let localCenter = magnet.localCenters[index]
    if (!localCenter) {
      localCenter = measureLocalCenter(facet)
      magnet.localCenters[index] = localCenter
    }

    const parentMatrix = facet.parent.matrixWorld
    _center
      .copy(localCenter)
      .multiply(facet.scale)
      .applyQuaternion(facet.quaternion)
      .add(restLocal)
      .applyMatrix4(parentMatrix)
    _ndc.copy(_center).project(camera)

    if (_ndc.z > -1 && _ndc.z < 1) {
      const dx = pointer.x - (_ndc.x + 1) * 0.5 * size.width
      const dy = pointer.y - (1 - _ndc.y) * 0.5 * size.height
      const reach = config.radius * size.height
      const repelReach = (config.repelRadius ?? 0) * size.height
      const distance = Math.sqrt(dx * dx + dy * dy)
      const influence = distance < reach ? 1 - THREE.MathUtils.smoothstep(distance, 0, reach) : 0
      magnet.engagement[index] = influence

      // How far some *other* facet out-engages this one.
      const othersEngagement = magnet.leaderIndex === index
        ? magnet.runnerUpEngagement
        : magnet.leaderEngagement
      const dominance = Math.min(1, Math.max(0, othersEngagement - influence) * DOMINANCE_GAIN)
      const repelInfluence = distance < repelReach && config.repel > 0
        ? dominance * (1 - THREE.MathUtils.smoothstep(distance, 0, repelReach))
        : 0

      if (influence > 0 || repelInfluence > 0) {
        _cursor
          .set((pointer.x / size.width) * 2 - 1, -(pointer.y / size.height) * 2 + 1, _ndc.z)
          .unproject(camera)
        const max = config.maxOffset
        _desired
          .subVectors(_cursor, _center)
          .multiplyScalar(config.strength * influence * (1 - dominance))
        if (_desired.lengthSq() > max * max) _desired.setLength(max)
        if (repelInfluence > 0) {
          _repel.subVectors(_center, _cursor)
          if (_repel.lengthSq() > EPSILON_SQ) {
            _desired.add(_repel.setLength(config.repel * repelInfluence))
            if (_desired.lengthSq() > max * max) _desired.setLength(max)
          }
        }

        // World pull → parent space (the facets group can be rotated/scaled).
        _localOrigin.copy(_center).applyMatrix4(magnet.parentInverse)
        _desired.add(_center).applyMatrix4(magnet.parentInverse).sub(_localOrigin)
      }
    }
  }

  if (!offset) {
    if (_desired.lengthSq() < EPSILON_SQ) return restLocal
    offset = magnet.offsets[index] = new THREE.Vector3()
  }

  const blend = 1 - Math.exp(-config.response * deltaTime)
  offset.lerp(_desired, blend)
  if (offset.lengthSq() < EPSILON_SQ && _desired.equals(_zero)) {
    offset.set(0, 0, 0)
    return restLocal
  }
  return out.copy(restLocal).add(offset)
}
