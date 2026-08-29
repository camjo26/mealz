import { mondayOf, toISODate, type DayKey } from './dates'
import { findMatchingRecipe } from './recipes'
import { emptyMeal, slotKey, type Plan, type Recipe } from './types'

// Cam's original handwritten fortnight, typed up. Thursday and the weekend are
// deliberately blank: his brothers fill those in. Titles are matched against
// Dad's Recipe Box when the plan is seeded, so anything already written up gets
// linked automatically and the rest stays as plain text until someone adds it.
const STARTER_MEALS: [number, DayKey, string][] = [
  [0, 'mon', 'Chilli con carne'],
  [0, 'tue', 'Salmon pasta'],
  [0, 'wed', 'Shredded hoisin chicken wraps'],
  [0, 'fri', 'Egg fried rice'],
  [1, 'mon', 'Carbonara'],
  [1, 'tue', 'Scrambled eggs'],
  [1, 'wed', 'Spanish omelette'],
  [1, 'fri', 'Lasagne'],
]

export function buildStarterPlan(recipes: Recipe[]): Plan {
  const slots: Plan['slots'] = {}
  for (const [weekIndex, day, title] of STARTER_MEALS) {
    const match = findMatchingRecipe(title, recipes)
    slots[slotKey(weekIndex, day)] = {
      ...emptyMeal(match ? match.name : title),
      recipeId: match ? match.id : null,
    }
  }
  return {
    anchorMonday: toISODate(mondayOf(new Date())),
    slots,
    updatedBy: '',
  }
}
