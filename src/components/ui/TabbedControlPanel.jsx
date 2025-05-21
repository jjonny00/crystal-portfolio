// src/components/ui/TabbedControlPanel.jsx - Updated for better space handling
import React, { useState, useRef, useEffect } from 'react';

/**
 * A tabbed control panel component with improved space handling
 * - Removes icons to save space
 * - Supports horizontal scrolling for tabs if needed
 */
const TabbedControlPanel = ({ visible = false, children, tabs }) => {
  const [activeTab, setActiveTab] = useState(0);
  const tabsContainerRef = useRef(null);
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  
  // Only show the currently active panel
  const visiblePanel = React.Children.toArray(children)[activeTab];
  
  // Check if scrolling is needed for tabs
  useEffect(() => {
    const checkScrollNeeded = () => {
      if (!tabsContainerRef.current) return;
      
      const containerWidth = tabsContainerRef.current.clientWidth;
      const scrollWidth = tabsContainerRef.current.scrollWidth;
      
      // Show scroll buttons if tabs overflow the container
      setShowScrollButtons(scrollWidth > containerWidth);
    };
    
    // Check initially and on window resize
    checkScrollNeeded();
    window.addEventListener('resize', checkScrollNeeded);
    
    return () => {
      window.removeEventListener('resize', checkScrollNeeded);
    };
  }, [tabs]);
  
  // Scroll to active tab
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
  
  // Handle scrolling tabs left/right
  const scrollTabs = (direction) => {
    if (!tabsContainerRef.current) return;
    
    const container = tabsContainerRef.current;
    const scrollAmount = container.clientWidth * 0.7; // Scroll by 70% of visible width
    
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };
  
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
  
  const tabsOuterContainerStyle = {
    position: 'relative', // For positioning scroll buttons
    display: 'flex',
    alignItems: 'center'
  };
  
  const tabsContainerStyle = {
    display: 'flex',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '6px 6px 0 0',
    overflowX: 'auto',
    overflowY: 'hidden',
    marginBottom: '10px',
    scrollbarWidth: 'none', // Hide scrollbar in Firefox
    msOverflowStyle: 'none', // Hide scrollbar in IE/Edge
    WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
    scrollBehavior: 'smooth',
    flexGrow: 1
  };
  
  // Hide scrollbar in WebKit/Blink browsers
  const hideScrollbarCSS = {
    '&::-webkit-scrollbar': {
      display: 'none'
    }
  };
  
  const tabStyle = (isActive) => ({
    padding: '10px 8px', // Reduced horizontal padding to fit more tabs
    textAlign: 'center',
    backgroundColor: isActive ? 'rgba(100, 255, 218, 0.1)' : 'transparent',
    color: isActive ? '#64ffda' : 'white',
    border: 'none',
    borderBottom: isActive ? '2px solid #64ffda' : '2px solid transparent',
    cursor: 'pointer',
    fontSize: '12px', // Smaller font size
    fontWeight: isActive ? '600' : '400',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap', // Prevent text wrapping
    flexShrink: 0, // Prevent tabs from shrinking
    minWidth: '64px' // Minimum tab width
  });
  
  const scrollButtonStyle = (direction) => ({
    position: 'absolute',
    top: '0',
    [direction]: '0',
    height: '100%',
    width: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    border: 'none',
    borderRadius: direction === 'left' ? '6px 0 0 0' : '0 6px 0 0',
    color: 'white',
    cursor: 'pointer',
    zIndex: 1,
    opacity: 0.7,
    transition: 'opacity 0.2s ease',
    padding: 0,
    fontSize: '12px'
  });
  
  const contentStyle = {
    overflowY: 'auto', // Add scrollbar to content
    maxHeight: 'calc(70vh - 60px)', // Leave room for tabs
    padding: '5px 10px'
  };

  // Only render if visible
  if (!visible) return null;

  return (
    <div style={panelStyle}>
      {/* Tab Buttons with Scroll */}
      <div style={tabsOuterContainerStyle}>
        {/* Left scroll button */}
        {showScrollButtons && (
          <button
            style={scrollButtonStyle('left')}
            onClick={() => scrollTabs('left')}
            aria-label="Scroll tabs left"
          >
            ◀
          </button>
        )}
        
        {/* Scrollable Tabs Container */}
        <div 
          ref={tabsContainerRef} 
          style={{
            ...tabsContainerStyle,
            // Apply scrollbar hiding in inline style as equivalent to the CSS
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {tabs.map((tab, index) => (
            <button
              key={index}
              style={tabStyle(activeTab === index)}
              onClick={() => setActiveTab(index)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Right scroll button */}
        {showScrollButtons && (
          <button
            style={scrollButtonStyle('right')}
            onClick={() => scrollTabs('right')}
            aria-label="Scroll tabs right"
          >
            ▶
          </button>
        )}
      </div>
      
      {/* Content Area */}
      <div style={contentStyle}>
        {visiblePanel}
      </div>
    </div>
  );
};

export default TabbedControlPanel;