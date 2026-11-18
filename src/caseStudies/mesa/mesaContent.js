// src/caseStudies/mesa/mesaContent.js
//
// Mesa's copy and media descriptors. Structured where structure helps (metadata,
// outcomes, media) and left as prose arrays everywhere else — the page itself is
// composed in MesaCaseStudy.jsx, not described here.
//
// Copy is the finishing pass (November 2026): six sections, the
// returning-player point folded into the ending. The power key is shown as its
// Steal row only: the full key and the ability cards disagree on Draw and
// Freeze, so the whole key waits on the shipped build or final balance sheet.
//
// `**bold**` is supported inline. Media entries without a `src` render the
// system placeholder at the correct size; supplying `src`/`fullSrc` later is the
// only change needed to drop the real asset in.
import openingBoard from './assets/opening-board.webp';
import prototype01 from './assets/prototype01.webp';
import prototype02 from './assets/prototype02.webp';
import prototype03 from './assets/prototype03.webp';
import oneTurn01 from './assets/one-turn/one-turn-01.webp';
import oneTurn02 from './assets/one-turn/one-turn-02.webp';
import oneTurn03 from './assets/one-turn/one-turn-03.webp';
import oneTurn04 from './assets/one-turn/one-turn-04.webp';
import oneTurn05 from './assets/one-turn/one-turn-05.webp';
import tightOpenTight01 from './assets/tight-open-tight01.webp';
import tightOpenTight02 from './assets/tight-open-tight02.webp';
import tightOpenTight03 from './assets/tight-open-tight03.webp';
import powerKeySteal from './assets/power-key-steal.webp';

