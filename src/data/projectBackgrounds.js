// Per-project sky colours. colorA is the bottom of the gradient and colorB the
// top — see GradientBackground’s fragment shader.
//
// `scrimInvert` is optional and read through scrimTone.js: it opts a project
// out of the deepened colorA wash and into a near-white one, with the preview
// copy flipped to the dark ink to suit. It is for palettes whose colorA is
// itself light enough that washing it over the scene raises the backdrop into
// the greys cream copy cannot clear — rather than fight that, the section reads
// as a light panel. Set it when the preview copy is hard to read on a phone
// even with the scrim up. It changes how the whole section reads, so it is a
// per-project call and not a threshold on colorA.
export const projectBackgrounds = {
  default: {
    colorA: '#212124',
    colorB: '#070015'
  },
  overview: {
    colorA: '#11182f',
    colorB: '#16102c'
  },
  // neutral keys in the same order as projects.js
  project01: {
    colorA: '#004d26',
    colorB: '#2e1851'
  },
  project02: {
    colorA: '#16283e',
    colorB: '#00364d'
  },
  project03: {
    colorA: '#45afa9',
    colorB: '#2079b8',
    // FundSeeder. The lightest colorA in the set by a wide margin, and the one
    // that sent its preview copy into the grey band.
    scrimInvert: true
  },
  project04: {
    colorA: '#00034d',
    colorB: '#00364d'
  },
  project05: {
    colorA: '#050022',
    colorB: '#602000'
  },
  project06: {
    colorA: '#2c53a1',
    colorB: '#373c4a'
  },
  // runtime crystal keys
  exploration: {
    colorA: '#004d26',
    colorB: '#4d0026'
  },
  craft: {
    colorA: '#001a4d',
    colorB: '#4d4d00'
  },
  narrative: {
    colorA: '#1a4d00',
    colorB: '#4d004d'
  },
  system: {
    colorA: '#4d2600',
    colorB: '#00264d'
  },
  leadership: {
    colorA: '#2d004d',
    colorB: '#334d00'
  },
  empathy: {
    colorA: '#08004d',
    colorB: '#00a67f'
  }
};
