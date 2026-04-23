// Authored editorial notes for class pages, transcribed from the previous
// React tree (legacy-next/src/lib/class-notes.tsx) into a framework-neutral
// structured form. A future Angular component will render these as <p>+<strong>
// runs with router links for cross-class references.

export type NoteSegment =
  | { kind: 'text'; text: string }
  | { kind: 'strong'; text: string }
  | { kind: 'link'; classSlug: string; label: string };

export type NoteParagraph = {
  segments: NoteSegment[];
  // 'muted-small' = the "see also" footnotes (originally
  // <p class="u-text-muted"><small>...</small></p>).
  variant?: 'muted-small';
};

export const CLASS_NOTES: Record<string, NoteParagraph[]> = {
  superbike: [
    {
      segments: [
        { kind: 'strong', text: 'Starting 2026, the Superbike Cup runs within the Superbike class.' },
        { kind: 'text', text: ' The former Stock 1000 class was rebranded as the ' },
        { kind: 'link', classSlug: 'superbike-cup', label: 'MotoAmerica Superbike Cup' },
        {
          kind: 'text',
          text:
            ' and is now folded into the premier grid. Cup riders compete in the same 20 races across all nine venues and earn points for both championships — a Cup rider can appear on both the Superbike and Superbike Cup podiums.',
        },
      ],
    },
    {
      variant: 'muted-small',
      segments: [
        {
          kind: 'text',
          text:
            'The Superbike rules package is locked through the 2027 season. See also the historical ',
        },
        { kind: 'link', classSlug: 'stock-1000', label: 'Stock 1000 standings' },
        { kind: 'text', text: '.' },
      ],
    },
  ],
  'stock-1000': [
    {
      segments: [
        { kind: 'strong', text: '2025 was the final standalone Stock 1000 season.' },
        { kind: 'text', text: ' Beginning in 2026, the class was rebranded as the ' },
        { kind: 'link', classSlug: 'superbike-cup', label: 'MotoAmerica Superbike Cup' },
        { kind: 'text', text: ' and is now run within the ' },
        { kind: 'link', classSlug: 'superbike', label: 'Superbike' },
        {
          kind: 'text',
          text:
            ' class — Cup riders race alongside the Superbike grid and earn points for both championships.',
        },
      ],
    },
  ],
  'superbike-cup': [
    {
      segments: [
        {
          kind: 'strong',
          text: 'The Superbike Cup is the rebranded Stock 1000 class, new for 2026.',
        },
        { kind: 'text', text: ' Cup riders compete within the ' },
        { kind: 'link', classSlug: 'superbike', label: 'Superbike' },
        {
          kind: 'text',
          text:
            ' grid at all 20 races across nine venues and earn points for both championships. A Cup rider can finish on both the Superbike and Superbike Cup podiums in the same race.',
        },
      ],
    },
    {
      variant: 'muted-small',
      segments: [
        { kind: 'text', text: 'See also the historical ' },
        { kind: 'link', classSlug: 'stock-1000', label: 'Stock 1000 standings' },
        { kind: 'text', text: '.' },
      ],
    },
  ],
  'parts-unlimited-talent-cup': [
    {
      segments: [
        {
          kind: 'strong',
          text: 'Parts Unlimited Talent Cup is a standalone championship',
        },
        {
          kind: 'text',
          text:
            ' — its own points table, not scored inside any other class. Two races per round on identical Krämer APX-350 MA spec bikes. Records under this name reflect the era when Parts Unlimited held the title sponsorship.',
        },
      ],
    },
    {
      variant: 'muted-small',
      segments: [
        { kind: 'text', text: 'See also the current ' },
        { kind: 'link', classSlug: 'talent-cup', label: 'Talent Cup' },
        { kind: 'text', text: ' standings.' },
      ],
    },
  ],
  'mission-super-hooligan': [
    {
      segments: [
        {
          kind: 'strong',
          text: 'Mission Super Hooligan is a standalone championship',
        },
        {
          kind: 'text',
          text:
            ' with its own points table — not a sub-championship of any other class. Two races per round, season points decided over the calendar like the rule-driven classes.',
        },
      ],
    },
  ],
  'mission-king-of-the-baggers': [
    {
      segments: [
        {
          kind: 'strong',
          text: 'Mission King Of The Baggers is a standalone championship',
        },
        {
          kind: 'text',
          text: ' with its own points table. Two races per round count toward the title.',
        },
      ],
    },
    {
      variant: 'muted-small',
      segments: [
        {
          kind: 'text',
          text:
            'Some weekends also feature short, non-points sprint races (≈2 laps) with a $5,000 winner’s purse on top of the championship rounds — fan flair, not a title factor.',
        },
      ],
    },
  ],
};
