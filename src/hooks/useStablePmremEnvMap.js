import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const isEquirectangularMapping = (mapping) =>
  mapping === THREE.EquirectangularReflectionMapping ||
  mapping === THREE.EquirectangularRefractionMapping;

export const useStablePmremEnvMap = () => {
  const { gl, scene } = useThree();
  const pmremGeneratorRef = useRef(null);
  const lastSourceIdRef = useRef(null);
  const lastTargetRef = useRef(null);
  const [pmremTexture, setPmremTexture] = useState(null);

  useEffect(() => {
    if (!pmremGeneratorRef.current && gl) {
      pmremGeneratorRef.current = new THREE.PMREMGenerator(gl);
      pmremGeneratorRef.current.compileEquirectangularShader();
    }
  }, [gl]);

  useFrame(() => {
    const source = scene?.environment || null;
    const sourceId = source?.uuid || null;
    if (sourceId === lastSourceIdRef.current) {
      return;
    }
    lastSourceIdRef.current = sourceId;

    if (!source || !pmremGeneratorRef.current) {
      setPmremTexture(null);
      return;
    }

    let target = null;
    if (source.isCubeTexture) {
      target = pmremGeneratorRef.current.fromCubemap(source);
    } else if (source.mapping && isEquirectangularMapping(source.mapping)) {
      target = pmremGeneratorRef.current.fromEquirectangular(source);
    } else {
      if (import.meta.env.DEV) {
        console.warn('⚠️ Unsupported environment source for PMREM generation', {
          mapping: source.mapping,
          type: source.type
        });
      }
      setPmremTexture(null);
      return;
    }

    if (lastTargetRef.current) {
      lastTargetRef.current.dispose();
    }
    lastTargetRef.current = target;
    setPmremTexture(target?.texture || null);

    if (import.meta.env.DEV && target?.texture) {
      console.log('✅ PMREM envMap updated:', {
        uuid: target.texture.uuid,
        mapping: target.texture.mapping,
        type: target.texture.type
      });
    }
  });

  useEffect(
    () => () => {
      if (lastTargetRef.current) {
        lastTargetRef.current.dispose();
      }
      pmremGeneratorRef.current?.dispose?.();
    },
    []
  );

  return pmremTexture;
};

export default useStablePmremEnvMap;
