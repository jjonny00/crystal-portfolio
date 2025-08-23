import React, { useState, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { deriveGlowFromBase } from '../../utils/color';
import { ANIMATION_CONFIG } from '../../hooks/useUnifiedAnimationController';

const FacetLabels = ({ anchors = {}, projects = [], scrollToProgress, onHoverChange }) => {
  return (
    <group>
      {projects.map((project) => {
        const anchor = anchors[project.facetKey];
        if (!anchor) return null;

        return (
          <FacetBillboard
            key={project.facetKey}
            project={project}
            anchor={anchor}
            onClick={() =>
              scrollToProgress(
                ANIMATION_CONFIG.projectSections[project.facetKey].start
              )
            }
            onHoverChange={onHoverChange}
          />
        );
      })}
    </group>
  );
};

const FacetBillboard = ({ project, anchor, onClick, onHoverChange }) => {
  const { glow1, glow2 } = deriveGlowFromBase(project.headlineColor);

  const width = 512;
  const height = 128;
  const aspect = width / height;
  const spriteRef = useRef();

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio, 2);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    const centerY = height / 2;
    const logoSize = 64;
    const logo = new Image();

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      if (logo.complete && logo.naturalWidth > 0) {
        ctx.drawImage(logo, 0, centerY - logoSize / 2, logoSize, logoSize);
      }

      const textX = logoSize + 32;

      ctx.save();
      ctx.font = '32px "ivypresto-display", serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      // Soft glow behind headline
      ctx.shadowColor = glow2;
      ctx.shadowBlur = 30;
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = glow2;
      ctx.fillText(project.label, textX, centerY - 10);

      ctx.shadowColor = glow1;
      ctx.shadowBlur = 12;
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = glow1;
      ctx.fillText(project.label, textX, centerY - 10);

      // Main headline text
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      ctx.fillStyle = project.headlineColor;
      ctx.fillText(project.label, textX, centerY - 10);

      // Tagline
      ctx.font = '14px "acumin-variable", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText(project.tagline, textX, centerY + 25);

      ctx.restore();

      texture.needsUpdate = true;
    };

    logo.onload = draw;
    logo.src = project.logo;
    draw();

    return texture;
  }, [project.label, project.tagline, project.logo, project.headlineColor, glow1, glow2, width, height]);

  useFrame(() => {
    if (anchor && spriteRef.current) {
      anchor.getWorldPosition(spriteRef.current.position);
      spriteRef.current.position.y += 0.5;
    }
  });

  const [hovered, setHovered] = useState(false);

  const handleOver = () => {
    setHovered(true);
    onHoverChange?.(project.facetKey, true);
  };

  const handleOut = () => {
    setHovered(false);
    onHoverChange?.(project.facetKey, false);
  };

  const handleClick = () => {
    onClick?.();
  };

  const isPointerDown = useRef(false);

  const capture = (e) => {
    // Capture on the underlying canvas element so scroll controls don't steal events
    e.nativeEvent.target.setPointerCapture?.(e.pointerId);
  };

  const release = (e) => {
    e.nativeEvent.target.releasePointerCapture?.(e.pointerId);
  };

  const handleDown = (e) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation?.();
    e.preventDefault();
    capture(e);
    isPointerDown.current = true;
    handleOver();
  };

  const handleUp = (e) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation?.();
    release(e);
    if (isPointerDown.current) {
      handleOut();
      handleClick();
    }
    isPointerDown.current = false;
  };

  const handleMove = (e) => {
    if (isPointerDown.current) {
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation?.();
    }
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation?.();
    release(e);
    isPointerDown.current = false;
    handleOut();
  };

  const baseScale = 0.5;
  const scale = baseScale * (hovered ? 1.1 : 1);

  return (
    <sprite
      ref={spriteRef}
      scale={[aspect * scale, scale, 1]}
      renderOrder={1000}
      onPointerOver={handleOver}
      onPointerOut={handleOut}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerCancel={handleCancel}
      onClick={handleClick}
    >
      <spriteMaterial
        map={texture}
        transparent
        alphaTest={0.1}
        depthTest={false}
        depthWrite={false}
      />
    </sprite>
  );
};

export default FacetLabels;

