export const VERSION = 'v0.01'

export type ChangelogEntry = { version: string; date: string; notes: string[] }

// Newest first. Bump VERSION and prepend an entry on EVERY publish, so the live
// build always shows exactly what shipped. Dates are YYYY-MM-DD.
export const CHANGELOG: ChangelogEntry[] = [
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
