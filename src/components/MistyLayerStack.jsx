import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'

/**
 * MistyLayerStack
 * - Renders N vertical, billboarded planes with a black-backed mist texture.
 * - Uses AdditiveBlending so black becomes effectively transparent.
 * - Super lightweight: MeshBasicMaterial, depthWrite=false, small UV drift + micro scale pulse.
 *
 * Props:
 *  - y: world y-position (vertical placement of the stack)
 *  - width: plane width in world units (span across view)
 *  - height: plane height in world units (controls how "tall" the mist band is)
 *  - layers: number of stacked planes (2–3 recommended)
 *  - opacity: overall opacity multiplier (0–1)
 *  - drift: { x: number, y: number } UV scroll speed per second (very small)
 *  - pulseAmp: scale pulse amplitude (tiny, e.g., 0.01)
 *  - pulseFreq: Hz for pulsing (e.g., 0.1–0.2)
 *  - zSpacing: small separation in Z between layers to minimize z-fighting
 *
 * Usage example:
 *  <MistyLayerStack y={-1} width={30} height={6} layers={3} />
 */
export default function MistyLayerStack({
  y = -1,
  width = 30,
  height = 6,
  layers = 3,
  opacity = 0.35,
  drift = { x: 0.002, y: 0.0 },
  pulseAmp = 0.01,
  pulseFreq = 0.12,
  zSpacing = 0.02,
  renderOrder = 999 // draw late
}) {
  const group = useRef()
  const mats = useRef([]) // store materials to animate offsets
  const planes = useRef([])

  const { camera, gl } = useThree()

  // Load the black-backed mist texture from public/ path
  const tex = useTexture('/assets/textures/58BA5A5C-1666-438F-AF79-F8885763DFB5.png')
  // Setup texture tiling so UV scroll loops
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  // If you're using three >= r152 with color management:
  if ('SRGBColorSpace' in THREE) {
    tex.colorSpace = THREE.SRGBColorSpace
  } else if ('encoding' in tex) {
    tex.encoding = THREE.sRGBEncoding
  }

  // Precompute small per-layer variations (scale, drift factor, offset seeds)
  const layerConfigs = useMemo(() => {
    const arr = []
    for (let i = 0; i < layers; i++) {
      const vary = 1 + (i - (layers - 1) / 2) * 0.06 // tiny width/height variation
      const df = 1 + i * 0.15 // drift factor per layer
      const seed = Math.random() * 1000
      arr.push({ vary, df, seed })
    }
    return arr
  }, [layers])

  // Billboard: always match camera rotation; subtle animation:
  useFrame((state, dt) => {
    if (!group.current) return
    // Billboard to camera (fast & stable)
    group.current.quaternion.copy(camera.quaternion)

    const t = state.clock.getElapsedTime()
    mats.current.forEach((mat, i) => {
      if (!mat?.map) return
      // Gentle UV drift (scroll texture)
      mat.map.offset.x = (mat.map.offset.x + drift.x * dt * layerConfigs[i].df) % 1
      mat.map.offset.y = (mat.map.offset.y + drift.y * dt * layerConfigs[i].df) % 1
    })

    // Micro pulsing on each plane’s scale for extra life
    planes.current.forEach((mesh, i) => {
      if (!mesh) return
      const { seed } = layerConfigs[i]
      const pulse = 1 + Math.sin((t + seed) * Math.PI * 2 * pulseFreq) * pulseAmp
      mesh.scale.set(mesh.userData.baseScaleX * pulse, mesh.userData.baseScaleY * pulse, 1)
    })
  })

  return (
    <group ref={group} position={[0, y, 0]}>
      {layerConfigs.map(({ vary }, i) => {
        return (
          <MistPlane
            key={i}
            ref={(el) => (planes.current[i] = el)}
            setMatRef={(m) => (mats.current[i] = m)}
            texture={tex}
            width={width * vary}
            height={height * vary}
            z={i * zSpacing}
            opacity={opacity * (1 - i * 0.08)} // back layers a touch fainter
            renderOrder={renderOrder + i}
            gl={gl}
          />
        )
      })}
    </group>
  )
}

const MistPlane = React.forwardRef(function MistPlane(
  { texture, width, height, z = 0, opacity = 0.35, renderOrder = 999, setMatRef },
  ref
) {
  const mat = useRef()

  // Material: MeshBasic + AdditiveBlending (black=transparent), no depth write
  // Keeping depthTest true usually works; depthWrite=false avoids writing into depth buffer
  // so the mist blends over objects behind it.
  const onMaterial = (m) => {
    if (!m) return
    m.transparent = true
    m.opacity = opacity
    m.depthWrite = false
    m.depthTest = true
    m.blending = THREE.AdditiveBlending
    m.toneMapped = false // keeps additive brightness consistent post-tonemap
    setMatRef?.(m)
  }

  return (
    <mesh
      ref={ref}
      position={[0, 0, z]}
      renderOrder={renderOrder}
      userData={{ baseScaleX: width, baseScaleY: height }}
      // We set scale via userData base values + pulse in useFrame
      scale={[width, height, 1]}
    >
      <planeGeometry args={[1, 1, 1, 1]} />
      <meshBasicMaterial
        ref={(el) => {
          mat.current = el
          onMaterial(el)
        }}
        map={texture}
      />
    </mesh>
  )
})
