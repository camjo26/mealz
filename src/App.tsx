import { useCallback, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, signOut, type User } from 'firebase/auth'
import { auth } from './firebase'
import AuthScreen from './auth/AuthScreen'
import MealEditor from './components/MealEditor'
import PlanBoard from './components/PlanBoard'
import RecipeBrowser from './components/RecipeBrowser'
import RecipeDetail from './components/RecipeDetail'
import ShoppingBoard from './components/ShoppingBoard'
import TodayCard from './components/TodayCard'
import UserMenu from './components/UserMenu'
import { fromISODate, mondayOf, toISODate, weekIndexFor, type DayKey } from './lib/dates'
import {
  clearHave,
  clearMeal,
  emptyPlan,
  friendlyWriteError,
  saveExtras,
  saveMeal,
  saveWholePlan,
  setAnchorMonday,
  setHave,
  subscribeToPlan,
  subscribeToShopping,
} from './lib/plan'
import { subscribeToRecipes } from './lib/recipes'
import { buildStarterPlan } from './lib/seed'
import { slotKey, type Plan, type Recipe, type ShoppingState } from './lib/types'

const TABS = [
  { id: 'today', label: 'Today' },
  { id: 'plan', label: 'Plan' },
  { id: 'recipes', label: 'Recipes' },
  { id: 'shopping', label: 'Shopping' },
] as const

type TabId = (typeof TABS)[number]['id']

type EditTarget = { weekIndex: number; day: DayKey }

const ERROR_VISIBLE_MS = 4000

