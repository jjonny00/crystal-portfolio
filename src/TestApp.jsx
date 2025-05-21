// src/TestApp.jsx

import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import CrystalScene from './components/three/CrystalScene'
import StdlibTest from './components/three/StdlibTest'
import './App.css'

function TestApp() {
  const [isExploded, setIsExploded] = useState(false)
  const [useStdlib, setUseStdlib] = useState(true)

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }}>
      <Canvas shadows camera={{ position: [0, 0, 5], fov: 45 }} dpr={[1, 2]}>
        {/* Dark background for contrast */}
        <color attach="background" args={['#050505']} />
        
        {/* Basic lighting */}
        <ambientLight intensity={0.2} />
        <directionalLight position={[10, 8, 5]} intensity={1.8} color="#FFFFFF" castShadow />
        <pointLight position={[-5, 3, -5]} intensity={0.8} color="#CCE8FF" />
        
        {/* Crystal Scene */}
        <CrystalScene isExploded={isExploded} />
        
        {/* Stdlib Test - only active when enabled */}
        {useStdlib && <StdlibTest />}
        
        {/* Camera controls */}
        <OrbitControls 
          makeDefault
          enableZoom={false}
          enablePan={false}
          rotateSpeed={0.5}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>
      
      {/* Controls */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '10px',
        zIndex: 9999
      }}>
        <button 
          onClick={() => setIsExploded(!isExploded)}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer',
            color: 'white',
            background: 'rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '8px',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
        >
          {isExploded ? 'Reform Crystal' : 'Reveal Facets'}
        </button>
        
        <button 
          onClick={() => setUseStdlib(!useStdlib)}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer',
            color: 'white',
            background: useStdlib ? 'rgba(0, 128, 0, 0.5)' : 'rgba(128, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '8px',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
        >
          Stdlib: {useStdlib ? 'ON' : 'OFF'}
        </button>
      </div>
    </div>
  )
}

export default TestApp