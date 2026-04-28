import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'

/**
 * MistyLayerStack
 * Renders multiple static billboarded planes using a tileable mist texture.
 * The texture scrolls horizontally (and optionally vertically) so the mist
 * always appears to drift sideways relative to the camera.
 */
export default function MistyLayerStack({
  y = -1,
  width = 30,
  height = 15,
  layers = 3,
  opacity = 0.35,
  drift = { x: 0.002, y: 0 },
  pulseAmp = 0.01,
  pulseFreq = 0.12,
  zSpacing = 0.2,
  renderOrder = 2000
}) {
  const group = useRef()
  const mats = useRef([])
  const planes = useRef([])

  const { camera } = useThree()

  // Load the tileable mist texture
  const tex = useTexture('/assets/textures/mist04.jpg')
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

  // Animate scrolling texture and billboard planes
  useFrame((state, dt) => {
    const t = state.clock.getElapsedTime()

    planes.current.forEach((mesh, i) => {
      if (!mesh) return
      const { seed, df } = layerConfigs[i]
      const mat = mats.current[i]

      if (mat?.map) {
        mat.map.offset.x = (mat.map.offset.x + (drift.x || 0) * dt * df) % 1
        mat.map.offset.y = (mat.map.offset.y + (drift.y || 0) * dt * df) % 1
      }

      const pulse =
        1 + Math.sin((t + seed) * Math.PI * 2 * pulseFreq) * pulseAmp
      mesh.scale.set(
        mesh.userData.baseScaleX * pulse,
        mesh.userData.baseScaleY * pulse,
        1
      )
      mesh.quaternion.copy(camera.quaternion)
    })
  })

  return (
    <group ref={group} position={[0, y, 0]}>
      {layerConfigs.map(({ vary }, i) => (
        <MistPlane
          key={i}
          ref={(el) => (planes.current[i] = el)}
          setMatRef={(m) => (mats.current[i] = m)}
          texture={tex}
          width={width * vary}
          height={height * vary}
          z={i * zSpacing}
          opacity={opacity * (1 - i * 0.08)}
          renderOrder={renderOrder + i}
        />
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

