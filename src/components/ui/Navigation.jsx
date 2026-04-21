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
  maxWidth: '1480px',
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
  color: '#FFFAE3',
  fontFamily: '"ivypresto-text", "IvyPresto Text", "ivypresto-display", Georgia, serif',
  fontSize: '36px',
  fontStyle: 'normal',
  fontWeight: 400,
  lineHeight: 'normal',
  letterSpacing: '-2.88px',
  textTransform: 'uppercase',
  cursor: 'pointer',
  padding: 0
};

const NAV_ITEM_BASE_STYLE = {
  background: 'none',
  border: 'none',
  color: '#FEFFDE',
  fontFamily: '"acumin-variable", "Acumin VF", sans-serif',
  fontSize: '24px',
  fontStyle: 'normal',
  fontWeight: 500,
  lineHeight: 'normal',
  textTransform: 'uppercase',
  cursor: 'pointer',
  padding: 0
};

const Navigation = ({ onHomeClick, onWorkClick, onAboutClick, onContactClick, isTransitioning = false }) => {
  const [isDesktop, setIsDesktop] = useState(true);

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
      className="top-nav"
      style={{
        ...NAV_BASE_STYLE
      }}
    >
      <div style={NAV_INNER_STYLE}>
        <button
          onClick={onHomeClick}
          className="blend-force"
          style={{
            ...NAME_BUTTON_STYLE,
            fontSize: isDesktop ? '36px' : '28px',
            opacity: isTransitioning ? 0.6 : 1
          }}
          disabled={isTransitioning}
          aria-label="Go to hero section"
        >
          JONSHAW
        </button>

        <div style={{ display: 'flex', gap: isDesktop ? '34px' : '16px', alignItems: 'center' }}>
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className="blend-force"
              disabled={isTransitioning}
              style={{
                ...NAV_ITEM_BASE_STYLE,
                fontSize: isDesktop ? '24px' : '18px',
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
