// BlackOpalSolidEmissive.jsx - Updated for Three.js compatibility
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
 * @param {Object} props.performanceConfig Performance configuration
 * @returns null - this is a utility component that updates the provided ref
 */
const BlackOpalSolidEmissive = ({ config, materialRef, performanceConfig = {} }) => {
  // Set default performance settings if not provided
  const {
    useNormalMaps = true,
    textureQuality = 'high',
    usePBR = true
  } = performanceConfig;
  
  // Only load the base, normal and roughness maps (no emissive map)
  const textureUrls = [
    '/assets/textures/blackOpal-base.png',
    useNormalMaps ? '/assets/textures/blackOpal-normal.png' : null,
    usePBR ? '/assets/textures/blackOpal-roughness.png' : null
  ].filter(Boolean);
  
  // Load all textures
  const textures = useTexture(textureUrls);
  
  // Assign textures to variables
  const baseMap = textures[0];
  const normalMap = useNormalMaps ? textures[1] : null;
  const roughnessMap = usePBR ? (useNormalMaps ? textures[2] : textures[1]) : null;
  
  // Set up texture parameters
  useEffect(() => {
    console.log('Configuring textures for diagnostic Black Opal with solid emissive');
    
    // Configure texture settings
    const configureTexture = (texture) => {
      if (!texture) return;

      // Quality settings based on performance config
      const mipmapEnabled = textureQuality !== 'low';
      const anisotropy = textureQuality === 'high' ? 4 : (textureQuality === 'medium' ? 2 : 1);

      // Basic texture settings
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(1, 1);
      texture.offset.set(0, 0);
      texture.minFilter = mipmapEnabled ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = anisotropy;
      texture.generateMipmaps = mipmapEnabled;
      texture.needsUpdate = true;
    };
    
    // Apply settings to textures
    [baseMap, normalMap, roughnessMap].forEach(texture => {
      if (texture) configureTexture(texture);
    });
    
    // Ensure the baseMap uses SRGBColorSpace
    if (baseMap) {
      baseMap.colorSpace = THREE.SRGBColorSpace; // Updated from encoding
    }
    
    console.log('All textures configured');
  }, [baseMap, normalMap, roughnessMap, textureQuality]);
  
  // Create or update the material when textures are loaded
  useEffect(() => {
    if (!baseMap || (!normalMap && useNormalMaps) || (!roughnessMap && usePBR)) return;
    
    console.log('Creating Black Opal material with solid emissive');
    
    // Create the material with a texture base color but solid emissive
    const material = new THREE.MeshPhysicalMaterial({
      // Base texture
      map: baseMap,
      
      // Normal map for surface detail
      normalMap: normalMap,
      normalScale: normalMap ? new THREE.Vector2(
        config?.normalScale || 0.8, 
        config?.normalScale || 0.8
      ) : undefined,
      
      // Roughness map for varied reflection
      roughnessMap: roughnessMap,
      roughness: config?.roughness || 0.4,
      
      // Solid emissive color instead of texture - THIS IS WHAT WE'RE TESTING
      emissive: new THREE.Color(0x7711cc), // Purple emissive color
      emissiveIntensity: config?.emissiveIntensity || 0.5,
      
      // Keep other properties for complete effect
      metalness: config?.metalness || 0.1,
      clearcoat: usePBR ? (config?.clearcoat || 0.6) : 0,
      clearcoatRoughness: usePBR ? 0.2 : 0,
      transmission: usePBR ? (config?.transmission || 0.2) : 0.1,
      ior: usePBR ? 1.8 : 1.4,
      iridescence: usePBR ? (config?.iridescence || 0.9) : 0,
      iridescenceIOR: usePBR ? 1.5 : 0,
      iridescenceThicknessRange: usePBR ? [100, 400] : [0, 0],
      
      // Environment settings
      envMapIntensity: usePBR ? 2.0 : 1.0,
      
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
  }, [baseMap, normalMap, roughnessMap, materialRef, config, useNormalMaps, usePBR]);
  
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
        materialRef.current.metalness = usePBR ? config.metalness : 0.05;
      }
      
      if (config.clearcoat !== undefined && usePBR) {
        materialRef.current.clearcoat = config.clearcoat;
      }
      
      if (config.transmission !== undefined) {
        materialRef.current.transmission = usePBR ? config.transmission : 0.1;
      }
      
      if (config.iridescence !== undefined && usePBR) {
        materialRef.current.iridescence = config.iridescence;
      }
      
      if (config.normalScale !== undefined && normalMap) {
        materialRef.current.normalScale.set(config.normalScale, config.normalScale);
      }
      
      materialRef.current.needsUpdate = true;
    }
  }, [config, materialRef, usePBR, normalMap]);

  // This component doesn't render anything directly
  return null;
};

export default BlackOpalSolidEmissive;