export const mesaContent = {
  projectName: 'MESA',
  title: 'How Turns Create Tension',

  hero: {
    intro: [
      'Both players draw from the same board. Every tile you take changes what your opponent can do next. I came up with Mesa and led a five-person team from paper prototypes to an iOS launch that reached the App Store’s Top 5 Free Games and 150,000 downloads in its first week.',
    ],
    // The opening board: one playable tile, at the peak. Its own ratio,
    // uncropped, so the whole pyramid stays in frame.
    media: {
      src: openingBoard,
      alt: 'The opening Mesa board: a pyramid of hexagonal tiles in which only the tile at the peak is lit and playable, every tile beneath it dimmed.',
      aspectRatio: '1480 / 1435',
      caption: 'Only the tile at the peak can be played.',
    },
    // Individual interface screens are not claimed: ownership isn't documented.
    metadata: [
      { label: 'Role', values: ['Game concept', 'Systems design', 'Team lead'] },
      { label: 'Prototyping', values: ['Paper prototyping with the UI/UX designer'] },
      { label: 'Team', values: ['Five people'] },
      { label: 'Platform', values: ['iOS', 'Asynchronous multiplayer'] },
      { label: 'Released', values: ['July 24, 2014'] },
    ],
  },

  overview: {
    title: 'We Found the Game on Paper',
    body: [
      'Mesa started as a variation on Memory. Completing a match earned you a power, but there wasn’t much to decide. Our UI/UX designer and I worked through cards, shapes, and board layouts until we had hexagonal tiles with three colored corners. We stuck the printed tiles to poker chips so we could turn them, stack them, and play whole matches by hand.',
      'We used those matches to balance damage, powers, and the distribution of colors. When coworkers started spending their own Friday project time testing combinations against each other, we decided to build it.',
    ],
    gallery: [
      {
        src: prototype01,
        alt: 'Front view of Mesa’s physical prototype board, with colorful hexagonal tiles stacked in layered rows to form the game’s pyramid structure.',
      },
      {
        src: prototype02,
        alt: 'A player reaches into the stacked physical Mesa prototype during a tabletop playtest, surrounded by colorful hexagonal tiles and early game pieces.',
      },
      {
        src: prototype03,
        alt: 'Three physical Mesa tiles arranged in the player’s matching area during a prototype playtest, showing the colored corners used to build matches.',
      },
    ],
    caption:
      "From cards to stacked hex tiles, Mesa's core rules, powers, and board structure were designed and balanced in physical form before development began.",
  },

  // The acting player's input, screen by screen. The shared-board consequence
  // is the copy's to explain: there are no two consecutive legal states of
  // both sides to show it with.
  turnSequence: {
    title: 'Taking a Tile Means Choosing What to Leave Behind',
    intro: [
      'Pick an exposed tile, place it in one of your three slots, and rotate a colored corner toward the center. Match three corners to deal damage and earn a power. Both players can see the match the other is building. The tile you want might also be the one your opponent needs. And once you lift it, what you uncover becomes an option for their turn.',
    ],
    // Rendered by MediaRail in the SequenceSection content slot: one row at a
    // shared height, scrolled on phones. The screens number themselves, so the
    // rail carries no labels of its own.
    //
    // The ratio is the artwork's own, uncropped: each screen renders at the
    // rail's height and exactly the width that produces. The artwork carries
    // ~100px of its own dark canvas either side of the phone, which is part of
    // the picture rather than something the layout should trim.
    steps: [
      {
        key: 'pick',
        src: oneTurn01,
        alt: 'Step 1, Pick a tile: the shared pyramid with one exposed tile circled.',
        aspectRatio: '1490 / 3107',
      },
      {
        key: 'slot',
        src: oneTurn02,
        alt: "Step 2, Select a slot: the chosen tile showing each corner's damage value, with an arrow to an empty personal slot.",
        aspectRatio: '1490 / 3107',
      },
      {
        key: 'rotate',
        src: oneTurn03,
        alt: 'Step 3, Rotate: the placed tile turning so the intended coloured corner faces the centre.',
        aspectRatio: '1490 / 3107',
      },
      {
        key: 'confirm',
        src: oneTurn04,
        alt: 'Step 4, Confirm your selection: all three slots filled, with the confirm control live.',
        aspectRatio: '1490 / 3107',
      },
      {
        key: 'power',
        src: oneTurn05,
        alt: "Step 5, Power acquired — Destroy: the match completes, the opponent's health falls from 100 to 90, and the power unlocks.",
        aspectRatio: '1490 / 3107',
      },
    ],
    caption:
      'From selecting a shared tile to earning a power, each turn moves through a short sequence of choices before the opponent takes control.',
  },

  board: {
    title: 'The Board Teaches the Opening and Tightens the Endgame',
    intro: [
      'We chose the pyramid because it gave us the clearest opening and the most competitive endings in our paper tests. Only the top tile is playable at first. It’s bright, the covered tiles are dim, and you can see enough of their corners to anticipate what’s underneath.',
      'The board opens up through the middle of the match. Then the supply runs down. You can see which colors are left and what your opponent needs. The board becomes easier to read, but harder to solve.',
    ],
    // Rendered by TightOpenTightStages in the FeatureSection content slot.
    // Each stage's media is an ordinary descriptor: swap 'placeholder' for
    // 'src' with an import to drop artwork in, exactly like every other slot.
    stages: [
      {
        key: 'opening',
        label: 'Early Game',
        note: 'Few choices, limited information',
        media: {
          src: tightOpenTight01,
          alt: 'The Mesa board at the opening of a match, with only the tile at the peak of the pyramid selectable.',
        },
      },
      {
        key: 'midgame',
        label: 'Midgame',
        note: 'Choice space at its widest',
        media: {
          src: tightOpenTight02,
          alt: 'The Mesa board mid-match, with many tiles exposed and several colours available to pursue.',
        },
      },
      {
        key: 'endgame',
        label: 'Endgame',
        note: 'Legible, contracting, decisive',
        media: {
          src: tightOpenTight03,
          alt: 'The Mesa board late in a match, with few tiles remaining and each choice consequential.',
        },
      },
    ],
    // The curves along the bottom of the stages are a design explanation, not
    // telemetry, and the caption says so.
    caption: 'Conceptual match rhythm: choices in yellow, tension in red.',
  },

  powers: {
    title: 'Steal Is Worth More Than Its Five Damage',
    body: [
      'New players often passed over Steal. Experienced players saw a way to take a tile from an opponent’s slot, interrupt their match, and finish their own. That match could earn another power. The damage number told you what the hit was worth. Reading both players’ slots told you what the move was worth.',
    ],
    // Steal's row of the shipped power key, the one value both artifacts agree
    // on (−5). Shown at about its own size: it is a 506px crop.
    media: {
      src: powerKeySteal,
      alt: 'The Steal row of Mesa’s power key: the Steal icon, −5 damage, and 2 of 21 matching tiles remaining.',
      aspectRatio: '506 / 70',
      fit: 'contain',
      caption: 'Steal deals five damage and takes a tile from the opponent’s slots.',
    },
  },

  // The replay point lives here now; the retention explanation is a design
  // reflection, not a causal measurement. No outcome tiles: the launch figures
  // are in the hero.
  conclusion: {
    lessonsTitle: 'A Strong First Week Needed a Stronger Second Month',
    lessons: [
      'Players could keep several matches going. When they came back, their opponent’s last move replayed so they could see what had changed. We had designed for someone returning to a match. After the first month, we saw how little we had given them to return to once that match was over.',
      'If I were building Mesa again, I’d prototype what happens between matches while the core rules are still on paper. I’d start with solo practice and a competitive goal that carries into the next game.',
    ],
  },
};

export default mesaContent;
