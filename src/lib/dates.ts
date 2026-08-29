// Date helpers for the two-week rota. Everything works in local time on whole
// days only, so there is no timezone drift between family devices.

export const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

export type DayKey = (typeof DAY_KEYS)[number]

export const DAY_NAMES: Record<DayKey, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
}

export const WEEK_COUNT   = 2
export const DAYS_IN_WEEK = 7
const MS_PER_DAY          = 24 * 60 * 60 * 1000

// Monday is 0 in our grid, Sunday is 6. JS getDay() has Sunday as 0, hence +6 %7.
export function dayIndexOf(date: Date): number {
  return (date.getDay() + 6) % DAYS_IN_WEEK
}

export function mondayOf(date: Date): Date {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  monday.setDate(monday.getDate() - dayIndexOf(date))
  return monday
}

export function toISODate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day   = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function fromISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

// Which of the two weeks the given date falls in, counting from the anchor
// Monday. Works for dates before the anchor too, hence the double modulo.
export function weekIndexFor(date: Date, anchorMonday: string): number {
  const weeksApart = Math.round(
    (mondayOf(date).getTime() - fromISODate(anchorMonday).getTime()) / (MS_PER_DAY * DAYS_IN_WEEK),
  )
  return ((weeksApart % WEEK_COUNT) + WEEK_COUNT) % WEEK_COUNT
}

// The real calendar date a grid cell refers to, for the week showing right now.
export function dateForSlot(weekIndex: number, dayIndex: number, anchorMonday: string): Date {
  const today       = new Date()
  const thisMonday  = mondayOf(today)
  const currentWeek = weekIndexFor(today, anchorMonday)
  const weekOffset  = ((weekIndex - currentWeek) % WEEK_COUNT + WEEK_COUNT) % WEEK_COUNT
  const result      = new Date(thisMonday)
  result.setDate(result.getDate() + weekOffset * DAYS_IN_WEEK + dayIndex)
  return result
}

export function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function isSameDay(a: Date, b: Date): boolean {
  return toISODate(a) === toISODate(b)
}
