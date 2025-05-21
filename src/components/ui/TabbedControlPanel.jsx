// src/components/ui/TabbedControlPanel.jsx
import React, { useState } from 'react';

/**
 * A tabbed control panel component that houses different control panels
 * and allows switching between them
 */
const TabbedControlPanel = ({ visible = false, children, tabs }) => {
  const [activeTab, setActiveTab] = useState(0);
  
  // Only show the currently active panel
  const visiblePanel = React.Children.toArray(children)[activeTab];
  
  // Panel styles
  const panelStyle = {
    position: 'fixed',
    bottom: '80px', // Position above the Reveal Facets button
    left: visible ? '20px' : '-340px',
    width: '320px',
    backgroundColor: 'rgba(20, 20, 30, 0.75)',
    backdropFilter: 'blur(10px)',
    color: 'white',
    padding: '5px', // Reduced padding to make room for tabs
    borderRadius: '8px',
    boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
    transition: 'left 0.3s ease',
    zIndex: 1000,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    maxHeight: '70vh', // Reduced from 90vh to ensure it fits better
    overflowY: 'hidden', // Hide scrollbars on parent
    display: 'flex',
    flexDirection: 'column'
  };
  
  const tabsContainerStyle = {
    display: 'flex',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '6px 6px 0 0',
    overflow: 'hidden',
    marginBottom: '10px'
  };
  
  const tabStyle = (isActive) => ({
    padding: '10px 15px',
    backgroundColor: isActive ? 'rgba(100, 255, 218, 0.1)' : 'transparent',
    color: isActive ? '#64ffda' : 'white',
    border: 'none',
    borderBottom: isActive ? '2px solid #64ffda' : '2px solid transparent',
    cursor: 'pointer',
    flex: 1,
    fontSize: '13px',
    fontWeight: isActive ? '600' : '400',
    transition: 'all 0.2s ease'
  });
  
  const contentStyle = {
    overflowY: 'auto', // Add scrollbar to content
    maxHeight: 'calc(90vh - 60px)', // Leave room for tabs
    padding: '5px 10px'
  };

  // Only render if visible
  if (!visible) return null;

  return (
    <div style={panelStyle}>
      {/* Tab Buttons */}
      <div style={tabsContainerStyle}>
        {tabs.map((tab, index) => (
          <button
            key={index}
            style={tabStyle(activeTab === index)}
            onClick={() => setActiveTab(index)}
          >
            {tab.icon && (
              <span role="img" aria-label={tab.label} style={{ marginRight: '8px' }}>
                {tab.icon}
              </span>
            )}
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Content Area */}
      <div style={contentStyle}>
        {visiblePanel}
      </div>
    </div>
  );
};

export default TabbedControlPanel;