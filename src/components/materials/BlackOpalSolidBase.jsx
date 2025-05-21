// BlackOpalSolidBase.jsx - Fixed normal map toggling issue
import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';

/**
 * Diagnostic version of Black Opal material with solid base color
 * to isolate and observe the effect of the emissive texture
 * 
 * @param {Object} props Component props
 * @param {Object} props.config Material configuration
 * @param {Object} props.materialRef React ref to store the created material
 * @param {Object} props.performanceConfig Performance configuration
 * @returns null - this is a utility component that updates the provided ref
 */
const BlackOpalSolidBase = ({ config, materialRef, performanceConfig = {} }) => {
  // Set default performance settings if not provided
  const {
    useNormalMaps = true,
    textureQuality = 'high',
    usePBR = true
  } = performanceConfig;
  
  // Keep track of loaded textures
  const [textures, setTextures] = useState({
    normalMap: null,
    roughnessMap: null,
    emissiveMap: null
  });
  
  // Load normal map if enabled
  useEffect(() => {
    if (!useNormalMaps) {
      // If normal maps are disabled, clear the normal map
      setTextures(prev => ({
        ...prev,
        normalMap: null
      }));
      return;
    }
    
    console.log('Loading Black Opal normal map');
    
    // Load normal map
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('/assets/textures/blackOpal-normal.png', (texture) => {
      // Configure texture
      const mipmapEnabled = textureQuality !== 'low';
      const anisotropy = textureQuality === 'high' ? 4 : (textureQuality === 'medium' ? 2 : 1);
      
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(1, 1);
      texture.offset.set(0, 0);
      texture.minFilter = mipmapEnabled ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = anisotropy;
      texture.generateMipmaps = mipmapEnabled;
      texture.needsUpdate = true;
      
      // Store the configured texture
      setTextures(prev => ({
        ...prev,
        normalMap: texture
      }));
    });
  }, [useNormalMaps, textureQuality]);
  
  // Load roughness and emissive maps if PBR is enabled
  useEffect(() => {
    if (!usePBR) {
      // If PBR is disabled, clear the roughness and emissive maps
      setTextures(prev => ({
        ...prev,
        roughnessMap: null,
        emissiveMap: null
      }));
      return;
    }
    
    console.log('Loading Black Opal roughness and emissive maps');
    
    // Load roughness map
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('/assets/textures/blackOpal-roughness.png', (texture) => {
      // Configure texture
      const mipmapEnabled = textureQuality !== 'low';
      const anisotropy = textureQuality === 'high' ? 4 : (textureQuality === 'medium' ? 2 : 1);
      
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(1, 1);
      texture.offset.set(0, 0);
      texture.minFilter = mipmapEnabled ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = anisotropy;
      texture.generateMipmaps = mipmapEnabled;
      texture.needsUpdate = true;
      
      // Store the configured texture
      setTextures(prev => ({
        ...prev,
        roughnessMap: texture
      }));
    });
    
    // Load emissive map
    textureLoader.load('/assets/textures/blackOpal-emissive.png', (texture) => {
      // Configure texture
      const mipmapEnabled = textureQuality !== 'low';
      const anisotropy = textureQuality === 'high' ? 4 : (textureQuality === 'medium' ? 2 : 1);
      
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(1, 1);
      texture.offset.set(0, 0);
      texture.minFilter = mipmapEnabled ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = anisotropy;
      texture.generateMipmaps = mipmapEnabled;
      texture.needsUpdate = true;
      
      // Store the configured texture
      setTextures(prev => ({
        ...prev,
        emissiveMap: texture
      }));
    });
  }, [usePBR, textureQuality]);
  
  // Create or update the material when textures change
  useEffect(() => {
    console.log('Creating or updating Black Opal Solid Base material with textures:', textures);
    
    // If material doesn't exist yet, create it
    if (!materialRef.current) {
      console.log('Creating new Black Opal Solid Base material');
      
      // Create the material with a solid base color instead of a texture
      const material = new THREE.MeshPhysicalMaterial({
        // Solid base color instead of texture
        color: new THREE.Color(0x0a001a), // Deep blue-purple color
        
        // Normal map for surface detail - only if provided
        normalMap: textures.normalMap,
        normalScale: textures.normalMap ? new THREE.Vector2(
          (config?.normalScale || 0.8), 
          (config?.normalScale || 0.8)
        ) : undefined,
        
        // Roughness map for varied reflection - only if provided
        roughnessMap: textures.roughnessMap,
        roughness: config?.roughness || 0.4,
        
        // Emissive map for glow - only if provided
        emissive: new THREE.Color(0x8822ff), // Purple emissive color
        emissiveMap: textures.emissiveMap,
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
    } else {
      // Update existing material
      console.log('Updating existing Black Opal Solid Base material');
      
      // Update textures
      materialRef.current.normalMap = textures.normalMap;
      materialRef.current.roughnessMap = textures.roughnessMap;
      materialRef.current.emissiveMap = textures.emissiveMap;
      
      // Update normal scale if normal map exists
      if (textures.normalMap) {
        materialRef.current.normalScale.set(
          (config?.normalScale || 0.8), 
          (config?.normalScale || 0.8)
        );
      } else {
        materialRef.current.normalScale.set(0, 0);
      }
      
      // Update PBR properties
      materialRef.current.clearcoat = usePBR ? (config?.clearcoat || 0.6) : 0;
      materialRef.current.clearcoatRoughness = usePBR ? 0.2 : 0;
      materialRef.current.transmission = usePBR ? (config?.transmission || 0.2) : 0.1;
      materialRef.current.ior = usePBR ? 1.8 : 1.4;
      materialRef.current.iridescence = usePBR ? (config?.iridescence || 0.9) : 0;
      materialRef.current.iridescenceIOR = usePBR ? 1.5 : 0;
      materialRef.current.iridescenceThicknessRange = usePBR ? [100, 400] : [0, 0];
      materialRef.current.envMapIntensity = usePBR ? 2.0 : 1.0;
      
      // Mark material for update
      materialRef.current.needsUpdate = true;
    }
  }, [textures, materialRef, config, usePBR]);
  
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
      
      if (config.normalScale !== undefined && textures.normalMap) {
        materialRef.current.normalScale.set(config.normalScale, config.normalScale);
      }
      
      materialRef.current.needsUpdate = true;
    }
  }, [config, materialRef, usePBR, textures.normalMap]);
  
  // Cleanup function when component unmounts
  useEffect(() => {
    return () => {
      if (materialRef.current) {
        materialRef.current.dispose();
      }
    };
  }, []);

  // This component doesn't render anything directly
  return null;
};

export default BlackOpalSolidBase;