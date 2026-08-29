export const VERSION = 'v0.03'

export type ChangelogEntry = { version: string; date: string; notes: string[] }

// Newest first. Bump VERSION and prepend an entry on EVERY publish, so the live
// build always shows exactly what shipped. Dates are YYYY-MM-DD.
export const CHANGELOG: ChangelogEntry[] = [
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
