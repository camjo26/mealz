// Links out to Dad's Recipe Box, which is the better place to actually cook
// from: it has the cooking timers, keeps the screen awake, and holds the notes
// and ratings. Mealz hands over the recipe and the number of people that meal
// is planned for, so the quantities are already scaled on arrival.
//
// The Recipe Box reads these two parameters on load (see its readDeepLink).
// Keep the names in step with that end if either ever changes.
export const RECIPE_BOX_URL = 'https://my-recipes-rho-rosy.vercel.app/'

const RECIPE_PARAM = 'recipe'
const SERVES_PARAM = 'serves'

export function recipeBoxUrl(recipeId: string, serves: number | null): string {
  const url = new URL(RECIPE_BOX_URL)
  url.searchParams.set(RECIPE_PARAM, recipeId)
  if (serves && serves > 0) url.searchParams.set(SERVES_PARAM, String(serves))
  return url.toString()
}
