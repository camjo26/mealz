export const VERSION = 'v0.10'

export type ChangelogEntry = { version: string; date: string; notes: string[] }

// Newest first. Bump VERSION and prepend an entry on EVERY publish, so the live
// build always shows exactly what shipped. Dates are YYYY-MM-DD.
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: 'v0.10',
    date: '2026-08-31',
    notes: [
      'The edit pencil is orange now, so it no longer reads as greyed out',
      'beside the green Recipe Box button.',
    ],
  },
  {
    version: 'v0.09',
    date: '2026-08-30',
    notes: [
      'The Recipe Box buttons now use the real place-setting artwork.',
    ],
  },
  {
    version: 'v0.08',
    date: '2026-08-30',
    notes: [
      'The Recipe Box buttons now carry its own fork-plate-knife mark, in its',
      'green, instead of a timer glyph.',
    ],
  },
  {
    version: 'v0.07',
    date: '2026-08-30',
    notes: [
      'Cook in the Recipe Box in one tap, from today, the plan or a recipe.',
      'It opens on the right recipe, already scaled to that day’s servings.',
    ],
  },
  {
    version: 'v0.06',
    date: '2026-08-29',
    notes: [
      'The word "mealz" is picked out in black on the Today card.',
      'Week 1’s start date is now set directly, instead of nudged a week at a time.',
    ],
  },
  {
    version: 'v0.05',
    date: '2026-08-29',
    notes: [
      'Today is its own tab now, and the one the app opens on.',
      'The week the rota is on can be corrected from there.',
    ],
  },
  {
    version: 'v0.04',
    date: '2026-08-29',
    notes: [
      '"What mealz are we cooking today?" now answers itself at the top of the plan.',
      'The sign-out button is now your initials, with sign out behind a tap.',
    ],
  },
  {
    version: 'v0.03',
    date: '2026-08-29',
    notes: [
      'Stopped the whole app shifting sideways when a tab is short enough',
      'not to need a scrollbar.',
    ],
  },
  {
    version: 'v0.02',
    date: '2026-08-29',
    notes: [
      'Fixed a byte-order mark corrupting every Firebase setting on Vercel,',
      'which left the live app stuck on "Loading the Recipe Box...".',
    ],
  },
  {
    version: 'v0.01',
    date: '2026-08-29',
    notes: [
      'Fortnightly Mon-Sun meal plan, shared across the family.',
      'Recipes read live from Dad\u2019s Recipe Box.',
      'Shopping list built from the plan, grouped by aisle.',
    ],
  },
]
