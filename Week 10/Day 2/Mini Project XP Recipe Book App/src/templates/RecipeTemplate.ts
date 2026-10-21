import type { RecipeItem } from '../model/RecipeItem'

export class RecipeTemplate {
  constructor(
    private readonly container: HTMLElement,
    private readonly onFavorite: (id: string) => void,
    private readonly onDelete: (id: string) => void,
  ) {
    this.container.addEventListener('click', (event) => {
      const target = event.target
      if (!(target instanceof HTMLElement)) return

      const button = target.closest<HTMLButtonElement>('button[data-action]')
      const card = button?.closest<HTMLElement>('[data-recipe-id]')
      const id = card?.dataset.recipeId
      if (!button || !id) return

      if (button.dataset.action === 'favorite') this.onFavorite(id)
      if (button.dataset.action === 'delete') this.onDelete(id)
    })
  }

  render(recipes: RecipeItem[]): void {
    this.container.replaceChildren()

    if (recipes.length === 0) {
      const empty = document.createElement('div')
      empty.className = 'empty-state'
      empty.innerHTML = `
        <span class="empty-illustration" aria-hidden="true">⌂</span>
        <h3>Your recipe book is waiting</h3>
        <p>Add something you love to make this space yours.</p>
      `
      this.container.append(empty)
      return
    }

    const fragment = document.createDocumentFragment()
    for (const recipe of recipes) {
      fragment.append(this.createCard(recipe))
    }
    this.container.append(fragment)
  }

  private createCard(recipe: RecipeItem): HTMLElement {
    const card = document.createElement('article')
    card.className = 'recipe-card'
    card.dataset.recipeId = recipe.id

    const top = document.createElement('div')
    top.className = 'card-top'

    const title = document.createElement('h3')
    title.className = 'recipe-title'
    title.textContent = recipe.title

    const favoriteButton = document.createElement('button')
    favoriteButton.className = `icon-button${recipe.isFavorite ? ' is-favorite' : ''}`
    favoriteButton.type = 'button'
    favoriteButton.dataset.action = 'favorite'
    favoriteButton.setAttribute(
      'aria-label',
      recipe.isFavorite ? `Remove ${recipe.title} from favorites` : `Add ${recipe.title} to favorites`,
    )
    favoriteButton.setAttribute('aria-pressed', String(recipe.isFavorite))
    favoriteButton.textContent = recipe.isFavorite ? '♥' : '♡'

    top.append(title, favoriteButton)

    const ingredientLabel = document.createElement('p')
    ingredientLabel.className = 'card-label'
    ingredientLabel.textContent = `${recipe.ingredients.length} ingredients`

    const details = document.createElement('details')
    details.className = 'recipe-details'

    const summary = document.createElement('summary')
    summary.textContent = 'View recipe'

    const ingredientsHeading = document.createElement('h4')
    ingredientsHeading.textContent = 'Ingredients'

    const ingredientsList = document.createElement('ul')
    ingredientsList.className = 'ingredient-list'
    for (const ingredient of recipe.ingredients) {
      const item = document.createElement('li')
      item.textContent = ingredient
      ingredientsList.append(item)
    }

    const instructionsHeading = document.createElement('h4')
    instructionsHeading.textContent = 'Method'

    const instructions = document.createElement('p')
    instructions.className = 'instructions'
    instructions.textContent = recipe.instructions

    details.append(
      summary,
      ingredientsHeading,
      ingredientsList,
      instructionsHeading,
      instructions,
    )

    const deleteButton = document.createElement('button')
    deleteButton.className = 'delete-button'
    deleteButton.type = 'button'
    deleteButton.dataset.action = 'delete'
    deleteButton.textContent = 'Remove recipe'

    card.append(top, ingredientLabel, details, deleteButton)
    return card
  }
}
