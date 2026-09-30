// src/components/ui/TabbedControlPanel.jsx - Updated for external tab control
import React, { useRef, useEffect, useLayoutEffect } from 'react';

/**
 * A tabbed control panel component with external tab control support
 */
const TabbedControlPanel = ({ 
  visible = false, 
  children, 
  tabs, 
  activeTab = 0, 
  onTabChange 
}) => {
  const tabsContainerRef = useRef(null);
  const contentRef = useRef(null);
  const tabScrollTopsRef = useRef({});
  const showScrollButtons = false; // Simplified for now

  // Every tab stays mounted and the inactive ones are only hidden, so a tab's
  // own state (open sections, sub-tabs, slider values) survives switching away
  // and back. display:none drops a scroll offset, so each tab's is remembered
  // and put back when it becomes active again.
  const panels = React.Children.toArray(children);

  useLayoutEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = tabScrollTopsRef.current[activeTab] ?? 0;
    }
  }, [activeTab]);

  const handleContentScroll = (event) => {
    tabScrollTopsRef.current[activeTab] = event.currentTarget.scrollTop;
  };

  // Scroll to active tab when it changes
  useEffect(() => {
    if (!tabsContainerRef.current) return;
    
    const container = tabsContainerRef.current;
    const activeTabEl = container.children[activeTab];
    
    if (activeTabEl) {
      // Calculate scroll position to center the active tab
      const containerWidth = container.clientWidth;
      const tabWidth = activeTabEl.clientWidth;
      const tabLeft = activeTabEl.offsetLeft;
      
      const scrollPosition = tabLeft - (containerWidth / 2) + (tabWidth / 2);
      
      // Smoothly scroll to the active tab
      container.scrollTo({
        left: Math.max(0, scrollPosition),
        behavior: 'smooth'
      });
    }
  }, [activeTab]);
  
  // Handle tab click
  const handleTabClick = (index) => {
    if (onTabChange) {
      onTabChange(index);
    }
  };
  
  // Panel styles
  const panelStyle = {
    position: 'fixed',
    bottom: '80px',
    left: visible ? '20px' : '-340px',
    width: '320px',
    backgroundColor: 'rgba(20, 20, 30, 0.75)',
    backdropFilter: 'blur(10px)',
    color: 'white',
    padding: '5px',
    borderRadius: '8px',
    boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
    // Hidden, the panel slides off-screen and goes visibility:hidden once it's
    // there (out of the tab order, no hits) but stays mounted, keeping its state
    // and scroll position for the next open.
    visibility: visible ? 'visible' : 'hidden',
    transition: 'left 0.3s ease, visibility 0.3s',
    zIndex: 1000,
    fontFamily: '"acumin-variable", sans-serif',
    maxHeight: '70vh',
    overflowY: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  };
  
  const tabsContainerStyle = {
    display: 'flex',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '6px 6px 0 0',
    overflowX: 'auto',
    overflowY: 'hidden',
    marginBottom: '10px',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    WebkitOverflowScrolling: 'touch',
    scrollBehavior: 'smooth',
    flexGrow: 1
  };
  
  const tabStyle = (isActive) => ({
    padding: '10px 8px',
    textAlign: 'center',
    backgroundColor: isActive ? 'rgba(100, 255, 218, 0.1)' : 'transparent',
    color: isActive ? '#64ffda' : 'white',
    border: 'none',
    borderBottom: isActive ? '2px solid #64ffda' : '2px solid transparent',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: isActive ? '600' : '400',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    minWidth: '64px'
  });
  
  const contentStyle = {
    overflowY: 'auto',
    maxHeight: 'calc(70vh - 60px)',
    padding: '5px 10px'
  };

  return (
    <div style={panelStyle} aria-hidden={!visible}>
      {/* Tab Buttons */}
      <div 
        ref={tabsContainerRef} 
        style={{
          ...tabsContainerStyle,
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {tabs.map((tab, index) => (
          <button
            key={index}
            style={tabStyle(activeTab === index)}
            onClick={() => handleTabClick(index)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Content Area */}
      <div ref={contentRef} style={contentStyle} onScroll={handleContentScroll}>
        {panels.map((panel, index) => (
          <div key={index} style={{ display: index === activeTab ? 'block' : 'none' }}>
            {panel}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TabbedControlPanel;
