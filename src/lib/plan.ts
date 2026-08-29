import { deleteField, doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { mondayOf, toISODate } from './dates'
import type { Meal, Plan, ShoppingState } from './types'

// Mealz keeps its own top-level collection on the shared family project, so it
// cannot collide with the Recipe Box or the other mini apps. Both documents are
// single shared records: one fortnight plan and one shopping list for everyone.
const MEALZ_COLLECTION = 'mealz'
const PLAN_DOC         = 'plan'
const SHOPPING_DOC     = 'shopping'

const planRef     = () => doc(db, MEALZ_COLLECTION, PLAN_DOC)
const shoppingRef = () => doc(db, MEALZ_COLLECTION, SHOPPING_DOC)

export function emptyPlan(): Plan {
  return { anchorMonday: toISODate(mondayOf(new Date())), slots: {}, updatedBy: '' }
}

export function subscribeToPlan(
  onChange: (plan: Plan) => void,
  onError: (message: string) => void,
): () => void {
  return onSnapshot(
    planRef(),
    (snapshot) => {
      const data = snapshot.data()
      if (!data) {
        onChange(emptyPlan())
        return
      }
      onChange({
        anchorMonday: String(data.anchorMonday || emptyPlan().anchorMonday),
        slots:        (data.slots as Record<string, Meal>) || {},
        updatedBy:    String(data.updatedBy || ''),
      })
    },
    () => onError('Could not load the plan. Check your connection.'),
  )
}

export function subscribeToShopping(
  onChange: (state: ShoppingState) => void,
  onError: (message: string) => void,
): () => void {
  return onSnapshot(
    shoppingRef(),
    (snapshot) => {
      const data = snapshot.data()
      onChange({
        have:   (data?.have as Record<string, boolean>) || {},
        extras: (data?.extras as ShoppingState['extras']) || [],
      })
    },
    () => onError('Could not load the shopping list.'),
  )
}

// Every write merges, so two people editing different days at the same time
// never overwrite each other's meal.
export async function saveMeal(key: string, meal: Meal, editor: string): Promise<void> {
  await setDoc(planRef(), { slots: { [key]: meal }, updatedBy: editor }, { merge: true })
}

export async function clearMeal(key: string, editor: string): Promise<void> {
  await setDoc(planRef(), { slots: { [key]: deleteField() }, updatedBy: editor }, { merge: true })
}

export async function saveWholePlan(plan: Plan, editor: string): Promise<void> {
  await setDoc(planRef(), { ...plan, updatedBy: editor })
}

export async function setAnchorMonday(anchorMonday: string, editor: string): Promise<void> {
  await setDoc(planRef(), { anchorMonday, updatedBy: editor }, { merge: true })
}

export async function setHave(key: string, have: boolean): Promise<void> {
  await setDoc(shoppingRef(), { have: { [key]: have } }, { merge: true })
}

export async function clearHave(): Promise<void> {
  await setDoc(shoppingRef(), { have: {} }, { merge: true })
}

export async function saveExtras(extras: ShoppingState['extras']): Promise<void> {
  await setDoc(shoppingRef(), { extras }, { merge: true })
}

// Firestore rejects a write from anyone not on the editor allowlist. Turn that
// into something a person can act on rather than a raw permission code.
export function friendlyWriteError(error: unknown): string {
  const code = (error as { code?: string })?.code || ''
  if (code === 'permission-denied') {
    return 'Your account is not on the editors list yet. Ask Dad to add your email.'
  }
  if (code === 'unavailable') return 'You appear to be offline. The change will retry.'
  return 'That did not save. Please try again.'
}
