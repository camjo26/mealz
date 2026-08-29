import {
  DAY_KEYS,
  DAY_NAMES,
  WEEK_COUNT,
  dateForSlot,
  formatShortDate,
  isSameDay,
  weekIndexFor,
  type DayKey,
} from '../lib/dates'
import { slotKey, type Meal, type Plan, type Recipe } from '../lib/types'

type Props = {
  plan: Plan
  recipes: Recipe[]
  weekIndex: number
  canEdit: boolean
  onChangeWeek: (weekIndex: number) => void
  onEditSlot: (weekIndex: number, day: DayKey) => void
  onOpenRecipe: (recipe: Recipe, serves: number | null) => void
}

export default function PlanBoard({
  plan,
  recipes,
  weekIndex,
  canEdit,
  onChangeWeek,
  onEditSlot,
  onOpenRecipe,
}: Props) {
  const today       = new Date()
  const currentWeek = weekIndexFor(today, plan.anchorMonday)

  return (
    <section className="board">
      <div className="week-tabs" role="tablist" aria-label="Which week">
        {Array.from({ length: WEEK_COUNT }, (_, index) => (
          <button
            key={index}
            role="tab"
            aria-selected={index === weekIndex}
            className={index === weekIndex ? 'week-tab active' : 'week-tab'}
            onClick={() => onChangeWeek(index)}
          >
            Week {index + 1}
            {index === currentWeek && <span className="pill">now</span>}
          </button>
        ))}
      </div>

      <ol className="days">
        {DAY_KEYS.map((day, dayIndex) => {
          const meal    = plan.slots[slotKey(weekIndex, day)]
          const date    = dateForSlot(weekIndex, dayIndex, plan.anchorMonday)
          const isToday = isSameDay(date, today)
          const recipe  = meal?.recipeId ? recipes.find((r) => r.id === meal.recipeId) : undefined

          return (
            <li key={day} className={isToday ? 'day today' : 'day'}>
              <div className="day-head">
                <span className="day-name">{DAY_NAMES[day]}</span>
                <span className="day-date">
                  {formatShortDate(date)}
                  {isToday && <span className="pill">today</span>}
                </span>
              </div>

              <MealRow
                meal={meal}
                recipe={recipe}
                canEdit={canEdit}
                onOpenRecipe={onOpenRecipe}
                onEdit={() => onEditSlot(weekIndex, day)}
              />
            </li>
          )
        })}
      </ol>
    </section>
  )
}

type MealRowProps = {
  meal: Meal | undefined
  recipe: Recipe | undefined
  canEdit: boolean
  onOpenRecipe: (recipe: Recipe, serves: number | null) => void
  onEdit: () => void
}

function MealRow({ meal, recipe, canEdit, onOpenRecipe, onEdit }: MealRowProps) {
  if (!meal || !meal.title) {
    return canEdit ? (
      <button className="meal empty" onClick={onEdit}>
        + Add a meal
      </button>
    ) : (
      <p className="meal empty static">Nothing planned yet</p>
    )
  }

  return (
    <div className="meal">
      <button
        className="meal-main"
        onClick={() => (recipe ? onOpenRecipe(recipe, meal.serves) : onEdit())}
        disabled={!recipe && !canEdit}
      >
        {recipe?.photo ? (
          <img className="meal-photo" src={recipe.photo} alt="" loading="lazy" />
        ) : (
          <span className="meal-photo placeholder" aria-hidden="true">
            🍽
          </span>
        )}
        <span className="meal-text">
          <span className="meal-title">{meal.title}</span>
          <span className="meal-sub">
            {recipe
              ? `Recipe Box${meal.serves ? ` · serves ${meal.serves}` : ''}`
              : 'No recipe linked yet'}
            {meal.note ? ` · ${meal.note}` : ''}
          </span>
        </span>
      </button>

      {canEdit && (
        <button className="meal-edit" onClick={onEdit} aria-label="Change this meal">
          ✎
        </button>
      )}
    </div>
  )
}
