// src/components/three/CrystalFloatingAnimation.jsx
// Floating animation component for the intro crystal

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Component to add floating animation to the whole crystal during intro
 * Similar to the facet floating but more subtle and unified
 */
const CrystalFloatingAnimation = ({ 
  enabled = true,
  intensity = 1.0,
  scrollCrystalData = null 
}) => {
  const groupRef = useRef();
  const { clock } = useThree();
  
  useFrame((state) => {
    if (!enabled || !groupRef.current || !scrollCrystalData) return;
    
    // Only apply floating during intro states
    const isIntroState = scrollCrystalData.currentSection.key === 'intro-close' || 
                        scrollCrystalData.currentSection.key === 'intro';
    
    if (!isIntroState) {
      // Reset position when not in intro
      groupRef.current.position.set(0, 0, 0);
      groupRef.current.rotation.set(0, 0, 0);
      return;
    }
    
    const time = state.clock.getElapsedTime();
    
    // Subtle floating motion - similar to your facet floating but more gentle
    const baseAmplitude = 0.012 * intensity; // Slightly larger than facet floating
    
    // Multiple wave frequencies for natural movement
    const floatY = Math.sin(time * 0.8) * baseAmplitude + 
                   Math.sin(time * 1.3) * baseAmplitude * 0.3;
    
    const floatX = Math.sin(time * 0.6) * baseAmplitude * 0.4;
    const floatZ = Math.sin(time * 0.5) * baseAmplitude * 0.3;
    
    // Very subtle rotation - like the crystal is gently turning in space
    const rotateY = Math.sin(time * 0.3) * 0.02; // Much slower and smaller than position float
    const rotateX = Math.sin(time * 0.25) * 0.01;
    
    // Apply the floating motion
    groupRef.current.position.set(floatX, floatY, floatZ);
    groupRef.current.rotation.set(rotateX, rotateY, 0);
  });
  
  // This component wraps the crystal scene and applies floating motion
  return (
    <group ref={groupRef}>
      {/* This will wrap your crystal content */}
    </group>
  );
};

export default CrystalFloatingAnimation;