import type { Ingredient, Recipe } from './types'

// Turns the planned meals into one shopping list: every ingredient of every
// planned recipe, scaled to the servings chosen for that day, with the same
// ingredient merged across the fortnight and sorted into supermarket aisles.

export type ShoppingItem = {
  key: string
  name: string
  amounts: string[]
  aisle: string
  usedIn: string[]
}

export const UNKNOWN_AISLE = 'Other'

// Longest, most specific keywords first: "spring onion" must beat "onion", and
// "coconut milk" must land in the store cupboard rather than the dairy aisle.
const AISLE_KEYWORDS: [string, string[]][] = [
  ['Fruit & veg', [
    'spring onion', 'red onion', 'onion', 'garlic', 'ginger', 'potato', 'carrot', 'celery',
    'red pepper', 'green pepper', 'tomato', 'mushroom', 'courgette', 'aubergine', 'broccoli',
    'cauliflower', 'cabbage', 'lettuce', 'salad', 'spinach', 'rocket', 'cucumber', 'lemon',
    'lime', 'orange', 'apple', 'banana', 'avocado', 'chilli', 'leek', 'peas', 'sweetcorn',
    'beansprout', 'pak choi', 'butternut', 'squash', 'parsnip', 'sweet potato',
  ]],
  ['Meat & fish', [
    'chicken', 'beef', 'mince', 'pork', 'lamb', 'bacon', 'sausage', 'pancetta', 'chorizo', 'ham',
    'turkey', 'salmon', 'cod', 'haddock', 'tuna', 'prawn', 'fish', 'steak', 'anchovy',
  ]],
  ['Dairy & eggs', [
    'milk', 'butter', 'cheese', 'parmesan', 'cheddar', 'mozzarella', 'cream', 'yoghurt', 'yogurt',
    'egg', 'creme fraiche', 'mascarpone', 'feta',
  ]],
  ['Bakery', ['bread', 'roll', 'bun', 'wrap', 'tortilla', 'pitta', 'baguette', 'naan', 'brioche']],
  ['Herbs & spices', [
    'salt', 'pepper', 'paprika', 'cumin', 'coriander', 'oregano', 'basil', 'thyme', 'rosemary',
    'parsley', 'chive', 'mint', 'cinnamon', 'nutmeg', 'turmeric', 'curry powder', 'bay leaf',
    'chilli powder', 'chilli flakes', 'garam masala', 'five spice', 'seasoning',
  ]],
  ['Frozen', ['frozen', 'ice cream']],
  ['Store cupboard', [
    'pasta', 'spaghetti', 'penne', 'rice', 'noodle', 'flour', 'sugar', 'oil', 'vinegar', 'stock',
    'tinned', 'chopped tomatoes', 'passata', 'tomato puree', 'beans', 'kidney bean', 'chickpea',
    'lentil', 'soy sauce', 'hoisin', 'honey', 'mustard', 'ketchup', 'mayonnaise', 'coconut milk',
    'wine', 'lasagne', 'breadcrumb', 'cornflour', 'baking powder', 'nuts',
  ]],
]

const UNICODE_FRACTIONS: Record<string, number> = {
  '½': 0.5,
  '¼': 0.25,
  '¾': 0.75,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
}

const MAX_DECIMALS = 2

export function buildShoppingList(
  planned: { recipe: Recipe; title: string; serves: number | null }[],
): ShoppingItem[] {
  const items  = new Map<string, ShoppingItem>()
  const totals = new Map<string, Map<string, number>>()
  const loose  = new Map<string, string[]>()

  for (const { recipe, title, serves } of planned) {
    const factor = serves && recipe.serves > 0 ? serves / recipe.serves : 1
    for (const ingredient of recipe.ingredients) {
      const key = normaliseName(ingredient.name)
      if (!key) continue

      if (!items.has(key)) {
        items.set(key, {
          key,
          name: tidyName(ingredient.name),
          amounts: [],
          aisle: aisleFor(ingredient.name),
          usedIn: [],
        })
        totals.set(key, new Map())
        loose.set(key, [])
      }
      const item = items.get(key)!
      if (!item.usedIn.includes(title)) item.usedIn.push(title)

      const quantity = parseQuantity(ingredient.qty)
      const unit     = ingredient.unit.trim().toLowerCase()
      if (quantity === null) {
        const text = describeLoose(ingredient)
        if (text && !loose.get(key)!.includes(text)) loose.get(key)!.push(text)
      } else {
        const byUnit = totals.get(key)!
        byUnit.set(unit, (byUnit.get(unit) || 0) + quantity * factor)
      }
    }
  }

  for (const [key, item] of items) {
    const measured = [...totals.get(key)!.entries()].map(([unit, total]) => {
      const amount = formatNumber(total)
      return unit ? amount + ' ' + unit : amount
    })
    item.amounts = [...measured, ...loose.get(key)!]
  }

  return [...items.values()].sort(
    (a, b) => aisleRank(a.aisle) - aisleRank(b.aisle) || a.name.localeCompare(b.name),
  )
}

