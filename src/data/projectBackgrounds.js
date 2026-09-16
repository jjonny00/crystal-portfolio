// Per-project sky colours. colorA is the bottom of the gradient and colorB the
// top — see GradientBackground’s fragment shader.
//
// The mobile scrim used to be configured from here too. It is authored per
// project in data/projects.js now, under `scrim` — colour, opacity and whether
// the copy goes dark. These colours are only the sky, and the scrim falls back
// to colorA when a project does not name a wash colour of its own.
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
    // FundSeeder. The lightest colorA in the set by a wide margin, and the one
    // that sent its preview copy into the grey band — see its `scrim` block in
    // projects.js, the only project set to dark copy.
    colorA: '#45afa9',
    colorB: '#2079b8'
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
