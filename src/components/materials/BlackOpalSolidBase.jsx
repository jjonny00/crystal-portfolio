// BlackOpalSolidBase.jsx
import { useEffect } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';

/**
 * Diagnostic version of Black Opal material with solid base color
 * to isolate and observe the effect of the emissive texture
 * 
 * @param {Object} props Component props
 * @param {Object} props.config Material configuration
 * @param {Object} props.materialRef React ref to store the created material
 * @returns null - this is a utility component that updates the provided ref
 */
const BlackOpalSolidBase = ({ config, materialRef }) => {
  // Only load the emissive, normal and roughness maps (no base color map)
  const [normalMap, roughnessMap, emissiveMap] = useTexture([
    '/assets/textures/blackOpal-normal.png',
    '/assets/textures/blackOpal-roughness.png',
    '/assets/textures/blackOpal-emissive.png'
  ]);
  
  // Set up texture parameters
  useEffect(() => {
    console.log('Configuring textures for diagnostic Black Opal with solid base');
    
    // Configure texture settings
    const configureTexture = (texture) => {
      if (!texture) return;

      // Basic texture settings
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(1, 1);
      texture.offset.set(0, 0);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;
      texture.needsUpdate = true;
    };
    
    // Apply settings to textures
    [normalMap, roughnessMap, emissiveMap].forEach(texture => {
      if (texture) configureTexture(texture);
    });
    
    console.log('All textures configured');
  }, [normalMap, roughnessMap, emissiveMap]);
  
  // Create or update the material when textures are loaded
  useEffect(() => {
    if (!normalMap || !roughnessMap || !emissiveMap) return;
    
    console.log('Creating Black Opal material with solid base color');
    
    // Create the material with a solid base color instead of a texture
    const material = new THREE.MeshPhysicalMaterial({
      // Solid base color instead of texture
      color: new THREE.Color(0x0a001a), // Deep blue-purple color
      
      // Normal map for surface detail
      normalMap: normalMap,
      normalScale: new THREE.Vector2(
        config?.normalScale || 0.8, 
        config?.normalScale || 0.8
      ),
      
      // Roughness map for varied reflection
      roughnessMap: roughnessMap,
      roughness: config?.roughness || 0.4,
      
      // Emissive map for glow - THIS IS WHAT WE'RE TESTING
      emissive: new THREE.Color(0x8822ff), // Purple emissive color
      emissiveMap: emissiveMap,
      emissiveIntensity: config?.emissiveIntensity || 0.5,
      
      // Keep other properties for complete effect
      metalness: config?.metalness || 0.1,
      clearcoat: config?.clearcoat || 0.6,
      clearcoatRoughness: 0.2,
      transmission: config?.transmission || 0.2,
      ior: 1.8,
      iridescence: config?.iridescence || 0.9,
      iridescenceIOR: 1.5,
      iridescenceThicknessRange: [100, 400],
      
      // Environment settings
      envMapIntensity: 2.0,
      
      // Alpha settings 
      transparent: true,
      alphaTest: 0.01
    });
    
    // Store the material in the provided ref
    materialRef.current = material;
    
    // Cleanup function
    return () => {
      if (materialRef.current) {
        materialRef.current.dispose();
      }
    };
  }, [normalMap, roughnessMap, emissiveMap, materialRef, config]);
  
  // Update material properties from config
  useEffect(() => {
    if (materialRef.current && config) {
      // Update properties as needed
      if (config.emissiveIntensity !== undefined) {
        materialRef.current.emissiveIntensity = config.emissiveIntensity;
      }
      
      if (config.roughness !== undefined) {
        materialRef.current.roughness = config.roughness;
      }
      
      if (config.metalness !== undefined) {
        materialRef.current.metalness = config.metalness;
      }
      
      if (config.clearcoat !== undefined) {
        materialRef.current.clearcoat = config.clearcoat;
      }
      
      if (config.transmission !== undefined) {
        materialRef.current.transmission = config.transmission;
      }
      
      if (config.iridescence !== undefined) {
        materialRef.current.iridescence = config.iridescence;
      }
      
      if (config.normalScale !== undefined) {
        materialRef.current.normalScale.set(config.normalScale, config.normalScale);
      }
      
      materialRef.current.needsUpdate = true;
    }
  }, [config, materialRef]);

  // This component doesn't render anything directly
  return null;
};

export default BlackOpalSolidBase;