import React, { useState } from 'react';
import { MQ_NAV_DESKTOP } from '../../config/breakpoints';
import { useMediaQuery } from '../../hooks/useMediaQuery';

const NAV_BASE_STYLE = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 10000,
  transition: 'all 0.3s ease',
  backgroundColor: 'transparent'
};

// Sits on the site-wide content edge (--page-edge in index.css) rather than its
// own max-width, so the nav lines up with the hero and with every case-study
// section. The token already handles centring past --page-content-max, so the bar
// itself stays full-bleed and only its padding grows.
//
// The bar takes its height from its own contents, 16px below the top of the
// window — rather than a fixed box that centred the ink somewhere inside itself.
const NAV_INNER_STYLE = {
  maxWidth: 'none',
  margin: '0',
  padding: '16px var(--page-edge) 0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
};

const NAME_BUTTON_STYLE = {
  background: 'none',
  border: 'none',
  color: 'rgb(from var(--ink-nav, #FFFAE3) r g b)',
  fontFamily: '"ivypresto-text", "IvyPresto Text", "ivypresto-display", Georgia, serif',
  fontSize: '36px',
  fontStyle: 'normal',
  fontWeight: 400,
  lineHeight: 'normal',
  // -2.88px at the 36px desktop size, restated as a ratio. As a fixed px value
  // it was tracking for one size only: at the 28px mobile wordmark it worked out
  // to -0.103em, meaningfully tighter than drawn, and it could not follow the
  // font if anything rescaled it. In em it holds the same fit at every size.
  letterSpacing: '-0.08em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  padding: 0,
  transition: 'color 0.3s ease'
};

const NAV_ITEM_BASE_STYLE = {
  background: 'none',
  border: 'none',
  color: 'rgb(from var(--ink-nav, #FEFFDE) r g b)',
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
// `blend` puts the whole bar into the scene-adaptive blend mode (legibility.css).
// It goes on the <nav> itself rather than on the buttons inside it: the z-index
// that keeps the bar above everything already makes this element an isolated
// group, so a blended child would only see the bar's own empty backdrop. Blending
// the group instead composites the ink against the page — and because the bar is
// transparent everywhere but the glyphs, only the glyphs are affected.
const Navigation = ({ activeLabel = null, onHomeClick, onWorkClick, onAboutClick, onContactClick, isTransitioning = false, color = null, blend = false }) => {
  // The same query NavScrim sizes itself from — the band under the bar has to
  // turn over exactly where the bar's type does, so both read one token rather
  // than each carrying its own 1024. Also fires only when the answer changes,
  // where the resize listener this replaced re-rendered on every pixel of a drag.
  const isDesktop = useMediaQuery(MQ_NAV_DESKTOP);

  const navItems = [
    { label: 'WORK', onClick: onWorkClick },
    { label: 'ABOUT', onClick: onAboutClick },
    { label: 'CONTACT', onClick: onContactClick }
  ];

  return (
    <nav
      className={blend ? 'legible-blend' : undefined}
      style={{
        ...NAV_BASE_STYLE
      }}
    >
      <div style={NAV_INNER_STYLE}>
        {/* The two ink clusters mark themselves as what to measure — the bar
            itself spans the window and most of it is empty, so sampling its full
            width would average in a stretch of scene no glyph ever sits on. */}
        <button
          onClick={onHomeClick}
          data-ink-region="nav"
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

        {/* Steps back while a media viewer is open — see index.css. The
            wordmark stays: it is the way back out of a case study, and it sits
            clear of the lightbox's own controls. */}
        <div
          className="site-nav__items"
          data-ink-region="nav"
          style={{ display: 'flex', gap: isDesktop ? '34px' : '16px', alignItems: 'center' }}
        >
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
