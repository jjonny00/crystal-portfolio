// IceOpalMaterial.jsx - Fixed normal map toggling issue
import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';

/**
 * Component to create and manage an Ice Opal material
 * 
 * @param {Object} props Component props
 * @param {Object} props.config Material configuration
 * @param {Object} props.materialRef React ref to store the created material
 * @param {Object} props.performanceConfig Performance configuration
 * @returns null - this is a utility component that updates the provided ref
 */
const IceOpalMaterial = ({ config, materialRef, performanceConfig = {} }) => {
  // Set default performance settings if not provided
  const {
    useNormalMaps = true,
    textureQuality = 'high',
    usePBR = true
  } = performanceConfig;
  
  // Keep track of loaded textures
  const [textures, setTextures] = useState({
    baseMap: null,
    normalMap: null,
    roughnessMap: null,
    emissiveMap: null
  });
  
  // Load base texture - this will always be needed
  const baseTexture = useTexture('/assets/textures/iceOpal-base.png');
  
  // Set up base texture parameters
  useEffect(() => {
    if (!baseTexture) return;
    
    console.log('Configuring Ice Opal base texture');
    
    // Configure texture settings
    const configureTexture = (texture) => {
      // Quality settings based on performance config
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
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
    };
    
    configureTexture(baseTexture);
    
    // Store the configured texture
    setTextures(prev => ({
      ...prev,
      baseMap: baseTexture
    }));
    
  }, [baseTexture, textureQuality]);
  
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
    
    console.log('Loading Ice Opal normal map');
    
    // Load normal map
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('/assets/textures/iceOpal-normal.png', (texture) => {
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
    
    console.log('Loading Ice Opal roughness and emissive maps');
    
    // Load roughness map
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('/assets/textures/iceOpal-roughness.png', (texture) => {
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
    textureLoader.load('/assets/textures/iceOpal-emissive.png', (texture) => {
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
    // Ensure we at least have the base map
    if (!textures.baseMap) return;
    
    console.log('Creating or updating Ice Opal material with textures:', textures);
    
    // If material doesn't exist yet, create it
    if (!materialRef.current) {
      console.log('Creating new Ice Opal material');
      
      // Create a physical material with ice opal-like properties
      const material = new THREE.MeshPhysicalMaterial({
        // Base color from texture
        map: textures.baseMap,
        
        // Normal map for surface detail - only if provided
        normalMap: textures.normalMap,
        normalScale: textures.normalMap ? new THREE.Vector2(
          (config?.normalScale || 0.6), 
          (config?.normalScale || 0.6)
        ) : undefined,
        
        // Roughness map for varied reflection - only if provided
        roughnessMap: textures.roughnessMap,
        roughness: config?.roughness || 0.3,
        
        // Emissive map for glow - only if provided
        emissive: new THREE.Color(0x8899ff), // Blue-tinged emissive color
        emissiveMap: textures.emissiveMap,
        emissiveIntensity: config?.emissiveIntensity || 0.4,
        
        // Ice opal-like properties - simplified when PBR is disabled
        metalness: config?.metalness || 0.05,
        clearcoat: usePBR ? (config?.clearcoat || 0.8) : 0,
        clearcoatRoughness: usePBR ? 0.1 : 0,
        transmission: usePBR ? (config?.transmission || 0.6) : 0.4,
        ior: usePBR ? 1.4 : 1.2,
        
        // Iridescence properties - only if PBR is enabled
        iridescence: usePBR ? (config?.iridescence || 0.4) : 0,
        iridescenceIOR: usePBR ? 1.3 : 0,
        iridescenceThicknessRange: usePBR ? [200, 600] : [0, 0],
        
        // Environment settings
        envMapIntensity: usePBR ? 1.8 : 0.9,
        
        // Alpha settings
        transparent: true,
        opacity: 0.9,
        alphaTest: 0.01
      });
      
      // Store the material in the provided ref
      materialRef.current = material;
    } else {
      // Update existing material
      console.log('Updating existing Ice Opal material');
      
      // Update textures
      materialRef.current.map = textures.baseMap;
      materialRef.current.normalMap = textures.normalMap;
      materialRef.current.roughnessMap = textures.roughnessMap;
      materialRef.current.emissiveMap = textures.emissiveMap;
      
      // Update normal scale if normal map exists
      if (textures.normalMap) {
        materialRef.current.normalScale.set(
          (config?.normalScale || 0.6), 
          (config?.normalScale || 0.6)
        );
      } else {
        materialRef.current.normalScale.set(0, 0);
      }
      
      // Update PBR properties
      materialRef.current.clearcoat = usePBR ? (config?.clearcoat || 0.8) : 0;
      materialRef.current.clearcoatRoughness = usePBR ? 0.1 : 0;
      materialRef.current.transmission = usePBR ? (config?.transmission || 0.6) : 0.4;
      materialRef.current.ior = usePBR ? 1.4 : 1.2;
      materialRef.current.iridescence = usePBR ? (config?.iridescence || 0.4) : 0;
      materialRef.current.iridescenceIOR = usePBR ? 1.3 : 0;
      materialRef.current.iridescenceThicknessRange = usePBR ? [200, 600] : [0, 0];
      materialRef.current.envMapIntensity = usePBR ? 1.8 : 0.9;
      
      // Mark material for update
      materialRef.current.needsUpdate = true;
    }
  }, [textures, materialRef, config, usePBR]);
  
  // Update material properties from config if provided
  useEffect(() => {
    if (materialRef.current && config) {
      // Update emissive intensity if defined
      if (config.emissiveIntensity !== undefined) {
        materialRef.current.emissiveIntensity = config.emissiveIntensity;
      }
      
      // Update roughness if defined
      if (config.roughness !== undefined) {
        materialRef.current.roughness = config.roughness;
      }
      
      // Update metalness if defined
      if (config.metalness !== undefined) {
        materialRef.current.metalness = config.metalness;
      }
      
      // Update clearcoat if defined and PBR is enabled
      if (config.clearcoat !== undefined) {
        materialRef.current.clearcoat = usePBR ? config.clearcoat : 0;
      }
      
      // Update transmission if defined
      if (config.transmission !== undefined) {
        materialRef.current.transmission = usePBR ? config.transmission : 0.4;
      }
      
      // Update iridescence if defined and PBR is enabled
      if (config.iridescence !== undefined) {
        materialRef.current.iridescence = usePBR ? config.iridescence : 0;
      }
      
      // Update normal scale if defined and normal map exists
      if (config.normalScale !== undefined && textures.normalMap) {
        materialRef.current.normalScale.set(config.normalScale, config.normalScale);
      }
      
      // Mark material for update
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

export default IceOpalMaterial;