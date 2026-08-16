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
  padding: 0,
  transition: 'color 0.3s ease'
};

const NAV_ITEM_BASE_STYLE = {
  background: 'none',
  border: 'none',
  color: '#FEFFDE',
  fontFamily: '"acumin-variable", "Acumin VF", sans-serif',
  fontSize: '24px',
  fontStyle: 'normal',
  fontStretch: 'condensed',
  fontVariationSettings: '"wdth" 75',
  fontWeight: 500,
  lineHeight: 'normal',
  textTransform: 'uppercase',
  cursor: 'pointer',
  padding: 0,
  // Colour is animated too so the swap to a case-study palette eases in with
  // that layer's own fade rather than snapping.
  transition: 'opacity 0.3s ease, color 0.3s ease'
};

const NavItem = ({ label, onClick, disabled, isActive, fontSize, color }) => {
  const [isHovered, setIsHovered] = useState(false);
  const active = isActive || isHovered;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...NAV_ITEM_BASE_STYLE,
        ...(color ? { color } : null),
        fontSize,
        opacity: disabled ? 0.6 : active ? 1 : 0.7
      }}
    >
      {label}
    </button>
  );
};

// `color` lets a full-bleed layer (currently the case-study overlay) keep the
// nav legible over its own background. Omitted everywhere else, so the default
// portfolio treatment is unchanged.
const Navigation = ({ activeLabel = null, onHomeClick, onWorkClick, onAboutClick, onContactClick, isTransitioning = false, color = null }) => {
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
      style={{
        ...NAV_BASE_STYLE
      }}
    >
      <div style={NAV_INNER_STYLE}>
        <button
          onClick={onHomeClick}
          style={{
            ...NAME_BUTTON_STYLE,
            ...(color ? { color } : null),
            fontSize: isDesktop ? '36px' : '28px',
            opacity: isTransitioning ? 0.6 : 1
          }}
          disabled={isTransitioning}
          aria-label="Go to hero section"
        >
          J.JONSHAW
        </button>

        <div style={{ display: 'flex', gap: isDesktop ? '34px' : '16px', alignItems: 'center' }}>
          {navItems.map((item) => (
            <NavItem
              key={item.label}
              label={item.label}
              onClick={item.onClick}
              disabled={isTransitioning}
              isActive={activeLabel === item.label}
              fontSize={isDesktop ? '24px' : '18px'}
              color={color}
            />
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
