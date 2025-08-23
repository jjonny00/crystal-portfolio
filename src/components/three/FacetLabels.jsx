import React, { useState, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { deriveGlowFromBase } from '../../utils/color';
import { ANIMATION_CONFIG } from '../../hooks/useUnifiedAnimationController';

const FacetLabels = ({ anchors = {}, projects = [], scrollToProgress, onHoverChange }) => {
  const [anchorPositions, setAnchorPositions] = useState({});

  useFrame(() => {
    let hasChanged = false;
    const newPositions = {};

    Object.entries(anchors).forEach(([key, anchor]) => {
      if (!anchor) return;

      const worldPos = new THREE.Vector3();
      anchor.getWorldPosition(worldPos);

      const prev = anchorPositions[key];
      if (!prev || worldPos.distanceTo(prev) > 0.01) {
        newPositions[key] = worldPos;
        hasChanged = true;
      } else {
        newPositions[key] = prev;
      }
    });

    if (hasChanged) {
      setAnchorPositions(newPositions);
    }
  });

  return (
    <group>
      {projects.map((project) => {
        const position = anchorPositions[project.facetKey];
        if (!position) return null;

        return (
          <FacetBillboard
            key={project.facetKey}
            project={project}
            position={[position.x, position.y + 0.5, position.z]}
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

const FacetBillboard = ({ project, position, onClick, onHoverChange }) => {
  const { glow1, glow2 } = deriveGlowFromBase(project.headlineColor);

  const texture = useMemo(() => {
    const width = 512;
    const height = 128;
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

      const centerX = logoSize + 20 + (width - logoSize - 20) / 2;

      ctx.save();
      ctx.font = '32px "ivypresto-display", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Outer glow
      ctx.shadowColor = glow2;
      ctx.shadowBlur = 30;
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = glow2;
      ctx.fillText(project.label, centerX, centerY - 10);

      // Inner glow
      ctx.shadowColor = glow1;
      ctx.shadowBlur = 10;
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = glow1;
      ctx.fillText(project.label, centerX, centerY - 10);

      // Main text
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      ctx.fillStyle = project.headlineColor;
      ctx.fillText(project.label, centerX, centerY - 10);

      // Tagline
      ctx.font = '14px "acumin-variable", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText(project.tagline, centerX, centerY + 25);

      ctx.restore();

      texture.needsUpdate = true;
    };

    logo.onload = draw;
    logo.src = project.logo;
    draw();

    return texture;
  }, [project.label, project.tagline, project.logo, project.headlineColor, glow1, glow2]);

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

  return (
    <sprite
      position={position}
      scale={hovered ? 1.1 : 1}
      onPointerOver={handleOver}
      onPointerOut={handleOut}
      onPointerDown={handleClick}
      onClick={handleClick}
    >
      <spriteMaterial map={texture} transparent alphaTest={0.1} />
    </sprite>
  );
};

export default FacetLabels;

