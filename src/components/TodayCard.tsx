import {
  DAY_KEYS,
  DAY_NAMES,
  dateForSlot,
  dayIndexOf,
  formatShortDate,
  weekIndexFor,
  type DayKey,
} from '../lib/dates'
import { slotKey, type Plan, type Recipe } from '../lib/types'

type Props = {
  plan: Plan
  recipes: Recipe[]
  canEdit: boolean
  onOpenRecipe: (recipe: Recipe, serves: number | null) => void
  onEditToday: (weekIndex: number, day: DayKey) => void
}

// The headline answer to the only question anyone actually opens this app for.
// It reads today's real date, works out which of the two rota weeks that falls
// in, and shows that one meal, so nobody has to hunt down the grid for it.
export default function TodayCard({ plan, recipes, canEdit, onOpenRecipe, onEditToday }: Props) {
  const today       = new Date()
  const weekIndex   = weekIndexFor(today, plan.anchorMonday)
  const dayIndex    = dayIndexOf(today)
  const day         = DAY_KEYS[dayIndex] as DayKey
  const meal        = plan.slots[slotKey(weekIndex, day)]
  const recipe      = meal?.recipeId ? recipes.find((r) => r.id === meal.recipeId) : undefined
  const dateLabel   = formatShortDate(dateForSlot(weekIndex, dayIndex, plan.anchorMonday))

  return (
    <section className="today-card">
      <h2 className="today-question">
        What <span className="today-word">mealz</span> are we cooking today?
      </h2>

      <p className="today-when">
        {DAY_NAMES[day]} {dateLabel} <span className="today-week">week {weekIndex + 1}</span>
      </p>

      {meal?.title ? (
        <button
          className="today-meal"
          onClick={() => (recipe ? onOpenRecipe(recipe, meal.serves) : onEditToday(weekIndex, day))}
          disabled={!recipe && !canEdit}
        >
          {recipe?.photo ? (
            <img className="today-photo" src={recipe.photo} alt="" />
          ) : (
            <span className="today-photo placeholder" aria-hidden="true">
              🍽
            </span>
          )}
          <span className="today-text">
            <span className="today-title">{meal.title}</span>
            <span className="today-sub">
              {recipe ? 'Tap for the recipe' : 'No recipe linked yet'}
              {meal.note ? ` · ${meal.note}` : ''}
            </span>
          </span>
        </button>
      ) : canEdit ? (
        <button className="today-meal empty" onClick={() => onEditToday(weekIndex, day)}>
          Nothing planned for today. Tap to pick something.
        </button>
      ) : (
        <p className="today-meal empty static">Nothing planned for today yet.</p>
      )}
    </section>
  )
}
