// BlackOpalSolidEmissive.jsx
import { useEffect } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';

/**
 * Diagnostic version of Black Opal material with solid emissive color
 * to isolate and observe the effect of the base texture
 * 
 * @param {Object} props Component props
 * @param {Object} props.config Material configuration
 * @param {Object} props.materialRef React ref to store the created material
 * @returns null - this is a utility component that updates the provided ref
 */
const BlackOpalSolidEmissive = ({ config, materialRef }) => {
  // Only load the base, normal and roughness maps (no emissive map)
  const [baseMap, normalMap, roughnessMap] = useTexture([
    '/assets/textures/blackOpal-base.png',
    '/assets/textures/blackOpal-normal.png',
    '/assets/textures/blackOpal-roughness.png'
  ]);
  
  // Set up texture parameters
  useEffect(() => {
    console.log('Configuring textures for diagnostic Black Opal with solid emissive');
    
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
    [baseMap, normalMap, roughnessMap].forEach(texture => {
      if (texture) configureTexture(texture);
    });
    
    // Ensure the baseMap uses sRGB encoding
    if (baseMap) {
      baseMap.encoding = THREE.sRGBEncoding;
    }
    
    console.log('All textures configured');
  }, [baseMap, normalMap, roughnessMap]);
  
  // Create or update the material when textures are loaded
  useEffect(() => {
    if (!baseMap || !normalMap || !roughnessMap) return;
    
    console.log('Creating Black Opal material with solid emissive');
    
    // Create the material with a texture base color but solid emissive
    const material = new THREE.MeshPhysicalMaterial({
      // Base texture
      map: baseMap,
      
      // Normal map for surface detail
      normalMap: normalMap,
      normalScale: new THREE.Vector2(
        config?.normalScale || 0.8, 
        config?.normalScale || 0.8
      ),
      
      // Roughness map for varied reflection
      roughnessMap: roughnessMap,
      roughness: config?.roughness || 0.4,
      
      // Solid emissive color instead of texture - THIS IS WHAT WE'RE TESTING
      emissive: new THREE.Color(0x7711cc), // Purple emissive color
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
  }, [baseMap, normalMap, roughnessMap, materialRef, config]);
  
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

export default BlackOpalSolidEmissive;