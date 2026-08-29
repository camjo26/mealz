import type { DayKey } from './dates'

// The recipe shape stored by Dad's Recipe Box. We read it but never write it,
// so extra fields it may gain later are simply ignored here.
export type Ingredient = {
  qty: string
  unit: string
  name: string
  section: string
}

export type Recipe = {
  id: string
  name: string
  serves: number
  prep: string
  cook: string
  cuisine: string
  photo: string | null
  ingredients: Ingredient[]
  steps: string[]
  tags: string[]
  sourceUrl: string
  sourceName: string
  author: string
}

// One cell of the fortnight grid. A meal either points at a Recipe Box recipe
// (recipeId set) or is just a written title, for the meals nobody has typed up.
export type Meal = {
  recipeId: string | null
  title: string
  serves: number | null
  note: string
}

export type SlotKey = `w${number}-${DayKey}`

export type Plan = {
  anchorMonday: string
  slots: Record<string, Meal>
  updatedBy: string
}

export type ShoppingState = {
  have: Record<string, boolean>
  extras: { id: string; name: string; done: boolean }[]
}

export function slotKey(weekIndex: number, day: DayKey): string {
  return `w${weekIndex + 1}-${day}`
}

export function emptyMeal(title = ''): Meal {
  return { recipeId: null, title, serves: null, note: '' }
}
