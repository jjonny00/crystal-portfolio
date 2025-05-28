// src/components/ui/Navigation.jsx
import React, { useState, useEffect } from 'react';

const Navigation = ({ 
  onWorkClick, 
  onAboutClick, 
  onProcessClick, 
  onContactClick,
  isTransitioning = false,
  crystalState = 'WHOLE' 
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle mobile menu close when transitioning states
  useEffect(() => {
    if (isTransitioning) {
      setIsMobileMenuOpen(false);
    }
  }, [isTransitioning]);

  // Simple SVG icons to replace lucide-react dependency
  const MenuIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const XIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  // Your custom logo
  const Logo = () => (
    <img 
      src="/assets/images/jonshaw.svg" 
      alt="Jon Shaw Logo" 
      width="100" 
      height="auto"
      style={{
        display: 'block'
      }}
      onError={(e) => {
        // Fallback if SVG doesn't load
        console.warn('Logo failed to load, check path: /assets/logo/jonshaw.svg');
        e.target.style.display = 'none';
      }}
    />
  );

  const navItems = [
    { 
      label: 'Work', 
      onClick: onWorkClick,
      description: 'View my projects and case studies'
    },
    { 
      label: 'About', 
      onClick: onAboutClick,
      description: 'Learn about my design approach'
    },
    { 
      label: 'Process', 
      onClick: onProcessClick,
      description: 'Explore my design methodology'
    },
    { 
      label: 'Contact', 
      onClick: onContactClick,
      description: 'Let\'s work together'
    }
  ];

  return (
    <nav 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10000, // Above the 3D scene
        transition: 'all 0.3s ease',
        backgroundColor: isScrolled 
          ? 'rgba(5, 5, 5, 0.9)' 
          : 'transparent',
        backdropFilter: isScrolled ? 'blur(20px)' : 'none',
        borderBottom: isScrolled 
          ? '1px solid rgba(100, 255, 218, 0.1)' 
          : '1px solid transparent',
        boxShadow: isScrolled 
          ? '0 4px 20px rgba(0, 0, 0, 0.3)' 
          : 'none'
      }}
    >
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '80px'
      }}>
        
        {/* Logo - Left aligned */}
        <div style={{ flex: '0 0 auto' }}>
          <button
            onClick={() => window.location.reload()} // Reset to home state
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0',
              display: 'flex',
              alignItems: 'center'
            }}
            aria-label="Home"
            disabled={isTransitioning}
          >
            <Logo />
          </button>
        </div>

        {/* Desktop Navigation */}
        <div style={{
          display: window.innerWidth >= 1024 ? 'flex' : 'none',
          alignItems: 'center',
          gap: '2rem',
          marginLeft: 'auto'
        }}>
          {navItems.map((item, index) => (
            <button
              key={item.label}
              onClick={item.onClick}
              disabled={isTransitioning}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
                letterSpacing: '0.5px',
                cursor: isTransitioning ? 'not-allowed' : 'pointer',
                padding: '8px 0',
                position: 'relative',
                transition: 'all 0.2s ease',
                opacity: isTransitioning ? 0.5 : 1,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
                textTransform: 'uppercase'
              }}
              onMouseEnter={(e) => {
                if (!isTransitioning) {
                  e.currentTarget.style.color = '#64ffda';
                  // Add glow effect
                  e.currentTarget.style.textShadow = '0 0 8px rgba(100, 255, 218, 0.6)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.textShadow = 'none';
              }}
              title={item.description}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          disabled={isTransitioning}
          style={{
            display: window.innerWidth < 1024 ? 'block' : 'none',
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: isTransitioning ? 'not-allowed' : 'pointer',
            padding: '8px',
            borderRadius: '8px',
            transition: 'background-color 0.2s ease',
            opacity: isTransitioning ? 0.5 : 1,
            marginLeft: '16px'
          }}
          onMouseEnter={(e) => {
            if (!isTransitioning) {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <XIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      <div 
        style={{
          display: window.innerWidth < 1024 ? 'block' : 'none',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          maxHeight: isMobileMenuOpen ? '256px' : '0',
          opacity: isMobileMenuOpen ? 1 : 0,
          borderTop: isMobileMenuOpen ? '1px solid rgba(100, 255, 218, 0.1)' : 'none',
          backgroundColor: 'rgba(5, 5, 5, 0.95)',
          backdropFilter: 'blur(20px)'
        }}
      >
        <div style={{ padding: '16px 24px' }}>
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                setIsMobileMenuOpen(false);
                item.onClick?.();
              }}
              disabled={isTransitioning}
              style={{
                display: 'block',
                width: '100%',
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '16px',
                fontWeight: '500',
                cursor: isTransitioning ? 'not-allowed' : 'pointer',
                padding: '12px 16px',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                opacity: isTransitioning ? 0.5 : 1,
                marginBottom: '4px',
                textAlign: 'left',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'
              }}
              onMouseEnter={(e) => {
                if (!isTransitioning) {
                  e.currentTarget.style.backgroundColor = 'rgba(100, 255, 218, 0.1)';
                  e.currentTarget.style.color = '#64ffda';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'white';
              }}
            >
              <div style={{ fontWeight: '600', marginBottom: '2px' }}>
                {item.label}
              </div>
              <div style={{ 
                fontSize: '12px', 
                opacity: 0.7, 
                color: 'rgba(255, 255, 255, 0.6)' 
              }}>
                {item.description}
              </div>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;