import { useMemo, useState } from 'react'
import { RECIPE_BOX_URL } from '../lib/recipeBox'
import type { Recipe } from '../lib/types'

type Props = {
  recipes: Recipe[]
  loading: boolean
  onOpenRecipe: (recipe: Recipe) => void
}

// A read-only window onto Dad's Recipe Box. New recipes are written up over
// there and appear here the moment they are saved, so there is only ever one
// copy of a recipe in the family.
export default function RecipeBrowser({ recipes, loading, onOpenRecipe }: Props) {
  const [query, setQuery] = useState('')

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return recipes
    return recipes.filter(
      (recipe) =>
        recipe.name.toLowerCase().includes(needle) ||
        recipe.cuisine.toLowerCase().includes(needle) ||
        recipe.tags.some((tag) => tag.toLowerCase().includes(needle)) ||
        recipe.ingredients.some((row) => row.name.toLowerCase().includes(needle)),
    )
  }, [query, recipes])

  return (
    <section className="board">
      <input
        className="search"
        value={query}
        placeholder="Search recipes and ingredients"
        onChange={(event) => setQuery(event.target.value)}
      />

      {loading && <p className="muted">Loading the Recipe Box...</p>}

      {!loading && shown.length === 0 && (
        <p className="muted">
          No recipes match. New ones are added in the{' '}
          <a href={RECIPE_BOX_URL} target="_blank" rel="noreferrer">
            Recipe Box
          </a>
          .
        </p>
      )}

      <div className="cards">
        {shown.map((recipe) => (
          <button key={recipe.id} className="card" onClick={() => onOpenRecipe(recipe)}>
            {recipe.photo ? (
              <img src={recipe.photo} alt="" loading="lazy" />
            ) : (
              <span className="card-photo placeholder" aria-hidden="true">
                🍽
              </span>
            )}
            <span className="card-body">
              <b>{recipe.name}</b>
              <span className="muted small">
                {[recipe.cuisine, recipe.serves > 0 ? `serves ${recipe.serves}` : '']
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </span>
          </button>
        ))}
      </div>

      <p className="muted small footer-note">
        Recipes live in Dad&rsquo;s{' '}
        <a href={RECIPE_BOX_URL} target="_blank" rel="noreferrer">
          Recipe Box
        </a>
        . Add one there and it shows up here straight away.
      </p>
    </section>
  )
}
