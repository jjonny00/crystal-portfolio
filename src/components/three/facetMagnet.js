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
// Per frame this is a projection and an unprojection for six facets with
// scratch vectors only: no allocation, no raycast, and nothing at all once the
// magnet is idle and every offset has decayed.

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const EPSILON_SQ = 1e-10

const _center = new THREE.Vector3()
const _ndc = new THREE.Vector3()
const _cursor = new THREE.Vector3()
const _desired = new THREE.Vector3()
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
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < reach) {
        const influence = 1 - THREE.MathUtils.smoothstep(distance, 0, reach)
        _cursor
          .set((pointer.x / size.width) * 2 - 1, -(pointer.y / size.height) * 2 + 1, _ndc.z)
          .unproject(camera)
        _desired.subVectors(_cursor, _center).multiplyScalar(config.strength * influence)
        const max = config.maxOffset
        if (_desired.lengthSq() > max * max) _desired.setLength(max)

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
