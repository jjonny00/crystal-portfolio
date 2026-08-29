// src/caseStudies/mesa/mesaContent.js
//
// Mesa's copy and media descriptors. Structured where structure helps (metadata,
// outcomes, media) and left as prose arrays everywhere else — the page itself is
// composed in MesaCaseStudy.jsx, not described here.
//
// `**bold**` is supported inline. Media entries without a `src` render the
// system placeholder at the correct size; supplying `src`/`fullSrc` later is the
// only change needed to drop the real asset in.
import heroImage from './assets/hero.webp';
import prototype01 from './assets/prototype01.webp';
import prototype02 from './assets/prototype02.webp';
import prototype03 from './assets/prototype03.webp';
import oneturn from './assets/one-turn01.webp';
import previewmesa from './assets/preview-mesa.webp';
import tightOpenTight01 from './assets/tight-open-tight01.webp';
import tightOpenTight02 from './assets/tight-open-tight02.webp';
import tightOpenTight03 from './assets/tight-open-tight03.webp';

export const mesaContent = {
  projectName: 'MESA',
  title: 'How Turns Create Tension',

  hero: {
    intro: [
      'Mesa is an asynchronous competitive strategy game built around one idea: **turns should create tension**.',
      "Players draw from the same board, so every move can advance their own strategy or disrupt their opponent's. Powerful abilities deal less damage, forcing a continual choice between pressing the advantage now and controlling what happens next.",
      'I originated the concept and led the game design, creative direction, production, and delivery with a five-person team at Forest Giant.',
    ],
    media: {
      src: heroImage,
      alt: 'Mesa running on an iPhone, held in one hand during a match.',
    },
  },

  overview: {
    title: 'Finding the Game Before Writing Code',
    body: [
      "Mesa began as one of Forest Giant's internal Friday projects, when small teams could pitch and explore their own ideas outside client work.",
      'The original concept was a reimagining of Memory where completing a match unlocked a power. The premise was easy to understand, but the first version was not much of a game.',
      'We rebuilt it through physical prototyping.',
      'The UI/UX designer and I experimented with cards, squares, circles, diamonds, and different board structures before arriving at a hexagonal tile with three colored corners. We attached printed tiles to poker chips so they could be rotated, stacked, and rearranged by hand.',
      'The physical prototype became the complete game. We used it to design the turn structure, board layouts, powers, damage values, tile distribution, and victory conditions before development began.',
      'Coworkers from outside the team began joining playtests voluntarily. Some returned repeatedly, looking for stronger combinations and counterplays. When people began spending their own Friday project time playing Mesa, we knew the system had enough depth to move into full production.',
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
    metadata: [
      {
        label: 'Role',
        values: ['Creator', 'Creative Direction', 'Game Design', 'Systems + UI/UX'],
      },
      {
        label: 'Team',
        values: [
          'Product Owner / Creative Lead',
          'UX Researcher',
          'UI/UX Designer',
          'Frontend Developer ×2',
        ],
      },
      { label: 'Genre', values: ['Competitive Strategy'] },
      { label: 'Mode', values: ['Asynchronous Multiplayer'] },
      { label: 'Platform', values: ['iOS'] },
      { label: 'Outcome', values: ['Top 5 Free Games in the U.S. App Store within three days'] },
    ],
  },

  turnSequence: {
    title: 'One Turn, Several Decisions',
    intro: [
      'Mesa is played between two opponents drawing from the same layered pyramid.',
      'On each turn, a player selects an exposed tile from the shared board, places it into one of three personal slots, rotates it so the desired colored corner faces the center, and confirms the move.',
      'Match all three center-facing corners and the player damages their opponent and unlocks the power associated with that color. The power cannot be used until a later turn.',
      'Both players can see the colors their opponent is building toward. That makes every tile a shared strategic resource.',
      'Taking one tile might complete your own match. It might also remove the tile your opponent needs, expose a valuable corner beneath it, or prevent a specific power from being earned.',
      'The player is rarely choosing only for themselves.',
    ],
    media: {
      src: oneturn,
      alt: 'Diagram of a single Mesa turn, from selecting a shared tile through earning a power.',
    },
    caption:
      'From selecting a shared tile to earning a power, each turn moves through a short sequence of choices before the opponent takes control.',
  },

  boardTeaches: {
    title: 'The Board Teaches the Game',
    body: [
      'The pyramid begins with only one legal move.',
      'Because each layer partially covers the one beneath it, only the tile at the peak can initially be selected. The opening turn introduces the core interaction without asking the player to evaluate several options at once.',
      'Available tiles appear at full brightness. Covered tiles are dimmed, while their exposed corners remain visible. After selecting a tile, the player can move it between slots and rotate it as many times as needed before confirming.',
      'Brief instructions reinforce the sequence: **Pick a tile. Select a slot. Rotate. Confirm.**',
      'The game included a full tutorial, but the primary interaction was taught through constraint, visual hierarchy, and immediate feedback rather than a large block of explanation.',
      'The board gradually releases that constraint as the player becomes more comfortable.',
    ],
    media: {
      src: previewmesa,
      alt: 'The opening Mesa board, with only the peak tile selectable and the placement slots below.',
    },
    caption:
      'The pyramid begins with a single legal move, using the board itself to introduce tile selection before the decision space expands.',
  },

  tightOpenTight: {
    title: 'Tight, Open, Tight',
    intro: [
      'The pyramid does more than onboard the player. Its structure creates the arc of the match.',
      'Removing the first tile exposes several more. Each choice reveals more of the layers beneath, increasing both the number of available moves and the amount of information players can use.',
      "By the middle of the game, the board is open. Players have multiple colors to pursue, powers waiting to be used, and enough information to anticipate each other's intentions.",
      'Then the board begins to contract.',
      'With fewer tiles remaining, the match becomes easier to read but harder to solve. Players compare their remaining health, calculate which colors can still deal enough damage, and decide whether to pursue their own match or deny the one their opponent is building toward.',
      'If the opponent completes that match, how close will it bring you to zero? Can you remove enough tiles of that color before they do? Is the better move to score damage now, or use a power to control what remains?',
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
    caption:
      'As the pyramid is revealed, available choices expand through the midgame before contracting into a more legible, consequential endgame.',
    takeaway: [
      '**Tight, open, tight.**',
      'We discovered that rhythm by testing several board configurations. The pyramid consistently produced the clearest opening, the widest range of midgame strategies, and the most competitive endings.',
      '**The board is always revealing and always running out.**',
    ],
  },

  costOfPower: {
    title: 'The Cost of Power',
    body: [
      'Every color match produces two rewards: damage against the opponent and a power that can alter the match.',
      'The stronger the power, the less immediate damage its color deals.',
      "A **Bomb** deals only five damage but can destroy every tile in an opponent's slots if they select the trapped tile. **Freeze** deals more damage but temporarily locks part of the shared board. **Shuffle** can rotate your own tiles or disrupt an opponent's nearly completed match without sacrificing the normal draw.",
      '**Steal** was especially revealing during testing. New players often ignored it because it dealt little damage. Experienced players recognized that a single stolen tile could block an opponent, complete their own match, deal damage, and unlock another power at the same time.',
      'That difference was intentional. The rules were easy to understand, but their value changed as players learned to read the entire board.',
      'A compact power key showed each ability, its damage, and how many matching tiles remained. Detailed descriptions stayed behind an information control. The interface exposed the economy without telling the player which decision to make.',
    ],
    media: {
      placeholder: 'Screenshot — power table with each ability, damage value, and tiles remaining',
      alt: 'The Mesa power key, listing each ability alongside its damage value and remaining tile count.',
    },
    caption:
      "The power key exposes each ability's damage and remaining tile count, giving players the information to weigh immediate damage against board control.",
  },

  asynchronous: {
    title: 'Designing for Asynchronous Play',
    intro: [
      'Mesa was designed around short asynchronous turns. Players could remain in a match waiting for a response, but they could also leave and maintain as many as five active games at once.',
      'A $1.99 expansion unlocked unlimited matches and additional board layouts. Players who purchased the new layouts could invite anyone to play them, allowing the content to spread without dividing the player base.',
      'Game Center handled identities, friend invitations, random opponents, and notifications. That allowed a small team to build multiplayer without creating an independent account and matchmaking platform.',
      "When a player returned, the opponent's previous turn automatically replayed. They could replay it again at any time to see which tile had been taken, how it was placed, what damage was dealt, and how the shared board had changed.",
      "A gradient beneath the board reinforced the flow. It illuminated the pyramid when a tile could be selected, moved toward the player's slots during placement, and traveled toward the opponent when the turn changed. When a power was earned, the board filled with that power's color.",
      'The same visual system communicated action, ownership, and turn state throughout the match.',
    ],
    media: {
      placeholder:
        'Sequence or animation — Opponent Takes Turn → Player Returns → Previous Turn Replays → Context Restored → Next Decision',
      alt: "Sequence showing a returning player watching their opponent's previous turn replay.",
    },
    caption:
      "Returning players see their opponent's previous move replay automatically, restoring the context needed to make the next decision.",
  },

  conclusion: {
    outcomes: [
      { value: 'Top 5 Free Games', detail: 'U.S. App Store' },
      { value: '3 Days', detail: 'To reach the Top 5' },
      { value: '~4 Months', detail: 'From Friday prototype to shipped game' },
    ],
    lessons: [
      'Mesa launched on July 24, 2014 and reached the Top 5 Free Games in the U.S. App Store within three days.',
      'Mesa launched without an AI opponent, ranked play, recurring challenges, abandonment rules, or a post-launch content roadmap. Players could not practice alone, test new strategies immediately, or remain engaged when an opponent stopped responding.',
      'The expansion revealed another gap in our thinking. We expected players who enjoyed Mesa to pay for more than five simultaneous matches. Additional board layouts added some variety, but the purchase was still built primarily around removing a limit rather than delivering a meaningful new layer of play.',
      'We were asking players to pay because they wanted **more Mesa**, without giving them enough that felt meaningfully new.',
      'A stronger expansion would have paired unlimited matches and alternate boards with substantial content: AI opponents, new powers, challenges, progression, or competitive goals.',
      'Forest Giant was accustomed to creating products for clients and handing them off. Mesa taught me that launching your own product is different. Release is not the end of the design process. It is the point where real behavior begins revealing what the product needs next.',
      'It also taught me that monetization cannot be treated as a gate placed around an existing experience. The paid offering needs its own compelling value proposition, designed alongside retention and post-launch content rather than added after the core game is complete.',
    ],
    takeaway:
      'The core experience, business model, retention systems, and roadmap must be designed as one connected system.',
  },
};

export default mesaContent;
