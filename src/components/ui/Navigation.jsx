import React, { useState, useEffect } from 'react';

const NAV_BASE_STYLE = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 10000,
  transition: 'all 0.3s ease',
  backgroundColor: 'transparent'
};

const NAV_INNER_STYLE = {
  maxWidth: '1400px',
  margin: '0 auto',
  padding: '0 32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: '88px'
};

const NAME_BUTTON_STYLE = {
  background: 'none',
  border: 'none',
  color: 'white',
  fontFamily: '"ivypresto-display", "Playfair Display", Georgia, serif',
  fontSize: '44px',
  fontWeight: '400',
  letterSpacing: '0.5px',
  cursor: 'pointer',
  padding: 0,
  lineHeight: 1,
  textTransform: 'uppercase'
};

const NAV_ITEM_BASE_STYLE = {
  background: 'none',
  border: 'none',
  color: 'white',
  fontSize: '34px',
  fontWeight: '500',
  letterSpacing: '0.5px',
  padding: 0,
  fontFamily: '"acumin-variable", sans-serif',
  textTransform: 'uppercase',
  cursor: 'pointer'
};

const Navigation = ({ onHomeClick, onWorkClick, onAboutClick, onContactClick, isTransitioning = false }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    { label: 'WORK', onClick: onWorkClick },
    { label: 'ABOUT', onClick: onAboutClick },
    { label: 'CONTACT', onClick: onContactClick }
  ];

  return (
    <nav
      style={{
        ...NAV_BASE_STYLE,
        backdropFilter: isScrolled ? 'blur(8px)' : 'none'
      }}
    >
      <div style={NAV_INNER_STYLE}>
        <button
          onClick={onHomeClick}
          style={{
            ...NAME_BUTTON_STYLE,
            fontSize: isDesktop ? '56px' : '34px',
            opacity: isTransitioning ? 0.6 : 1
          }}
          disabled={isTransitioning}
          aria-label="Go to hero section"
        >
          JONSHAW
        </button>

        <div style={{ display: 'flex', gap: isDesktop ? '32px' : '16px', alignItems: 'center' }}>
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              disabled={isTransitioning}
              style={{
                ...NAV_ITEM_BASE_STYLE,
                fontSize: isDesktop ? '34px' : '20px',
                opacity: isTransitioning ? 0.6 : 1
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