export function groupByAisle(items: ShoppingItem[]): [string, ShoppingItem[]][] {
  const groups = new Map<string, ShoppingItem[]>()
  for (const item of items) {
    if (!groups.has(item.aisle)) groups.set(item.aisle, [])
    groups.get(item.aisle)!.push(item)
  }
  return [...groups.entries()].sort(([a], [b]) => aisleRank(a) - aisleRank(b))
}

// "1 1/2", "0.5", "2-3" and the unicode fractions all become a number. Anything
// wordy ("a pinch", "to taste") returns null and is carried through as text.
export function parseQuantity(raw: string): number | null {
  const text = String(raw || '').trim()
  if (!text) return null

  let total = 0
  let sawNumber = false
  for (const part of text.split(/\s+/)) {
    const piece = part.split(/[-–]/)[0]
    if (UNICODE_FRACTIONS[piece] !== undefined) {
      total += UNICODE_FRACTIONS[piece]
      sawNumber = true
    } else if (/^\d+\/\d+$/.test(piece)) {
      const [top, bottom] = piece.split('/').map(Number)
      if (bottom) {
        total += top / bottom
        sawNumber = true
      }
    } else if (/^\d*\.?\d+$/.test(piece)) {
      total += Number(piece)
      sawNumber = true
    }
  }
  return sawNumber ? total : null
}

export function formatNumber(value: number): string {
  const scale = 10 ** MAX_DECIMALS
  return String(Math.round(value * scale) / scale)
}

function describeLoose(ingredient: Ingredient): string {
  return [ingredient.qty, ingredient.unit].map((part) => part.trim()).filter(Boolean).join(' ')
}

// Scale one written quantity for a different number of servings, leaving
// anything unparseable ("a pinch") exactly as the recipe wrote it.
export function scaleQuantity(qty: string, factor: number): string {
  const parsed = parseQuantity(qty)
  if (parsed === null) return qty
  return formatNumber(parsed * factor)
}

// The shared key for an ingredient, used both by the shopping list and by the
// tick boxes on a recipe, so ticking "onion" in either place means the same one.
export const ingredientKey = normaliseName

// Strip the prep notes so "onion, finely chopped" and "1 onion" merge into one
// line, and drop a plural s so "eggs" and "egg" are the same shopping item.
function normaliseName(name: string): string {
  const base = name.toLowerCase().split(',')[0].replace(/[^a-z0-9\s]/g, ' ').trim()
  return base.replace(/\s+/g, ' ').replace(/s$/, '')
}

function tidyName(name: string): string {
  const base = name.split(',')[0].trim()
  return base.charAt(0).toUpperCase() + base.slice(1)
}

function aisleFor(name: string): string {
  const text = name.toLowerCase()
  for (const [aisle, keywords] of AISLE_KEYWORDS) {
    if (keywords.some((keyword) => text.includes(keyword))) return aisle
  }
  return UNKNOWN_AISLE
}

function aisleRank(aisle: string): number {
  const index = AISLE_KEYWORDS.findIndex(([name]) => name === aisle)
  return index === -1 ? AISLE_KEYWORDS.length : index
}

// A plain-text version for sharing into a chat or a notes app.
export function shoppingListAsText(groups: [string, ShoppingItem[]][]): string {
  return groups
    .map(([aisle, items]) => {
      const lines = items.map((item) => {
        const amount = item.amounts.join(' + ')
        return '- ' + item.name + (amount ? ' (' + amount + ')' : '')
      })
      return aisle + '\n' + lines.join('\n')
    })
    .join('\n\n')
}
