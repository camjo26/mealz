import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import type { Recipe } from './types'

// Dad's Recipe Box lives in the `recipes` collection of the shared family
// Firebase project, and its rules allow anyone to read. Mealz therefore reads
// recipes live with no login and never writes to them: the Recipe Box stays the
// single place recipes are created and edited.
const RECIPES_COLLECTION = 'recipes'

export function subscribeToRecipes(
  onChange: (recipes: Recipe[]) => void,
  onError: (message: string) => void,
): () => void {
  return onSnapshot(
    collection(db, RECIPES_COLLECTION),
    (snapshot) => {
      const recipes = snapshot.docs.map((entry) => normalise(entry.id, entry.data()))
      recipes.sort((a, b) => a.name.localeCompare(b.name))
      onChange(recipes)
    },
    () => onError('Could not reach the Recipe Box. Check your connection.'),
  )
}

// Defensive: a recipe saved by an older version of the Recipe Box may be
// missing fields, so every one gets a sensible default rather than undefined.
function normalise(id: string, data: Record<string, unknown>): Recipe {
  const text = (value: unknown) => String(value ?? '').trim()
  const list = (value: unknown) => (Array.isArray(value) ? value : [])
  return {
    id,
    name:    text(data.name) || 'Untitled recipe',
    serves:  Number(data.serves) || 0,
    prep:    text(data.prep),
    cook:    text(data.cook),
    cuisine: text(data.cuisine),
    photo:   typeof data.photo === 'string' && data.photo ? data.photo : null,
    ingredients: list(data.ingredients)
      .map((row) => ({
        qty:     text((row as Record<string, unknown>)?.qty),
        unit:    text((row as Record<string, unknown>)?.unit),
        name:    text((row as Record<string, unknown>)?.name),
        section: text((row as Record<string, unknown>)?.section),
      }))
      .filter((row) => row.name),
    steps:      list(data.steps).map(text).filter(Boolean),
    tags:       list(data.tags).map(text).filter(Boolean),
    sourceUrl:  text(data.sourceUrl),
    sourceName: text(data.sourceName),
    author:     text(data.author),
  }
}

// Loose title matching, used to link a written meal name to a real recipe (so
// "Carbonara" finds "Ultimate spaghetti carbonara recipe"). Returns the best
// match above a confidence floor, or null when nothing is close enough.
const MIN_MATCH_SCORE = 0.5
const NOISE_WORDS = new Set(['recipe', 'the', 'a', 'and', 'with', 'of', 'ultimate', 'easy', 'best'])

export function findMatchingRecipe(title: string, recipes: Recipe[]): Recipe | null {
  const wanted = tokenise(title)
  if (!wanted.length) return null

  let best: Recipe | null = null
  let bestScore = 0
  for (const recipe of recipes) {
    const found   = tokenise(recipe.name)
    const matched = wanted.filter((word) => found.includes(word)).length
    const score   = matched / wanted.length
    if (score > bestScore) {
      bestScore = score
      best = recipe
    }
  }
  return bestScore >= MIN_MATCH_SCORE ? best : null
}

function tokenise(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !NOISE_WORDS.has(word))
}
