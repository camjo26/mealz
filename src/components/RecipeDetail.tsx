import { useMemo, useState } from 'react'
import { recipeBoxUrl } from '../lib/recipeBox'
import { ingredientKey, scaleQuantity } from '../lib/shopping'
import type { Ingredient, Recipe } from '../lib/types'

type Tab = 'ingredients' | 'method'

type Props = {
  recipe: Recipe
  serves: number | null
  have: Record<string, boolean>
  onToggleHave: (key: string, have: boolean) => void
  onClose: () => void
}

// The two pages of a recipe: what to buy, then what to do. Ticking an
// ingredient here is the same tick as on the shopping list, so walking the
// cupboard before a shop takes things off the list as you go.
export default function RecipeDetail({ recipe, serves, have, onToggleHave, onClose }: Props) {
  const [tab, setTab]   = useState<Tab>('ingredients')
  const [done, setDone] = useState<Set<number>>(new Set())

  const factor = serves && recipe.serves > 0 ? serves / recipe.serves : 1
  const shown  = serves || recipe.serves

  const sections = useMemo(() => groupBySection(recipe.ingredients), [recipe.ingredients])

  function toggleStep(index: number) {
    setDone((previous) => {
      const next = new Set(previous)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  return (
    <div className="overlay" onClick={onClose}>
      <article className="sheet tall" onClick={(event) => event.stopPropagation()}>
        <header className="sheet-head">
          <h2>{recipe.name}</h2>
          <button className="icon" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        {recipe.photo && <img className="detail-photo" src={recipe.photo} alt="" />}

        <p className="muted small meta">
          {shown > 0 && <span>Serves {shown}</span>}
          {recipe.prep && <span>Prep {recipe.prep}</span>}
          {recipe.cook && <span>Cook {recipe.cook}</span>}
          {recipe.cuisine && <span>{recipe.cuisine}</span>}
        </p>

        <a
          className="cook-link"
          href={recipeBoxUrl(recipe.id, shown || null)}
          target="_blank"
          rel="noreferrer"
        >
          ⏲ Cook this in the Recipe Box
          <span className="cook-link-sub">
            Opens scaled for {shown || recipe.serves}, with the timers
          </span>
        </a>

        <div className="tabs" role="tablist">
          <button
            role="tab"
            aria-selected={tab === 'ingredients'}
            className={tab === 'ingredients' ? 'tab active' : 'tab'}
            onClick={() => setTab('ingredients')}
          >
            Ingredients
          </button>
          <button
            role="tab"
            aria-selected={tab === 'method'}
            className={tab === 'method' ? 'tab active' : 'tab'}
            onClick={() => setTab('method')}
          >
            Method
          </button>
        </div>

        {tab === 'ingredients' ? (
          <div className="ingredients">
            {factor !== 1 && (
              <p className="muted small">
                Scaled from {recipe.serves} to {shown} servings.
              </p>
            )}
            {sections.map(([section, rows]) => (
              <div key={section || 'main'}>
                {section && <h3 className="section">{section}</h3>}
                <ul className="ticks">
                  {rows.map((row, index) => {
                    const key    = ingredientKey(row.name)
                    const ticked = Boolean(have[key])
                    return (
                      <li key={section + index}>
                        <label className={ticked ? 'tick ticked' : 'tick'}>
                          <input
                            type="checkbox"
                            checked={ticked}
                            onChange={(event) => onToggleHave(key, event.target.checked)}
                          />
                          <span>
                            <b>{[scaleQuantity(row.qty, factor), row.unit].filter(Boolean).join(' ')}</b>{' '}
                            {row.name}
                          </span>
                        </label>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <ol className="steps">
            {recipe.steps.map((step, index) => (
              <li key={index} className={done.has(index) ? 'step done' : 'step'}>
                <button onClick={() => toggleStep(index)}>
                  <span className="step-number">{index + 1}</span>
                  <span>{step}</span>
                </button>
              </li>
            ))}
            {recipe.steps.length === 0 && <p className="muted">No method written up yet.</p>}
          </ol>
        )}

        {recipe.sourceUrl && (
          <p className="muted small">
            From{' '}
            <a href={recipe.sourceUrl} target="_blank" rel="noreferrer">
              {recipe.sourceName || 'the original recipe'}
            </a>
          </p>
        )}
      </article>
    </div>
  )
}

function groupBySection(ingredients: Ingredient[]): [string, Ingredient[]][] {
  const groups = new Map<string, Ingredient[]>()
  for (const row of ingredients) {
    const section = row.section || ''
    if (!groups.has(section)) groups.set(section, [])
    groups.get(section)!.push(row)
  }
  return [...groups.entries()]
}
