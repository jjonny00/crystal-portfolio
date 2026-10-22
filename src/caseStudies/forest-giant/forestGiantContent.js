// src/caseStudies/forest-giant/forestGiantContent.js
//
// Forest Giant's copy and media descriptors. Structured where structure helps
// (metadata, outcomes, media) and left as prose arrays everywhere else — the
// page itself is composed in ForestGiantCaseStudy.jsx, not described here.
//
// `**bold**` is supported inline. Media entries without a `src` render the
// system placeholder at the correct size; supplying `src`/`fullSrc` later is the
// only change needed to drop the real asset in.
//
// One slot is still a placeholder naming the asset it expects: the worksheet in
// "Giving People the Means to Lead" (see assets/README.md). Captions that would
// identify a session, place, date or Jon's part in a project are left out until
// those facts are confirmed.
import heroImage from './assets/hero.webp';
import quantified from './assets/quantified.webp';
import rothRiver from './assets/roth-river.webp';
import gross from './assets/gross.webp';
import studioFloor from './assets/studio-floor.webp';
import guidePage09 from './assets/guide/page-09.webp';
import guidePage09Full from './assets/guide/page-09-full.webp';
import guidePage11 from './assets/guide/page-11.webp';
import guidePage11Full from './assets/guide/page-11-full.webp';
import guidePage12 from './assets/guide/page-12.webp';
import guidePage12Full from './assets/guide/page-12-full.webp';
import guidePage23 from './assets/guide/page-23.webp';
import guidePage23Full from './assets/guide/page-23-full.webp';
import workshop from './assets/workshop.webp';
import dashboardReview from './assets/studio-life/dashboard-review.webp';
import shippedApps from './assets/studio-life/shipped-apps.webp';
import talkNight from './assets/studio-life/talk-night.webp';
import gridlock2019 from './assets/studio-life/gridlock-2019.webp';
import warmItUp from './assets/studio-life/warmitupfg.webp';

