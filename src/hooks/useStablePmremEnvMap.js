import { useEffect, useMemo, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

const isEquirectangularMapping = (mapping) =>
  mapping === THREE.EquirectangularReflectionMapping ||
  mapping === THREE.EquirectangularRefractionMapping;

const resolveEnvironmentTexture = (source) => {
  if (!source) return null;
  if (source.isWebGLCubeRenderTarget) return source.texture;
  return source;
};

const describeTexture = (texture) => {
  if (!texture) return 'none';
  return {
    uuid: texture.uuid,
    mapping: texture.mapping,
    type: texture.type
  };
};

const useStablePmremEnvMap = () => {
  const { gl, scene } = useThree();
  const pmremGenerator = useMemo(() => new THREE.PMREMGenerator(gl), [gl]);
  const pmremTargetRef = useRef(null);
  const lastSourceUuidRef = useRef(null);
  const [pmremTexture, setPmremTexture] = useState(null);

  useEffect(() => {
    return () => {
      if (pmremTargetRef.current) {
        pmremTargetRef.current.dispose();
        pmremTargetRef.current = null;
      }
      pmremGenerator.dispose();
    };
  }, [pmremGenerator]);

  useEffect(() => {
    const source = resolveEnvironmentTexture(scene.environment);
    const sourceUuid = source?.uuid || null;

    if (!source) {
      if (import.meta.env.DEV) {
        console.log('🧪 PMREM: No environment source found.');
      }
      setPmremTexture(null);
      lastSourceUuidRef.current = null;
      return;
    }

    if (sourceUuid === lastSourceUuidRef.current) {
      return;
    }

    lastSourceUuidRef.current = sourceUuid;

    let renderTarget = null;

    if (source.isCubeTexture) {
      renderTarget = pmremGenerator.fromCubemap(source);
    } else if (source.isTexture && isEquirectangularMapping(source.mapping)) {
      renderTarget = pmremGenerator.fromEquirectangular(source);
    } else {
      if (import.meta.env.DEV) {
        console.warn('⚠️ PMREM: Unsupported environment source. Skipping envMap update.', describeTexture(source));
      }
      setPmremTexture(null);
      return;
    }

    if (pmremTargetRef.current) {
      pmremTargetRef.current.dispose();
    }

    pmremTargetRef.current = renderTarget;
    setPmremTexture(renderTarget.texture);

    if (import.meta.env.DEV) {
      console.log('✅ PMREM envMap updated:', renderTarget.texture.uuid, {
        mapping: renderTarget.texture.mapping,
        type: renderTarget.texture.type
      });
    }
  }, [scene.environment, pmremGenerator]);

  return pmremTexture;
};

export default useStablePmremEnvMap;
