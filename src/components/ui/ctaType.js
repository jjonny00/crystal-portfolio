// The CTA label's face, shared by KnockoutButton and the mobile project card's
// CTA row (ProjectFocusSection) so both set the label identically.
//
// The hero CTA's label (.hero-section__cta-label) is the template: semi-condensed
// semibold, untracked, in the copy's own initial capitals (the labels are
// written in title case; buttons are the one place the site doesn't set its
// labels in capitals). `fontStretch` and `--wdth` are set together, as
// everywhere (index.css): iOS Safari only follows --wdth.
export const ctaTypeStyle = (isMobile) => ({
  fontFamily: '"acumin-variable", "Acumin VF", sans-serif',
  // 21px on a phone: the type scale's phone step (type.css).
  fontSize: isMobile ? '21px' : '24px',
  fontWeight: 600,
  fontStretch: '87.5%',
  '--wdth': 87.5,
  letterSpacing: 0,
  lineHeight: 1,
});