export const forestGiantContent = {
  projectName: 'FOREST GIANT',
  title: 'Building the Practice',

  hero: {
    intro: [
      'Forest Giant grew around ambitious interactive work. I helped build the creative practice that gave teams clearer ownership, shared understanding, and the freedom to do work they were proud of.',
    ],
    media: {
      src: heroImage,
      alt: 'A workshop in the Forest Giant studio: a dozen people stand on a rug between leather sofas and tall windows, watching one person point to a board covered in sticky notes.',
    },
  },

  overview: {
    title: 'The Creative Ambition',
    body: [
      'I joined Visual Scientists when it was a three-person team building websites and interactive experiences in Flash. Our technical lead, who later became Forest Giant’s CTO, and I had been making things together since we were sixteen. Years of experimentation and problem-solving had taught us how to work together.',
      'As Flash became more capable, our work grew into full applications. The shift toward mobile exposed the risk of tying our identity to one technology. We became Forest Giant with a commitment to choose tools around the work we wanted to make. At roughly six people, nearly every project involved the whole team. We were selective about what we took on and cared deeply about the quality of what we delivered.',
      'Over more than fifteen years, my responsibilities grew from designing interactive experiences to creative direction, business strategy, team health, and delivery. As co-founder and Chief Creative Officer, I helped shape both the work and the conditions in which people could do it well.',
    ],
    // Rendered as a 3-up beneath the narrative. Each image is captioned on its
    // own — project, date, and Jon's involvement, once confirmed — and none
    // should imply the project followed the later process.
    gallery: [
      {
        key: 'quantified',
        src: quantified,
        alt: 'Quantified on an iPhone and an Apple Watch lying on a concrete ledge: the phone shows a grid of coloured counters — meditate, angry, call Mom, drink 8oz of water, try something new, used Facebook — and the watch shows the water counter at 6.',
        aspectRatio: '3 / 2',
        caption: 'Quantified, an iPhone and Apple Watch app for counting the habits you want to track.',
      },
      {
        key: 'roth-river',
        src: rothRiver,
        alt: 'A person gestures at a large screen showing a Woodford Reserve barrel’s environment data — internal temperature, volume and pressure, the angel’s share, and external humidity — laid over a photograph of the barrel.',
        aspectRatio: '3 / 2',
        caption: 'A barrel-monitoring display for Roth River, reading the conditions inside a Woodford Reserve barrel.',
      },
      {
        key: 'gross',
        src: gross,
        alt: 'Gross on an iPhone beside a pair of earbuds: one day’s step count, with walking, running, other, and gross time totalled beside a colour-coded timeline of the day.',
        aspectRatio: '3 / 2',
        caption: 'Gross, an activity tracker that totals a day’s walking, running, and other movement.',
      },
    ],
    metadata: [
      { label: 'Role', values: ['Co-Founder', 'Chief Creative Officer'] },
      {
        label: 'Contributions',
        values: [
          'Interactive Design',
          'Creative Direction',
          'Team Leadership',
          'Collaborative Process Development',
        ],
      },
      { label: 'Time', values: ['15+ years'] },
      {
        label: 'Collaboration',
        values: ['CEO', 'CTO', 'Project Managers', 'Design, UX, and Technology Leads'],
      },
      {
        label: 'Work',
        values: ['Websites', 'Applications', 'Interactive Experiences', 'Connected Environments'],
      },
    ],
  },

  responsibility: {
    title: 'Responsibility Grew with the Studio',
    body: [
      'Larger contracts brought the resources to take on more ambitious work, along with more people, dependencies, and expectations. As we formed multiple teams, my role increasingly involved allocating resources, supporting people, and helping projects through difficult decisions. There was less time to design.',
      'The CTO and I had assumed that new teams would find the same rhythm we had developed through years of working together. We knew which questions to ask, when to share information, and when someone needed support. Much of that understanding had never been made explicit.',
      'As projects grew more complicated, particularly in our work with GE, the gaps became harder to ignore. Project managers did not always know where their responsibilities began and ended. Other leads were unclear about what they owed the rest of the team. The CTO and I repeatedly stepped in to make decisions, correct direction, or work through concerns with a frustrated client.',
      'Each intervention addressed the immediate problem. With more teams, the same pattern became unsustainable. We needed to make essential responsibilities clear from the start, while giving teams room to develop their own ways of working.',
    ],
    // Context for the scale of the studio, not evidence of dysfunction: several
    // kinds of work at once. 16:9 rather than the usual 3:2, because a 3:2 frame
    // can't hold both the pair at the laptop and the whiteboard session. Caption
    // with the studio location and approximate date once confirmed.
    media: {
      src: studioFloor,
      alt: 'The bright open studio: people at desks along the windows, two talking over a laptop at a round table, two more at a whiteboard of sticky notes under the mezzanine, and someone coming down the stairs from the upper floor.',
      aspectRatio: '1913 / 1076',
    },
  },

  practice: {
    title: 'Building the Practice Together',
    intro: [
      'We approached our process as a project in its own right. The leadership team worked through it together, with leads taking ownership of their areas and contributing to the whole. I represented design and helped shape the approach across roles, alongside the CTO and our other leads.',
      'We examined what a well-run project required from the first client conversations through discovery, production, launch, and support. At each stage, we made responsibilities explicit: who needed to act, what they needed to understand, and what they needed to share with others.',
      'Ownership extended beyond someone’s individual output. A technology lead needed to explain the tools and constraints the team would be working with. Design needed to involve development in discussions about feasibility. Project managers needed enough understanding of both to coordinate the work and communicate its progress.',
    ],
    // Rendered as a 2-up in the feature stage, so four pages of the process
    // guide (FG-Process-FlowChart-V0-0-1.pdf) fall into two rows: the Project
    // Prep overview and the Product Manager's responsibilities, then the
    // technology lead sharing tools and design's critiques. No photograph of
    // developing the process was found, and an unrelated workshop must not
    // stand in for one. `fullSrc` is twice the size, for reading in the viewer.
    gallery: [
      {
        key: 'guide-page-09',
        src: guidePage09,
        fullSrc: guidePage09Full,
        alt: 'Process guide, Phase II, Project Prep: an introduction to the phase beside its goals — define client stakeholders, define team roles and responsibilities, verify the client’s problem and goals, how success will be measured, the type of engagement and project, and establish communication channels.',
        aspectRatio: '1600 / 1237',
      },
      {
        key: 'guide-page-11',
        src: guidePage11,
        fullSrc: guidePage11Full,
        alt: 'Process guide, Phase II, Product Manager milestones: define client stakeholders’ roles and level of communication, internal roles and responsibilities, communication style and meetings, a recurring stand-up, a weekly client meeting, verify the buyer’s goals against what Sales heard, and what the buyer needs to see and when.',
        aspectRatio: '1600 / 1237',
      },
      {
        key: 'guide-page-12',
        src: guidePage12,
        fullSrc: guidePage12Full,
        alt: 'Process guide, Phase II, Technology Lead milestone: share knowledge of tools and technology with the entire team.',
        aspectRatio: '1600 / 1237',
      },
      {
        key: 'guide-page-23',
        src: guidePage23,
        fullSrc: guidePage23Full,
        alt: 'Process guide, Phase IV, Design Lead milestones: identify the right design artifacts and deliverables, a design critique of creative and visual style, a design critique of development concerns and feasibility, and a client design review.',
        aspectRatio: '1600 / 1237',
      },
    ],
    caption:
      'The guide connected each project stage to responsibilities for individual leads and the wider team.',
    closing: [
      'The resulting guide gave project leads a reference throughout an engagement. It established the responsibilities we expected every team to fulfill, while leaving teams to choose the creative and development approaches appropriate to their project.',
    ],
  },

  means: {
    title: 'Giving People the Means to Lead',
    body: [
      'Clearer ownership helped project managers participate more fully in the work. As leads shared their thinking, PMs gained a better understanding of how the team approached problems and where a project stood. They could explain progress to clients with more context and confidence.',
      'The broader process still needed practical support. Complicated decisions could leave a team stalled in worry or unproductive debate. We developed worksheets and guidance for meetings, workshops, ideation, and critiques so people had a way to move those conversations forward.',
      'Design critiques were one example. Participants had a set amount of time to observe the work and write positive and negative feedback independently before sharing it. The presenting designer came to receive feedback, and solutions were saved for another session. Those rules gave people room to form their own opinions and kept the discussion focused on understanding the responses.',
      'Resources like these were available across the team. They gave people more specific help when a task became difficult, within a practice that still trusted them to exercise judgment.',
    ],
    // Rendered as a stacked gallery in the split's media column: a worksheet,
    // then a session of the same kind. If the worksheet is the stakeholder one,
    // keep its LUMA Institute attribution; neither alternative is a critique
    // worksheet and must not be labelled as one. If the two come from separate
    // sessions, the final caption says so.
    gallery: [
      {
        key: 'worksheet',
        placeholder:
          'Worksheet — the design critique worksheet if recovered, otherwise the stakeholder or pre-meeting worksheet',
        aspectRatio: '4 / 3',
      },
      {
        key: 'session',
        src: workshop,
        alt: 'A working session in a glass-walled meeting room: one person points to notes stuck across the glass while others listen from stools and chairs around a long wooden table.',
        aspectRatio: '3 / 2',
      },
    ],
    caption:
      'Supporting worksheets gave teams practical guidance for discovery, discussion, and feedback.',
  },

  possible: {
    title: 'What the Practice Made Possible',
    intro: [
      'The most immediate change was in project management. PMs had clearer responsibilities and the tools and context to manage complicated work. Other team members felt heard and better understood what was expected of them. The important duties of a project were assigned from the beginning.',
      'As teams became more stable, we saw them maintain the quality and care we valued with greater independence. Knowledge, responsibility, and enthusiasm could be shared across the team. More of the work could move forward without waiting for the CTO or me to intervene.',
      'That gave me room to design again. I could contribute directly to selected projects while continuing to support the wider studio. Helping build that practice with our leadership team remains one of the achievements I value most, because it gave other people more opportunity to take ownership and do work they were proud of.',
    ],
    // Rendered by MediaRail: the people and the work the practice supported —
    // a team reviewing work in progress, apps the studio shipped, then the
    // studio as a place people came to: a talk, an art show, a party. All 3:2.
    // No project or event here is presented as a result of the process.
    rail: [
      {
        key: 'dashboard-review',
        src: dashboardReview,
        alt: 'A designer points to a distillery projections dashboard on a wall-mounted screen while teammates follow along from the table, beside a wall of hand-drawn sticky-note portraits.',
        aspectRatio: '3 / 2',
      },
      {
        key: 'shipped-apps',
        src: shippedApps,
        alt: 'Apps the studio made, laid out on iPads and iPhones across a dark table: a Big Ass Fans control panel, the MudBuddy reading app, a NewHope O‘ahu donation kiosk, a Michelin rider-review site, PollCat, and a mobile game.',
        aspectRatio: '3 / 2',
      },
      {
        key: 'talk-night',
        src: talkNight,
        alt: 'An evening talk in the studio: a crowd at the long tables and sofas, drinks in hand, turns toward a speaker with a microphone standing beside the sasquatch costume.',
        aspectRatio: '3 / 2',
      },
      {
        key: 'gridlock-2019',
        src: gridlock2019,
        alt: 'The studio packed for the Gridlock art show in 2019: a crowd under coloured party lights, with a wall of small square paintings at the far end.',
        aspectRatio: '3 / 2',
      },
      {
        key: 'warmitupfg',
        src: warmItUp,
        alt: 'A #WARMITUPFG party in the darkened studio, the Forest Giant figure and FG monogram lit in the mezzanine window above the crowd.',
        aspectRatio: '3 / 2',
      },
    ],
    caption:
      'Work in progress, apps the studio shipped, and the studio as a place people came to: a talk night, the Gridlock art show in 2019, and #WARMITUPFG.',
  },

  conclusion: {
    outcomes: [
      {
        value: 'Clearer Ownership',
        detail: 'Essential project responsibilities assigned from the beginning',
      },
      {
        value: 'Better-Equipped PMs',
        detail:
          'Shared technical and creative context to coordinate work and communicate progress',
      },
      {
        value: 'Greater Team Independence',
        detail: 'Teams carrying work forward with less reliance on intervention from the CTO and me',
      },
    ],
    lessonsTitle: 'What I Learned to Carry',
    lessons: [
      'I entered this work because I loved interactive design. Over more than fifteen years, I learned to lead, mediate, make difficult decisions, and carry responsibility for the people doing the work. My decisions affected their opportunities, their experience of a project, and our ability to deliver together.',
      'I also learned how much I valued seeing other people thrive. Giving someone the clarity and support to take ownership became as meaningful to me as making something myself. Collaboration remained central to both.',
      'Looking back, I would have made leadership’s responsibilities more explicit within the practice. I would have established regular conversations with each lead to understand how the process was working for them, where adoption was difficult, and what needed to change. That accountability belonged to us, myself included.',
      'Forest Giant expanded what I understood creative leadership to involve. I still wanted to design ambitious experiences. I also wanted to protect the creative spirit of the team and help people bring their own judgment, energy, and care to the work.',
    ],
  },
};

export default forestGiantContent;
