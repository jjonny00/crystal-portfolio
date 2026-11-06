// The CTA label's face, shared by KnockoutButton and the mobile project card's
// CTA row (ProjectFocusSection) so both set the label identically.
//
// The hero CTA's label (.hero-section__cta-label) is the template: semi-condensed
// semibold capitals, untracked. `fontStretch` and `--wdth` are set together, as
// everywhere (index.css): iOS Safari only follows --wdth. The capitals come from
// `textTransform`, so the accessible name keeps the copy's own case.
export const ctaTypeStyle = (isMobile) => ({
  fontFamily: '"acumin-variable", "Acumin VF", sans-serif',
  // 21px on a phone: the type scale's phone step (type.css).
  fontSize: isMobile ? '21px' : '24px',
  fontWeight: 600,
  fontStretch: '87.5%',
  '--wdth': 87.5,
  letterSpacing: 0,
  lineHeight: 1,
  textTransform: 'uppercase',
});
