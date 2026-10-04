import React, { useState } from 'react';
import { MQ_NAV_DESKTOP } from '../../config/breakpoints';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { inPageLinkHandler } from '../../navigation/linkClick';
import { NAVIGATION_DESTINATIONS } from '../../navigation/navigationIntent';
import { pathFor } from '../../navigation/routes';
import { CONTACT_EMAIL } from '../../seo/site';

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

// The nav items are links (crawlable, and openable in a new tab) styled as the
// bare type they always were.
const LINK_RESET_STYLE = {
  display: 'inline-block',
  textDecoration: 'none'
};

const NAME_BUTTON_STYLE = {
  background: 'none',
  border: 'none',
  color: '#ffebe3',
  // ivypresto-DISPLAY, like every other serif here (index.css, LoaderV2.module.css).
  // The stack used to lead with "ivypresto-text" / "IvyPresto Text", and neither can
  // resolve for a visitor: the Typekit kit in index.html publishes only
  // acumin-variable and ivypresto-display, and "IvyPresto Text" is a desktop family
  // name that matches only on a machine with it installed from Creative Cloud. So the
  // wordmark rendered in Text on the author's screen and in Display on every device
  // in the world, which is what made its tracking look device-dependent.
  fontFamily: '"ivypresto-display", Georgia, serif',
  fontSize: '36px',
  fontStyle: 'normal',
  fontWeight: 400,
  lineHeight: 'normal',
  // Tracking belongs to the cut it was drawn against. Originally -2.88px (-0.08em at
  // the 36px desktop size), tuned by eye against IvyPresto Text.
  //
  // The two cuts carry the same letterforms and differ almost entirely in side
  // bearing: across J.JONSHAW, Text sets 5.272em and Display 4.780em, and the whole
  // 0.492em gap is accounted for by side bearings alone (mean lsb 35.7/1000em in
  // Text against 8.3 in Display, several of them negative). Display is Text with
  // ~0.055em/glyph of tracking already taken out for headline sizes — so -0.08em on
  // top of it read as -0.135em against what was actually being tuned.
  //
  // -0.025em reproduces that intended fit on Display: -0.08 + 0.055. Because the ink
  // widths match, holding the set width holds the gaps too.
  letterSpacing: '-0.025em',
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

const NavItem = ({ label, href, onClick, disabled, isActive, fontSize, color }) => {
  const [isHovered, setIsHovered] = useState(false);
  const active = isActive || isHovered;

  const sharedProps = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
    style: {
      ...NAV_ITEM_BASE_STYLE,
      ...(href ? LINK_RESET_STYLE : null),
      ...(color ? { color } : null),
      ...(href && disabled ? { pointerEvents: 'none' } : null),
      fontSize,
      opacity: disabled ? 0.6 : active ? 1 : 0.7
    }
  };

  // No href means nothing to link to yet (CONTACT without an address).
  if (!href) {
    return (
      <button type="button" onClick={onClick} disabled={disabled} {...sharedProps}>
        {label}
      </button>
    );
  }

  return (
    <a
      href={href}
      onClick={inPageLinkHandler(onClick)}
      aria-disabled={disabled || undefined}
      aria-current={isActive ? 'location' : undefined}
      {...sharedProps}
    >
      {label}
    </a>
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
    { label: 'WORK', href: pathFor(NAVIGATION_DESTINATIONS.OVERVIEW), onClick: onWorkClick },
    { label: 'ABOUT', href: pathFor(NAVIGATION_DESTINATIONS.ABOUT), onClick: onAboutClick },
    // A mailto: is left to the browser; there is no in-page version of it.
    CONTACT_EMAIL
      ? { label: 'CONTACT', href: `mailto:${CONTACT_EMAIL}`, onClick: null }
      : { label: 'CONTACT', onClick: onContactClick }
  ];

  return (
    <nav
      className={blend ? 'legible-blend' : undefined}
      style={{
        ...NAV_BASE_STYLE
      }}
    >
      <div style={NAV_INNER_STYLE}>
        <a
          href={pathFor(NAVIGATION_DESTINATIONS.HERO)}
          onClick={inPageLinkHandler(onHomeClick)}
          style={{
            ...NAME_BUTTON_STYLE,
            ...LINK_RESET_STYLE,
            ...(isTransitioning ? { pointerEvents: 'none' } : null),
            ...(color ? { color } : null),
            fontSize: isDesktop ? '36px' : '28px',
            opacity: isTransitioning ? 0.6 : 1
          }}
          aria-disabled={isTransitioning || undefined}
          aria-label="Jon Shaw, home"
        >
          J.JONSHAW
        </a>

        {/* Steps back while a media viewer is open — see index.css. The
            wordmark stays: it is the way back out of a case study, and it sits
            clear of the lightbox's own controls. */}
        <div
          className="site-nav__items"
          style={{ display: 'flex', gap: isDesktop ? '34px' : '16px', alignItems: 'center' }}
        >
          {navItems.map((item) => (
            <NavItem
              key={item.label}
              label={item.label}
              href={item.href}
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