export default function App() {
  const [user, setUser]         = useState<User | null>(null)
  const [authReady, setReady]   = useState(false)
  const [showSignIn, setSignIn] = useState(false)

  const [tab, setTab]           = useState<TabId>('today')
  const [weekIndex, setWeek]    = useState(0)
  const [recipes, setRecipes]   = useState<Recipe[]>([])
  const [loadingBox, setBox]    = useState(true)
  const [plan, setPlan]         = useState<Plan>(emptyPlan())
  const [shopping, setShopping] = useState<ShoppingState>({ have: {}, extras: [] })

  const [editing, setEditing]   = useState<EditTarget | null>(null)
  const [openRecipe, setOpen]   = useState<{ recipe: Recipe; serves: number | null } | null>(null)
  const [busy, setBusy]         = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const canEdit = Boolean(user)
  const editor  = user?.email ?? ''

  const report = useCallback((message: string) => setError(message), [])

  useEffect(() => onAuthStateChanged(auth, (next) => {
    setUser(next)
    setReady(true)
    if (next) setSignIn(false)
  }), [])

  useEffect(() => subscribeToRecipes((next) => {
    setRecipes(next)
    setBox(false)
  }, report), [report])

  useEffect(() => subscribeToPlan(setPlan, report), [report])
  useEffect(() => subscribeToShopping(setShopping, report), [report])

  // Open on whichever week is actually running, so the app answers "what's for
  // tea tonight" without anyone having to work out which week of the rota it is.
  useEffect(() => {
    setWeek(weekIndexFor(new Date(), plan.anchorMonday))
  }, [plan.anchorMonday])

  useEffect(() => {
    if (!error) return
    const timer = window.setTimeout(() => setError(null), ERROR_VISIBLE_MS)
    return () => window.clearTimeout(timer)
  }, [error])

  const planIsEmpty = useMemo(
    () => Object.values(plan.slots).filter((meal) => meal?.title).length === 0,
    [plan.slots],
  )

  async function guard(action: () => Promise<void>) {
    setBusy(true)
    try {
      await action()
    } catch (err) {
      setError(friendlyWriteError(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleSeed() {
    await guard(() => saveWholePlan(buildStarterPlan(recipes), editor))
  }

  // Which Monday week 1 begins on. Everything else about the rota follows from
  // it, so it is set directly rather than nudged: any date is accepted and
  // snapped back to its own Monday, because a rota week cannot start midweek.
  async function handleSetAnchor(isoDate: string) {
    if (!isoDate) return
    const monday = toISODate(mondayOf(fromISODate(isoDate)))
    await guard(() => setAnchorMonday(monday, editor))
  }

  const editingMeal = editing ? plan.slots[slotKey(editing.weekIndex, editing.day)] : undefined

  return (
    <div className="shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            🍽
          </span>
          <h1>Mealz</h1>
        </div>
        {authReady &&
          (user ? (
            <UserMenu user={user} onSignOut={() => signOut(auth)} />
          ) : (
            <button className="ghost" onClick={() => setSignIn(true)}>
              Sign in to edit
            </button>
          ))}
      </header>

      <nav className="tabs main-tabs" role="tablist">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            role="tab"
            aria-selected={entry.id === tab}
            className={entry.id === tab ? 'tab active' : 'tab'}
            onClick={() => setTab(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </nav>

      <main>
        {tab === 'today' && (
          <>
            <TodayCard
              plan={plan}
              recipes={recipes}
              canEdit={canEdit}
              onOpenRecipe={(recipe, serves) => setOpen({ recipe, serves })}
              onEditToday={(week, day) => {
                setWeek(week)
                setEditing({ weekIndex: week, day })
              }}
            />
            {canEdit ? (
              <div className="anchor-row">
                <label className="field">
                  <span>Week 1 starts on</span>
                  <input
                    type="date"
                    value={plan.anchorMonday}
                    disabled={busy}
                    onChange={(event) => void handleSetAnchor(event.target.value)}
                  />
                </label>
                <p className="muted small">
                  That makes today <b>week {weekIndexFor(new Date(), plan.anchorMonday) + 1}</b>.
                  Pick any day and it snaps to that week&rsquo;s Monday. Everyone sees this.
                </p>
              </div>
            ) : (
              <p className="muted small footer-note">
                Sign in to change the plan. Anyone can look without signing in.
              </p>
            )}
          </>
        )}

        {tab === 'plan' && (
          <>
            {planIsEmpty && canEdit && (
              <div className="empty-state">
                <p>The plan is empty. Start from the handwritten fortnight?</p>
                <button className="primary" onClick={handleSeed} disabled={busy}>
                  Load the starter plan
                </button>
              </div>
            )}
            <PlanBoard
              plan={plan}
              recipes={recipes}
              weekIndex={weekIndex}
              canEdit={canEdit}
              onChangeWeek={setWeek}
              onEditSlot={(week, day) => setEditing({ weekIndex: week, day })}
              onOpenRecipe={(recipe, serves) => setOpen({ recipe, serves })}
            />
            {!canEdit && authReady && (
              <p className="muted small footer-note">
                Sign in to change the plan. Anyone can look without signing in.
              </p>
            )}
          </>
        )}

        {tab === 'recipes' && (
          <RecipeBrowser
            recipes={recipes}
            loading={loadingBox}
            onOpenRecipe={(recipe) => setOpen({ recipe, serves: null })}
          />
        )}

        {tab === 'shopping' && (
          <ShoppingBoard
            plan={plan}
            recipes={recipes}
            shopping={shopping}
            onToggleHave={(key, have) => void guard(() => setHave(key, have))}
            onClearTicks={() => void guard(() => clearHave())}
            onSaveExtras={(extras) => void guard(() => saveExtras(extras))}
          />
        )}
      </main>

      {editing && (
        <MealEditor
          weekIndex={editing.weekIndex}
          day={editing.day}
          meal={editingMeal}
          recipes={recipes}
          busy={busy}
          onClose={() => setEditing(null)}
          onSave={async (meal) => {
            await guard(() => saveMeal(slotKey(editing.weekIndex, editing.day), meal, editor))
            setEditing(null)
          }}
          onClear={async () => {
            await guard(() => clearMeal(slotKey(editing.weekIndex, editing.day), editor))
            setEditing(null)
          }}
        />
      )}

      {openRecipe && (
        <RecipeDetail
          recipe={openRecipe.recipe}
          serves={openRecipe.serves}
          have={shopping.have}
          onToggleHave={(key, have) => void guard(() => setHave(key, have))}
          onClose={() => setOpen(null)}
        />
      )}

      {showSignIn && <AuthScreen onClose={() => setSignIn(false)} />}

      {error && (
        <p className="toast" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
