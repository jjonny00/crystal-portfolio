// IceOpalMaterial.jsx - Updated for Three.js compatibility
import { useEffect } from 'react';
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
  
  // Load textures conditionally based on performance settings
  const textureUrls = [
    '/assets/textures/iceOpal-base.png',
    useNormalMaps ? '/assets/textures/iceOpal-normal.png' : null,
    usePBR ? '/assets/textures/iceOpal-roughness.png' : null,
    usePBR ? '/assets/textures/iceOpal-emissive.png' : null
  ].filter(Boolean); // Filter out null values
  
  // Load all textures
  const textures = useTexture(textureUrls);
  
  // Assign textures to variables - handle case when some textures are not loaded
  const baseMap = textures[0];
  const normalMap = useNormalMaps ? textures[1] : null;
  const roughnessMap = usePBR ? (useNormalMaps ? textures[2] : textures[1]) : null;
  const emissiveMap = usePBR ? (textures[textures.length - 1]) : null;
  
  // Set up proper texture parameters
  useEffect(() => {
    // Configure texture settings to ensure proper alignment and scale
    const configureTexture = (texture) => {
      if (!texture) return;
      
      // Quality settings based on performance config
      const mipmapEnabled = textureQuality !== 'low';
      const anisotropy = textureQuality === 'high' ? 4 : (textureQuality === 'medium' ? 2 : 1);

      // Ensure all textures have the same wrapping mode
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      
      // Set the same repeat and offset for all textures to ensure alignment
      texture.repeat.set(1, 1);
      texture.offset.set(0, 0);
      
      // Use optimized filtering settings based on performance config
      texture.minFilter = mipmapEnabled ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      
      // Use optimized anisotropy setting based on performance config
      texture.anisotropy = anisotropy;
      
      // Generate mipmaps based on performance config
      texture.generateMipmaps = mipmapEnabled;
      
      // Force texture update
      texture.needsUpdate = true;
    };
    
    // Apply settings to all loaded textures
    [baseMap, normalMap, roughnessMap, emissiveMap].forEach(texture => {
      if (texture) configureTexture(texture);
    });
    
    // Ensure the baseMap uses SRGB color space (for correct color display)
    if (baseMap) {
      baseMap.colorSpace = THREE.SRGBColorSpace; // Updated from encoding to colorSpace
    }
    
    console.log('All Ice Opal textures configured with matching settings');
  }, [baseMap, normalMap, roughnessMap, emissiveMap, textureQuality]);
  
  // Create or update the material when textures are loaded
  useEffect(() => {
    if (!baseMap) return;
    
    console.log('Creating Ice Opal material with textures');
    
    // Create a physical material with ice opal-like properties
    const material = new THREE.MeshPhysicalMaterial({
      // Base color from texture
      map: baseMap,
      
      // Normal map for surface detail - only if enabled in performance settings
      normalMap: normalMap,
      normalScale: normalMap ? new THREE.Vector2(
        (config?.normalScale || 0.6), 
        (config?.normalScale || 0.6)
      ) : undefined,
      
      // Roughness map for varied reflection - only if PBR is enabled
      roughnessMap: roughnessMap,
      roughness: config?.roughness || 0.3,
      
      // Emissive map for glow - only if PBR is enabled
      emissive: new THREE.Color(0x8899ff), // Blue-tinged emissive color
      emissiveMap: emissiveMap,
      emissiveIntensity: config?.emissiveIntensity || 0.4,
      
      // Ice opal-like properties
      metalness: config?.metalness || 0.05,
      clearcoat: config?.clearcoat || 0.8,
      clearcoatRoughness: 0.1,
      transmission: config?.transmission || 0.6, // Higher for ice-like translucency
      ior: 1.4, // Lower for ice
      
      // Iridescence properties (for subtle color shifting)
      iridescence: config?.iridescence || 0.4,
      iridescenceIOR: 1.3,
      iridescenceThicknessRange: [200, 600],
      
      // Make sure material reacts to lighting well
      envMapIntensity: 1.8,
      
      // Adjust for icy translucency
      transparent: true,
      opacity: 0.9,
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
      
      // Update clearcoat if defined
      if (config.clearcoat !== undefined) {
        materialRef.current.clearcoat = config.clearcoat;
      }
      
      // Update transmission if defined
      if (config.transmission !== undefined) {
        materialRef.current.transmission = config.transmission;
      }
      
      // Update iridescence if defined
      if (config.iridescence !== undefined) {
        materialRef.current.iridescence = config.iridescence;
      }
      
      // Update normal scale if defined
      if (config.normalScale !== undefined) {
        materialRef.current.normalScale.set(config.normalScale, config.normalScale);
      }
      
      // Mark material for update
      materialRef.current.needsUpdate = true;
    }
  }, [config, materialRef]);

  // This component doesn't render anything directly
  return null;
};

export default IceOpalMaterial;