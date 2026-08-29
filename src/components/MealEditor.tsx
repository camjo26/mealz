import { useMemo, useState } from 'react'
import { DAY_NAMES, type DayKey } from '../lib/dates'
import { emptyMeal, type Meal, type Recipe } from '../lib/types'

const MAX_SUGGESTIONS = 8

type Props = {
  weekIndex: number
  day: DayKey
  meal: Meal | undefined
  recipes: Recipe[]
  busy: boolean
  onSave: (meal: Meal) => void
  onClear: () => void
  onClose: () => void
}

// Picking a meal for one day. A meal can be a recipe from Dad's Recipe Box, or
// just a name typed in for something nobody has written up yet.
export default function MealEditor({
  weekIndex,
  day,
  meal,
  recipes,
  busy,
  onSave,
  onClear,
  onClose,
}: Props) {
  const [title, setTitle]       = useState(meal?.title ?? '')
  const [recipeId, setRecipeId] = useState(meal?.recipeId ?? null)
  const [serves, setServes]     = useState(meal?.serves ? String(meal.serves) : '')
  const [note, setNote]         = useState(meal?.note ?? '')

  const suggestions = useMemo(() => {
    const query = title.trim().toLowerCase()
    const pool  = query
      ? recipes.filter((recipe) => recipe.name.toLowerCase().includes(query))
      : recipes
    return pool.slice(0, MAX_SUGGESTIONS)
  }, [title, recipes])

  function choose(recipe: Recipe) {
    setRecipeId(recipe.id)
    setTitle(recipe.name)
    if (!serves && recipe.serves) setServes(String(recipe.serves))
  }

  function handleSave() {
    const trimmed = title.trim()
    if (!trimmed) return
    onSave({
      ...emptyMeal(trimmed),
      recipeId,
      serves: serves ? Number(serves) : null,
      note: note.trim(),
    })
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(event) => event.stopPropagation()}>
        <header className="sheet-head">
          <h2>
            {DAY_NAMES[day]} <span className="muted">· week {weekIndex + 1}</span>
          </h2>
          <button className="icon" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        <label className="field">
          <span>What are we having?</span>
          <input
            value={title}
            autoFocus
            placeholder="Search the Recipe Box, or just type it"
            onChange={(event) => {
              setTitle(event.target.value)
              setRecipeId(null)
            }}
          />
        </label>

        {recipeId ? (
          <p className="linked">
            ✓ Linked to the Recipe Box, so its ingredients join the shopping list.
            <button className="link" onClick={() => setRecipeId(null)}>
              Unlink
            </button>
          </p>
        ) : (
          <div className="suggestions">
            {suggestions.length === 0 && <p className="muted small">No matching recipes.</p>}
            {suggestions.map((recipe) => (
              <button key={recipe.id} className="suggestion" onClick={() => choose(recipe)}>
                {recipe.photo ? (
                  <img src={recipe.photo} alt="" loading="lazy" />
                ) : (
                  <span className="suggestion-photo" aria-hidden="true">
                    🍽
                  </span>
                )}
                <span>
                  <b>{recipe.name}</b>
                  {recipe.serves > 0 && <span className="muted small"> serves {recipe.serves}</span>}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="field-row">
          <label className="field">
            <span>Serves</span>
            <input
              type="number"
              min={1}
              value={serves}
              placeholder="as written"
              onChange={(event) => setServes(event.target.value)}
            />
          </label>
          <label className="field grow">
            <span>Note</span>
            <input
              value={note}
              placeholder="e.g. Cam cooking"
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
        </div>

        <div className="sheet-actions">
          {meal?.title && (
            <button className="danger" onClick={onClear} disabled={busy}>
              Remove
            </button>
          )}
          <button className="primary" onClick={handleSave} disabled={busy || !title.trim()}>
            {busy ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
