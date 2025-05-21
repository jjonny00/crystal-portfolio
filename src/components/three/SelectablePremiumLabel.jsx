// SelectablePremiumLabel.jsx - Updated to work with anchors
import React, { useRef, useState, useEffect } from 'react';
import { Html } from '@react-three/drei';
import { animated, useSpring } from '@react-spring/web';

/**
 * Enhanced label component that positions labels based on anchor points
 */
const SelectablePremiumLabel = ({ 
  label, 
  index, 
  position, 
  visible,
  config,
  isSelected = false,
  isHovered = false,
  onSelect
}) => {
  const labelRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  // DEBUG: Log position to help diagnose positioning issues
  useEffect(() => {
    if (visible && position) {
      console.log(`Label ${label.key} position:`, position);
    }
  }, [visible, position, label.key]);
  
  // Main label animation (opacity)
  const { opacity } = useSpring({
    from: { opacity: 0 },
    to: { 
      opacity: visible ? 1 : 0
    },
    delay: visible ? index * config.timing.labels.staggerDelay : 0,
    config: config.springConfigs.label.appear
  });
  
  // Hover animation (subtle scale)
  const { hoverScale } = useSpring({
    hoverScale: (hovered || isHovered) ? 1.05 : 1,
    config: config.springConfigs.label.hover
  });
  
  // Selection animation (stronger scale and glow)
  const { selectScale, selectOpacity } = useSpring({
    selectScale: isSelected ? 1.15 : 1,
    selectOpacity: isSelected ? 1 : 0,
    config: config.springConfigs.label.select || { tension: 300, friction: 15 }
  });
  
  // Description animation (fade in on hover/select)
  const { descriptionOpacity } = useSpring({
    descriptionOpacity: (hovered || isHovered || isSelected) ? 1 : 0,
    config: config.springConfigs.label.description
  });
  
  // Apply additional offsets if needed (can be used for fine-tuning)
  const getLabelOffset = (facetKey) => {
    // Small additional offsets to fine-tune label placement
    // These are much smaller than before since we're using anchors
    const offsets = {
      'empathy': [0, 0.2, 0],
      'narrative': [0, 0.2, 0],
      'craft': [0, 0.2, 0],
      'system': [0, 0.2, 0],
      'leadership': [0, 0.2, 0],
      'exploration': [0, 0.2, 0]
    };
    
    return offsets[facetKey] || [0, 0.2, 0]; // Default small vertical offset
  };
  
  // Get the custom offset for this facet
  const customOffset = getLabelOffset(label.key);
  
  // Apply the offset to create the final label position
  const finalPosition = position ? [
    position[0] + customOffset[0],
    position[1] + customOffset[1],
    position[2] + customOffset[2]
  ] : [0, 0, 0];
  
  // Handle click on label
  const handleClick = () => {
    if (onSelect && visible) {
      onSelect(label.key);
    }
  };
  
  // Compute final scale combining hover and selection effects
  const finalScale = isSelected 
    ? selectScale.to(s => s * (hovered || isHovered ? 1.02 : 1))
    : hoverScale;
  
  return (
    <group position={finalPosition}>
      <Html
        center
        transform
        distanceFactor={3}
        sprite // This automatically makes it face the camera
        ref={labelRef}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onClick={handleClick}
        prepend={false} 
        style={{ zIndex: 10 }}
        pointerEvents={visible ? "auto" : "none"}
      >
        <animated.div 
          style={{
            opacity,
            transform: finalScale.to(s => `scale(${s})`),
            pointerEvents: visible ? 'auto' : 'none',
            cursor: visible ? 'pointer' : 'default',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            position: 'relative'
          }}
        >
          {/* Selection indicator */}
          <animated.div 
            style={{
              position: 'absolute',
              top: '-10px',
              left: '-10px',
              right: '-10px',
              bottom: '-10px',
              border: `2px solid ${label.color}`,
              borderRadius: '8px',
              opacity: selectOpacity,
              boxShadow: `0 0 15px ${label.color}80`
            }}
          />
          
          {/* Main label */}
          <div style={config.ui.labels.styles.main}>
            {label.text}
          </div>
          
          {/* Premium accent line */}
          <animated.div style={{
            ...config.ui.labels.styles.accent,
            background: `linear-gradient(90deg, transparent, ${label.color}, transparent)`,
            opacity: descriptionOpacity.to(o => 0.7 + 0.3 * o),
          }} />
          
          {/* Description on hover */}
          <animated.div style={{
            opacity: descriptionOpacity,
            transition: 'all 0.3s ease',
          }}>
            <div style={config.ui.labels.styles.description}>
              {label.description}
            </div>
          </animated.div>
        </animated.div>
      </Html>
    </group>
  );
};

export default SelectablePremiumLabel;