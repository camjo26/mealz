import { useMemo, useState } from 'react'
import { DAY_KEYS, WEEK_COUNT } from '../lib/dates'
import { buildShoppingList, groupByAisle, shoppingListAsText } from '../lib/shopping'
import { slotKey, type Plan, type Recipe, type ShoppingState } from '../lib/types'

// Scope of the list: one week's meals, or the whole fortnight in one go.
const SCOPES = [
  { id: 'week1', label: 'Week 1', weeks: [0] },
  { id: 'week2', label: 'Week 2', weeks: [1] },
  { id: 'both', label: 'Both weeks', weeks: [0, 1] },
] as const

type ScopeId = (typeof SCOPES)[number]['id']

type Props = {
  plan: Plan
  recipes: Recipe[]
  shopping: ShoppingState
  onToggleHave: (key: string, have: boolean) => void
  onClearTicks: () => void
  onSaveExtras: (extras: ShoppingState['extras']) => void
}

export default function ShoppingBoard({
  plan,
  recipes,
  shopping,
  onToggleHave,
  onClearTicks,
  onSaveExtras,
}: Props) {
  const [scopeId, setScopeId] = useState<ScopeId>('both')
  const [newItem, setNewItem] = useState('')
  const [copied, setCopied]   = useState(false)

  const scope = SCOPES.find((entry) => entry.id === scopeId) ?? SCOPES[2]

  // Only meals linked to a Recipe Box recipe can contribute ingredients; the
  // rest are listed separately so it is obvious why they are not on the list.
  const { items, unlinked } = useMemo(() => {
    const planned: { recipe: Recipe; title: string; serves: number | null }[] = []
    const missing: string[] = []

    for (const weekIndex of scope.weeks) {
      if (weekIndex >= WEEK_COUNT) continue
      for (const day of DAY_KEYS) {
        const meal = plan.slots[slotKey(weekIndex, day)]
        if (!meal?.title) continue
        const recipe = meal.recipeId ? recipes.find((r) => r.id === meal.recipeId) : undefined
        if (recipe) planned.push({ recipe, title: meal.title, serves: meal.serves })
        else if (!missing.includes(meal.title)) missing.push(meal.title)
      }
    }
    return { items: buildShoppingList(planned), unlinked: missing }
  }, [plan, recipes, scope])

  const groups    = useMemo(() => groupByAisle(items), [items])
  const toBuy     = items.filter((item) => !shopping.have[item.key])
  const extras    = shopping.extras
  const remaining = toBuy.length + extras.filter((entry) => !entry.done).length

  async function copyList() {
    const outstanding = groupByAisle(items.filter((item) => !shopping.have[item.key]))
    const extraLines  = extras.filter((e) => !e.done).map((e) => `- ${e.name}`)
    const text = [
      shoppingListAsText(outstanding),
      extraLines.length ? `Also\n${extraLines.join('\n')}` : '',
    ]
      .filter(Boolean)
      .join('\n\n')

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  function addExtra() {
    const name = newItem.trim()
    if (!name) return
    onSaveExtras([...extras, { id: String(Date.now()), name, done: false }])
    setNewItem('')
  }

  return (
    <section className="board">
      <div className="week-tabs" role="tablist" aria-label="Which week to shop for">
        {SCOPES.map((entry) => (
          <button
            key={entry.id}
            role="tab"
            aria-selected={entry.id === scopeId}
            className={entry.id === scopeId ? 'week-tab active' : 'week-tab'}
            onClick={() => setScopeId(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="list-head">
        <p className="muted small">
          {remaining === 0 ? 'Nothing left to buy.' : `${remaining} still to buy`}
        </p>
        <div className="list-actions">
          <button onClick={copyList} disabled={items.length === 0 && extras.length === 0}>
            {copied ? 'Copied' : 'Copy list'}
          </button>
          <button onClick={onClearTicks}>Untick all</button>
        </div>
      </div>

      {items.length === 0 && (
        <p className="muted">
          Nothing to buy yet. Link some meals to Recipe Box recipes and their ingredients
          will gather here.
        </p>
      )}

      {groups.map(([aisle, aisleItems]) => (
        <div key={aisle} className="aisle">
          <h3 className="section">{aisle}</h3>
          <ul className="ticks">
            {aisleItems.map((item) => {
              const ticked = Boolean(shopping.have[item.key])
              return (
                <li key={item.key}>
                  <label className={ticked ? 'tick ticked' : 'tick'}>
                    <input
                      type="checkbox"
                      checked={ticked}
                      onChange={(event) => onToggleHave(item.key, event.target.checked)}
                    />
                    <span>
                      <b>{item.name}</b>
                      {item.amounts.length > 0 && (
                        <span className="muted small"> {item.amounts.join(' + ')}</span>
                      )}
                      <span className="used-in">{item.usedIn.join(', ')}</span>
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        </div>
      ))}

      <div className="aisle">
        <h3 className="section">Anything else</h3>
        <ul className="ticks">
          {extras.map((entry) => (
            <li key={entry.id}>
              <label className={entry.done ? 'tick ticked' : 'tick'}>
                <input
                  type="checkbox"
                  checked={entry.done}
                  onChange={(event) =>
                    onSaveExtras(
                      extras.map((other) =>
                        other.id === entry.id
                          ? { ...other, done: event.target.checked }
                          : other,
                      ),
                    )
                  }
                />
                <span>{entry.name}</span>
              </label>
              <button
                className="icon"
                aria-label={`Remove ${entry.name}`}
                onClick={() => onSaveExtras(extras.filter((other) => other.id !== entry.id))}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
        <div className="add-extra">
          <input
            value={newItem}
            placeholder="Milk, bin bags, ..."
            onChange={(event) => setNewItem(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && addExtra()}
          />
          <button onClick={addExtra} disabled={!newItem.trim()}>
            Add
          </button>
        </div>
      </div>

      {unlinked.length > 0 && (
        <p className="muted small footer-note">
          Not counted, because they are not linked to a recipe yet: {unlinked.join(', ')}.
        </p>
      )}
    </section>
  )
}
