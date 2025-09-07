import React, { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'

/**
 * MistyLayerStack - UPDATED with additive blending and recycling layers
 * - Renders multiple billboarded planes that drift to the left.
 * - As planes move off-screen they're recycled to the right for a constant mist.
 *
 * Props mirror the previous version with additions:
 *  - copies: number of horizontal stacks to maintain
 *  - speed: world drift speed to the left
 */
export default function MistyLayerStack({
  y = -1,
  width = 30,
  height = 6,
  layers = 3,
  copies = 3,
  speed = 0.5,
  opacity = 5.95,
  drift = { x: 0.002, y: 0.0 },
  pulseAmp = 0.01,
  pulseFreq = 0.12,
  zSpacing = 0.2,
  renderOrder = 2000
}) {
  const group = useRef()
  const segments = useRef([])
  const mats = useRef([])
  const planes = useRef([])

  const { camera, gl } = useThree()

  // Load the black-backed mist texture from the public assets path
  const tex = useTexture('/assets/textures/mist02.jpg')
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  if ('SRGBColorSpace' in THREE) {
    tex.colorSpace = THREE.SRGBColorSpace
  } else if ('encoding' in tex) {
    tex.encoding = THREE.sRGBEncoding
  }

  // Per-layer variations
  const layerConfigs = useMemo(() => {
    const arr = []
    for (let i = 0; i < layers; i++) {
      const vary = 1 + (i - (layers - 1) / 2) * 0.06
      const df = 1 + i * 0.15
      const seed = Math.random() * 1000
      arr.push({ vary, df, seed })
    }
    return arr
  }, [layers])

  // Reset refs when copy count changes
  useEffect(() => {
    segments.current = []
    mats.current = Array.from({ length: copies }, () => [])
    planes.current = Array.from({ length: copies }, () => [])
  }, [copies])

  // Billboard to camera, recycle segments and animate
  useFrame((state, dt) => {
    if (!group.current) return

    group.current.quaternion.copy(camera.quaternion)
    group.current.position.set(camera.position.x, y, camera.position.z)

    const t = state.clock.getElapsedTime()
    const leftBound = (-width * copies) / 2
    const fullWidth = width * copies

    segments.current.forEach((seg, s) => {
      if (!seg) return

      seg.position.x -= speed * dt
      if (seg.position.x < leftBound) {
        seg.position.x += fullWidth
      }

      mats.current[s]?.forEach((mat, i) => {
        if (!mat?.map) return
        mat.map.offset.x = (mat.map.offset.x + drift.x * dt * layerConfigs[i].df) % 1
        mat.map.offset.y = (mat.map.offset.y + drift.y * dt * layerConfigs[i].df) % 1
      })

      planes.current[s]?.forEach((mesh, i) => {
        if (!mesh) return
        const { seed } = layerConfigs[i]
        const pulse = 1 + Math.sin((t + seed) * Math.PI * 2 * pulseFreq) * pulseAmp
        mesh.scale.set(mesh.userData.baseScaleX * pulse, mesh.userData.baseScaleY * pulse, 1)
      })
    })
  })

  return (
    <group ref={group} position={[0, y, 0]}>
      {Array.from({ length: copies }).map((_, s) => (
        <group
          key={s}
          ref={(el) => (segments.current[s] = el)}
          position={[(s - Math.floor(copies / 2)) * width, 0, 0]}
        >
          {layerConfigs.map(({ vary }, i) => (
            <MistPlane
              key={`${s}-${i}`}
              ref={(el) => {
                if (!planes.current[s]) planes.current[s] = []
                planes.current[s][i] = el
              }}
              setMatRef={(m) => {
                if (!mats.current[s]) mats.current[s] = []
                mats.current[s][i] = m
              }}
              texture={tex}
              width={width * vary}
              height={height * vary}
              z={i * zSpacing}
              opacity={opacity * (1 - i * 0.08)}
              renderOrder={renderOrder + i}
              gl={gl}
            />
          ))}
        </group>
      ))}
    </group>
  )
}

const MistPlane = React.forwardRef(function MistPlane(
  { texture, width, height, z = 0, opacity = 0.35, renderOrder = 2000, setMatRef },
  ref
) {
  const mat = useRef()

  const onMaterial = (m) => {
    if (!m) return
    m.transparent = true
    m.opacity = opacity
    m.depthWrite = false
    m.depthTest = false
    m.blending = THREE.AdditiveBlending
    m.toneMapped = false
    m.side = THREE.DoubleSide
    setMatRef?.(m)
  }

  return (
    <mesh
      ref={ref}
      position={[0, 0, z]}
      renderOrder={renderOrder}
      userData={{ baseScaleX: width, baseScaleY: height }}
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
