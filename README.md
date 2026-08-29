# 🍽 Mealz

Cam's family meal planner: a **two-week Monday-to-Sunday rota**, shared across
everyone's phones, with recipes pulled live from Dad's **Recipe Box** and a
shopping list built automatically from whatever is planned.

## What it does

- **The fortnight** - two weeks of Mon-Sun. The app works out which week the
  rota is actually on and opens there, with today's row highlighted, so it
  answers "what's for tea tonight" in one glance.
- **Plan a day** - tap a day to search Dad's Recipe Box, or just type a meal
  name for something nobody has written up yet. Set servings and a note
  ("Cam cooking") per day.
- **Recipes** - browse and search the whole Recipe Box, including by
  ingredient. Each recipe has an **Ingredients** page and a step-by-step
  **Method** page where you tick steps off as you cook.
- **Shopping list** - every ingredient of every planned recipe for week 1,
  week 2, or the whole fortnight, merged (two meals wanting onions give one
  line), scaled to the servings chosen, and sorted into supermarket aisles.
  Tick what you already have, add extras by hand, and copy the outstanding
  list to share into a chat.
- **Shared** - the plan and the shopping ticks live in the family database, so
  everyone sees the same fortnight. Anyone can look without signing in;
  changing it needs a family login.
- **Installable** - add to home screen and it behaves like an app.

## Where the recipes come from

Mealz **reads** the `recipes` collection of the shared `phil-mini-apps`
Firebase project, which is the same data Dad's
[Recipe Box](https://my-recipes-rho-rosy.vercel.app/) writes. It never writes
to it. That is deliberate: recipes are created and edited in one place, and
appear in Mealz the moment they are saved. A recipe Mealz cannot find is simply
shown as a typed-in meal name until someone writes it up in the Recipe Box.

Matching a typed meal to a recipe is fuzzy (`findMatchingRecipe` in
`src/lib/recipes.ts`), so "Carbonara" finds "Ultimate spaghetti carbonara
recipe". Once linked, the meal contributes its ingredients to the shopping
list.

## Architecture

Vite + React + TypeScript, deployed on **Vercel**, backed by the shared family
**Firebase** project. There are no serverless functions and no secret keys: the
`VITE_FIREBASE_*` values are public by design, and access is controlled by
Firestore security rules.

- `src/App.tsx` - the shell: tabs, auth state, and the live subscriptions.
- `src/lib/dates.ts` - the two-week rota maths. Everything is whole-day local
  time, so there is no timezone drift between devices.
- `src/lib/recipes.ts` - the live read of Dad's Recipe Box, plus fuzzy matching.
- `src/lib/plan.ts` - reads and writes the two Firestore documents. Every write
  merges, so two people editing different days never overwrite each other.
- `src/lib/shopping.ts` - quantity parsing (`1 1/2`, `½`, `2-3`), merging the
  same ingredient across the fortnight, servings scaling, and aisle sorting.
- `src/lib/seed.ts` - Cam's original handwritten fortnight, used by the
  "Load the starter plan" button.
- `firestore.rules` - the one block to add to the shared project's rules.

### Firestore layout

Mealz owns the top-level `mealz` collection, with two shared documents:

| Document | Holds |
|---|---|
| `plan` | `anchorMonday` (the Monday week 1 began), and `slots` keyed `w1-mon` … `w2-sun` |
| `shopping` | `have` (ticked ingredients) and `extras` (hand-added items) |

`anchorMonday` is what makes the rota work: the current week is the number of
whole weeks since that Monday, modulo two. "Swap which week is current" nudges
it on by seven days when the rota drifts out of step with real life.

## Setup

The security rule must be added once before the plan will load - until then
Firestore refuses even to read it. See `firestore.rules`; paste the `mealz`
block into the Firebase console alongside the existing blocks, with Cam's
email in the allowlist.

Sign-in also has to be allowed from this app's domain: Firebase console ->
Authentication -> Settings -> Authorized domains, add `mealz.vercel.app`.

## Local development

```bash
pnpm install
pnpm dev
```

Needs a `.env.local` with the six `VITE_FIREBASE_*` values (copied from
`%USERPROFILE%\.claude\skills\new-vercel-app\config\firebase-shared.env`). It is
gitignored. There are no `/api` functions, so plain `pnpm dev` is the whole
app - `vercel dev` is not needed.

pnpm only, never npm or yarn.

## Publishing

```powershell
& "C:\dev\cams-apps\.claude\skills\new-cam-vercel-app\publish-cam-vercel-app.ps1" `
    -Name 'mealz' -Auth firebase -Description 'The family fortnightly meal plan.'
```

Bump `VERSION` and prepend a `CHANGELOG` entry in `src/version.ts` first - the
badge in the corner is how you tell a fresh build from a cached one.
