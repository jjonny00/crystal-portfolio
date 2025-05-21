// MaterialSelector.jsx - UI component for selecting crystal material variants
import { useState } from 'react';

const MaterialSelector = ({ currentVariant, onChange }) => {
  const [expanded, setExpanded] = useState(true);
  
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
  
  // Panel styles
  const panelStyle = {
    position: 'fixed',
    left: expanded ? '0' : '-240px',
    top: '20px',
    width: '240px',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(10px)',
    color: 'white',
    padding: '15px',
    borderTopRightRadius: '8px',
    borderBottomRightRadius: '8px',
    boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
    transition: 'left 0.3s ease',
    zIndex: 1000,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    maxHeight: '90vh',
    overflowY: 'auto'
  };

  const toggleStyle = {
    position: 'absolute',
    right: '-40px',
    top: '0',
    width: '40px',
    height: '40px',
    background: 'rgba(0, 0, 0, 0.7)',
    borderTopRightRadius: '8px',
    borderBottomRightRadius: '8px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    color: 'white',
    fontSize: '20px'
  };
  
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

  const handleMaterialSelect = (variant) => {
    console.log(`Selected material variant: ${variant}`);
    onChange(variant);
  };

  return (
    <div style={panelStyle}>
      <div 
        style={toggleStyle}
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? '❮' : '❯'}
      </div>
      
      <h2 style={{ margin: '0 0 15px 0', fontSize: '16px', display: 'flex', alignItems: 'center' }}>
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