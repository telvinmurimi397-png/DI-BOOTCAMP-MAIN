import { RecipeItem, type RecipeData } from './RecipeItem'

const STORAGE_KEY = 'gather-recipes'

function isRecipeData(value: unknown): value is RecipeData {
  if (typeof value !== 'object' || value === null) return false

  const recipe = value as Record<string, unknown>
  return (
    typeof recipe.id === 'string' &&
    typeof recipe.title === 'string' &&
    Array.isArray(recipe.ingredients) &&
    recipe.ingredients.every((ingredient) => typeof ingredient === 'string') &&
    typeof recipe.instructions === 'string' &&
    typeof recipe.isFavorite === 'boolean'
  )
}

export class RecipeCollection {
  private recipes: RecipeItem[] = []

  constructor(private readonly storage: Storage = window.localStorage) {
    this.load()
  }

  getAll(): RecipeItem[] {
    return [...this.recipes]
  }

  add(title: string, ingredients: string[], instructions: string): RecipeItem {
    const recipe = new RecipeItem(title, ingredients, instructions)
    this.recipes.unshift(recipe)
    this.save()
    return recipe
  }

  remove(id: string): void {
    this.recipes = this.recipes.filter((recipe) => recipe.id !== id)
    this.save()
  }

  toggleFavorite(id: string): void {
    const recipe = this.recipes.find((item) => item.id === id)
    if (!recipe) return

    recipe.isFavorite = !recipe.isFavorite
    this.save()
  }

  clear(): void {
    this.recipes = []
    this.save()
  }

  private save(): void {
    this.storage.setItem(STORAGE_KEY, JSON.stringify(this.recipes))
  }

  private load(): void {
    const storedRecipes = this.storage.getItem(STORAGE_KEY)
    if (storedRecipes === null) return

    let parsed: unknown
    try {
      parsed = JSON.parse(storedRecipes)
    } catch {
      throw new Error('Saved recipes could not be read because the stored data is invalid.')
    }

    if (!Array.isArray(parsed) || !parsed.every(isRecipeData)) {
      throw new Error('Saved recipes could not be read because their data is incomplete.')
    }

    this.recipes = parsed.map((recipe) => RecipeItem.fromData(recipe))
  }
}
