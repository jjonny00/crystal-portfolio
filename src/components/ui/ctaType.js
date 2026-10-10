// The CTA label's face, shared by KnockoutButton and the mobile project card's
// CTA row (ProjectFocusSection) so both set the label identically.
export const ctaTypeStyle = (isMobile) => ({
  fontFamily: '"acumin-variable", "Acumin VF", sans-serif',
  // 21px on a phone: the type scale's phone step (type.css).
  fontSize: isMobile ? '21px' : '24px',
  fontWeight: 600,
  letterSpacing: '-0.48px',
});
