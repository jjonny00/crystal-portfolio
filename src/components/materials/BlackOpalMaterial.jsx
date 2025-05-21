// BlackOpalMaterial.jsx
import { useEffect } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';

/**
 * Component to create and manage a Black Opal material
 * 
 * @param {Object} props Component props
 * @param {Object} props.config Material configuration
 * @param {Object} props.materialRef React ref to store the created material
 * @returns null - this is a utility component that updates the provided ref
 */
const BlackOpalMaterial = ({ config, materialRef }) => {
  // Load all textures
  const [baseMap, normalMap, roughnessMap, emissiveMap] = useTexture([
    '/assets/textures/blackOpal-base.png',
    '/assets/textures/blackOpal-normal.png',
    '/assets/textures/blackOpal-roughness.png',
    '/assets/textures/blackOpal-emissive.png'
  ]);
  
  // Set up proper texture parameters - optimized for performance
  useEffect(() => {
    console.log('Configuring Black Opal textures for better performance');
    
    // Configure texture settings to ensure proper alignment and scale
    const configureTexture = (texture) => {
      if (!texture) return;

      // Ensure all textures have the same wrapping mode
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      
      // Set the same repeat and offset for all textures to ensure alignment
      texture.repeat.set(1, 1);
      texture.offset.set(0, 0);
      
      // Use optimized filtering settings for performance
      texture.minFilter = THREE.LinearFilter; // Changed from LinearMipMapLinearFilter for performance
      texture.magFilter = THREE.LinearFilter;
      
      // Use a more moderate anisotropy setting for performance
      texture.anisotropy = 4; // Reduced from 16 for better performance
      
      // Generate mipmaps for better quality at a distance
      texture.generateMipmaps = true;
      
      // Force texture update
      texture.needsUpdate = true;
    };
    
    // Apply settings to all textures
    [baseMap, normalMap, roughnessMap, emissiveMap].forEach(texture => {
      if (texture) configureTexture(texture);
    });
    
    // Ensure the baseMap uses sRGB encoding (for correct color display)
    if (baseMap) {
      baseMap.encoding = THREE.sRGBEncoding;
    }
    
    // Remove the HalfFloatType for better performance
    // if (normalMap) {
    //   normalMap.type = THREE.HalfFloatType;
    // }
    
    console.log('All Black Opal textures configured with matching settings');
  }, [baseMap, normalMap, roughnessMap, emissiveMap]);
  
  // Create or update the material when textures are loaded
  useEffect(() => {
    if (!baseMap || !normalMap || !roughnessMap || !emissiveMap) return;
    
    console.log('Creating Black Opal material with textures');
    
    // Create a physical material with opal-like properties - optimized for performance
    const material = new THREE.MeshPhysicalMaterial({
      // Base color from texture
      map: baseMap,
      
      // Normal map for surface detail - reduced strength for performance
      normalMap: normalMap,
      normalScale: new THREE.Vector2(
        (config?.normalScale || 0.8) * 0.5, 
        (config?.normalScale || 0.8) * 0.5
      ),
      
      // Roughness map for varied reflection
      roughnessMap: roughnessMap,
      roughness: config?.roughness || 0.4,
      
      // Emissive map for glow
      emissive: new THREE.Color(0x331188),
      emissiveMap: emissiveMap,
      emissiveIntensity: (config?.emissiveIntensity || 0.5) * 0.7, // Reduced for performance
      
      // Opal-like properties - simplified for performance
      metalness: config?.metalness || 0.1,
      clearcoat: (config?.clearcoat || 0.6) * 0.7, // Reduced for performance
      clearcoatRoughness: 0.3, // Increased for performance
      transmission: (config?.transmission || 0.2) * 0.7, // Reduced for performance
      ior: 1.6, // Slightly reduced for performance
      
      // Iridescence properties (color shifting) - reduced for performance
      iridescence: (config?.iridescence || 0.9) * 0.6, // Reduced for performance
      iridescenceIOR: 1.3, // Reduced for performance
      iridescenceThicknessRange: [100, 300], // Narrower range for performance
      
      // Make sure material reacts to lighting well, but reduced for performance
      envMapIntensity: 1.5, // Reduced from 2.0 for performance
      
      // Alpha settings if needed
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
  }, [baseMap, normalMap, roughnessMap, emissiveMap, materialRef, config]);
  
  // Update material properties from config if provided
  useEffect(() => {
    if (materialRef.current && config) {
      // Update emissive intensity if defined - scaled down for performance
      if (config.emissiveIntensity !== undefined) {
        materialRef.current.emissiveIntensity = config.emissiveIntensity * 0.7;
      }
      
      // Update roughness if defined
      if (config.roughness !== undefined) {
        materialRef.current.roughness = config.roughness;
      }
      
      // Update metalness if defined
      if (config.metalness !== undefined) {
        materialRef.current.metalness = config.metalness;
      }
      
      // Update clearcoat if defined - scaled down for performance
      if (config.clearcoat !== undefined) {
        materialRef.current.clearcoat = config.clearcoat * 0.7;
      }
      
      // Update transmission if defined - scaled down for performance
      if (config.transmission !== undefined) {
        materialRef.current.transmission = config.transmission * 0.7;
      }
      
      // Update iridescence if defined - scaled down for performance
      if (config.iridescence !== undefined) {
        materialRef.current.iridescence = config.iridescence * 0.6;
      }
      
      // Update normal scale if defined - scaled down for performance
      if (config.normalScale !== undefined) {
        materialRef.current.normalScale.set(
          config.normalScale * 0.5, 
          config.normalScale * 0.5
        );
      }
      
      // Mark material for update
      materialRef.current.needsUpdate = true;
    }
  }, [config, materialRef]);

  // This component doesn't render anything directly
  return null;
};

export default BlackOpalMaterial;