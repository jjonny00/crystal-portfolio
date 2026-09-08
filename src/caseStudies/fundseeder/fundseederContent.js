// src/caseStudies/fundseeder/fundseederContent.js
//
// FundSeeder's copy and media descriptors. Structured where structure helps
// (metadata, outcomes, media) and left as prose arrays everywhere else — the
// page itself is composed in FundSeederCaseStudy.jsx, not described here.
//
// `**bold**` is supported inline. Every media entry here is a placeholder: no
// `src`, a `placeholder` describing the asset still to be made, and the `alt`
// the real image will carry. Adding `src` (and `fullSrc` where the enlarged
// view wants more resolution) is the only change needed to drop an asset in —
// the box it will occupy is already reserved, so nothing reflows.

export const fundseederContent = {
  projectName: 'FUNDSEEDER',
  title: 'Designing the Ladder',

  hero: {
    intro: [
      'More than 1,000 strategies compete for attention on FundSeeder. I designed the progression and comparison systems that make that competition understandable, motivating, and consequential.',
    ],
    media: {
      placeholder:
        'Hero — a focused composition showing the user’s tier and nearby leaderboard position. Progression and competition read immediately, without parsing the whole product interface.',
      alt: 'A FundSeeder participant’s tier shown beside their position on the leaderboard.',
    },
  },

  overview: {
    title: 'Designing a Meaningful Competition',
    body: [
      'FundSeeder identifies independent trading talent and connects exceptional performers with investment capital. Participants build a verified performance record, compare themselves against others, and potentially move into consideration for funding.',
      'We inherited a fragmented product with disconnected leaderboards and no clear sense of progression. Despite years of operation, it had never resulted in a trader being seeded.',
      'We rebuilt FundSeeder from scratch around one competitive system. I led the product and systems design, including the progression model, leaderboard, comparison tools, identity system, and Signal, the internal application that moves promising participants through review.',
      'The rebuilt platform launched on July 31, 2025. More than 1,000 strategies are now officially ranked, and 17 traders have been seeded.',
    ],
    metadata: [
      { label: 'Role', values: ['Principal Product Designer'] },
      {
        label: 'Team',
        values: [
          'Product Owner',
          'CEO',
          'Lead Developer',
          'Senior Backend Developers ×2',
          'Customer Support',
        ],
      },
      { label: 'Platform', values: ['Responsive Web'] },
      { label: 'Ranked Strategies', values: ['1,027'] },
      { label: 'Traders Seeded', values: ['17'] },
    ],
    gallery: [
      {
        key: 'dashboard',
        placeholder:
          'Dashboard — the participant’s own standing: tier, rank, and nearby competitors.',
        alt: 'The FundSeeder dashboard, showing a participant’s tier, rank, and the competitors immediately around them.',
      },
      {
        key: 'leaderboard',
        placeholder: 'Leaderboard — the single shared ranking every strategy appears in.',
        alt: 'The FundSeeder leaderboard, listing ranked strategies in one shared competition.',
      },
      {
        key: 'signal',
        placeholder:
          'Signal — the internal application the team reviews and advances participants in.',
        alt: 'Signal, FundSeeder’s internal review application, showing a participant moving through the selection process.',
      },
    ],
    caption:
      'The public competition and internal selection process operate as two sides of the same system.',
  },

  tiers: {
    title: 'A Rank Is a Position, Not a Goal',
    intro: [
      'A leaderboard tells participants where they stand, but a number alone provides little sense of progress.',
      'I introduced five tiers to divide the ranking into recognizable stages. D through A reflect measured performance and can change as new results are calculated. Each tier gives participants a boundary to enter, defend, and eventually break through.',
      'The final S tier works differently. It cannot be reached through performance alone. It is reserved for participants who complete FundSeeder’s review process and are selected for funding.',
      'This distinction gave the system both short-term and long-term goals. Participants could work toward the next tier while understanding that the highest status represented a real outcome beyond the leaderboard.',
    ],
    media: {
      placeholder:
        'Tier progression diagram — D → C → B → A → Review → S. D through A are performance-based progression; S is selection.',
      alt: 'Tier progression diagram: D, C, B and A are reached through performance, then a review stage leads to S, which is reached through selection.',
    },
    caption:
      'Performance moves participants through D–A. S represents selection, not simply a higher score.',
    takeaway: 'Tiers transformed an abstract ranking into a ladder with recognizable milestones.',
  },

  leaderboard: {
    title: 'One Competition, Many Ways to Read It',
    intro: [
      'The previous experience divided participants into separate leaderboards. That made each category easier to manage, but it weakened the meaning of the overall competition.',
      'We replaced them with one shared ranking. Everyone could now understand their position across FundSeeder as a whole.',
      'Filters preserved the ability to find relevant comparisons without breaking the population apart. Participants could narrow the leaderboard around characteristics such as experience, approach, account size, or area of specialization while retaining their overall rank.',
      'The interface also reveals information progressively. Each row contains enough information to compare strategies quickly, then expands when someone wants to investigate further.',
    ],
    gallery: [
      {
        key: 'expanded-row',
        placeholder: 'Full leaderboard with an expanded entry.',
        alt: 'The full FundSeeder leaderboard with one entry expanded to show a strategy’s detail.',
      },
      {
        key: 'filters',
        placeholder: 'Leaderboard filter interface.',
        alt: 'The leaderboard’s filter interface, narrowing the ranking by experience, approach, account size, and specialization.',
      },
    ],
    caption:
      'One ranking establishes shared standing. Filters let participants decide which comparisons are meaningful to them.',
  },

  nextRival: {
    title: 'The Next Rival Matters More Than First Place',
    body: [
      'Large leaderboards tend to focus attention on the top. For most participants, that can make progress feel distant rather than motivating.',
      'I anchored each participant’s entry to the bottom of the leaderboard. Their own standing remains visible while they browse, making every comparison immediate.',
      'On the dashboard, I reduced the competition to a smaller neighborhood. The participant sits at the center, with the three positions directly above and below. A percentile-based message provides broader context without making the top-ranked strategy the only measure of success.',
      'Together, these views answer three different questions:',
    ],
    // A list rather than three more paragraphs: they are one set, and the copy
    // above introduces them as one.
    questions: [
      'Where do I stand overall?',
      'Who is immediately ahead of me?',
      'What could I realistically achieve next?',
    ],
    gallery: [
      {
        key: 'dashboard-comparison',
        placeholder:
          'Dashboard comparison — the participant centred among the three positions above and below.',
        alt: 'The dashboard’s comparison view, with the participant centred between the three positions above and below them.',
      },
      {
        key: 'pinned-entry',
        placeholder: 'Crop of the pinned leaderboard entry, anchored to the bottom of the list.',
        alt: 'A crop of the leaderboard showing the participant’s own entry pinned to the bottom of the list.',
      },
    ],
    caption:
      'Centering participants among nearby rivals turns a ranking of more than 1,000 into a sequence of attainable steps.',
    takeaway: 'The next position creates a more useful goal than first place.',
  },

  identity: {
    title: 'Identity Without Self-Promotion',
    body: [
      'Competition needs recognizable participants, but FundSeeder could not become a directory for people or firms advertising themselves to investors.',
      'Real names and institutional affiliations were restricted. Removing identity completely, however, would leave the leaderboard feeling anonymous and difficult to follow.',
      'I designed a constrained identity system using generated names, approved custom names, and country flags. Participants gain a distinct presence without exposing personal or professional affiliations. The flags also make the international scale of the competition visible at a glance.',
      'Custom names provide a greater sense of ownership, but each request passes through an internal approval process before appearing publicly.',
    ],
    gallery: [
      {
        key: 'names-and-flags',
        placeholder: 'Leaderboard crop showing generated names and country flags.',
        alt: 'A crop of the leaderboard showing participants identified by generated names and country flags.',
      },
      {
        key: 'name-approval',
        placeholder: 'The custom-name approval interface.',
        alt: 'The custom-name approval interface, with a requested name awaiting internal review.',
      },
    ],
    caption:
      'Names and country flags create recognizable competitors while protecting the boundaries of the platform.',
  },

  destination: {
    title: 'Competition Needs a Destination',
    intro: [
      'Progress matters more when it leads somewhere meaningful.',
      'Every strategy added to FundSeeder also enters Signal, the internal system I designed for reviewing participants and operating the platform. Public performance creates visibility, while Signal gives the FundSeeder team the structure and context required to act on it.',
      'Promising participants move through data validation, quantitative review, qualitative review, and finally selection. The public ranking can draw attention to strong performance, but it never makes the funding decision automatically.',
      'This human review process is what separates A from S. The competitive system creates aspiration. Signal turns exceptional performance into a real opportunity.',
    ],
    media: {
      placeholder:
        'System diagram — Join → Compete → Progress → Review → Selection, with the public experience running above the sequence and Signal below it.',
      alt: 'System diagram of the FundSeeder pipeline: join, compete, progress, review, selection — the public experience above the sequence, Signal below it.',
    },
    caption:
      'The public system creates progression. The internal system determines when performance merits a real-world opportunity.',
    takeaway: 'Competition became the beginning of the selection process, not its endpoint.',
  },

  conclusion: {
    outcomes: [
      { value: '1,027', detail: 'Strategies officially ranked' },
      { value: '17', detail: 'Traders seeded since relaunch' },
      { value: '13', detail: 'Currently allocated' },
      { value: 'July 31, 2025', detail: 'Rebuilt platform launched' },
    ],
    lessonsTitle: 'Designing for Attainable Progress',
    lessons: [
      'Before the rebuild, FundSeeder had never seeded a trader. Since launch, 17 traders have progressed through the platform and into funding, with 13 still actively allocated.',
      'The work reinforced that ranking people does not automatically create meaningful competition. Participants need milestones they can recognize, rivals relevant to their current position, and confidence that progress leads somewhere real.',
      'The most important design decision was not putting more information on the leaderboard. It was changing the scale at which participants experienced the competition: from an unreachable first place to the next rank, the next tier, and the next opportunity.',
    ],
    takeaway:
      'I designed a competitive system that made progress visible, comparison relevant, and advancement consequential.',
  },
};

export default fundseederContent;
