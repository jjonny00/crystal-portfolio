// Updated MaterialSelector.jsx - Modified for tabbed interface
import { useState } from 'react';

const MaterialSelector = ({ currentVariant, onChange }) => {
  // Remove expanded state as it's no longer needed with the tabbed UI
  
  // Available material variants
  const materialVariants = [
    { id: 'default', name: 'Default Crystal', description: 'The original crystal material with blue glow' },
    { id: 'glass', name: 'Glass', description: 'Clear glass with subtle reflections' },
    { id: 'gem', name: 'Gemstone', description: 'Rich purple gemstone with facets' },
    { id: 'holographic', name: 'Holographic', description: 'Futuristic holographic material with shifting colors' },
    { id: 'blackOpal', name: 'Black Opal', description: 'Premium black opal with iridescent play of colors' },
    { id: 'iceOpal', name: 'Ice Opal', description: 'Translucent ice-like opal with blue-tinged glow' },
    { id: 'blackOpalSolidBase', name: 'Opal - Solid Base', description: 'Diagnostic: Black Opal with solid base color' },
    { id: 'blackOpalSolidEmissive', name: 'Opal - Solid Emissive', description: 'Diagnostic: Black Opal with solid emissive' }
  ];
  
  // Updated styles that work better in the tabbed context
  const materialItemStyle = (isSelected) => ({
    padding: '12px',
    margin: '8px 0',
    backgroundColor: isSelected ? 'rgba(100, 255, 218, 0.1)' : 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    cursor: 'pointer',
    borderLeft: isSelected ? '3px solid #64ffda' : '3px solid transparent',
    transition: 'all 0.2s ease'
  });
  
  const materialNameStyle = {
    fontWeight: '600',
    fontSize: '14px',
    marginBottom: '4px'
  };
  
  const materialDescStyle = {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.7)'
  };
  
  const titleStyle = {
    margin: '0 0 15px 0', 
    fontSize: '16px', 
    display: 'flex', 
    alignItems: 'center'
  };

  const handleMaterialSelect = (variant) => {
    console.log(`Selected material variant: ${variant}`);
    onChange(variant);
  };

  return (
    <div>
      <h2 style={titleStyle}>
        <span role="img" aria-label="Material" style={{ marginRight: '8px' }}>✨</span>
        Material Selector
      </h2>
      
      <div>
        {materialVariants.map(variant => (
          <div 
            key={variant.id}
            style={materialItemStyle(currentVariant === variant.id)}
            onClick={() => handleMaterialSelect(variant.id)}
          >
            <div style={materialNameStyle}>{variant.name}</div>
            <div style={materialDescStyle}>{variant.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MaterialSelector;