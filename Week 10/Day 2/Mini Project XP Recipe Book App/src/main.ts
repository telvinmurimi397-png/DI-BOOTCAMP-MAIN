import { RecipeCollection } from './model/RecipeCollection'
import { RecipeTemplate } from './templates/RecipeTemplate'
import './style.css'

function getElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector)
  if (!element) throw new Error(`The recipe book page is missing ${selector}.`)
  return element
}

const form = getElement<HTMLFormElement>('#recipeEntryForm')
const titleInput = getElement<HTMLInputElement>('#recipeTitle')
const ingredientsInput = getElement<HTMLTextAreaElement>('#ingredients')
const instructionsInput = getElement<HTMLTextAreaElement>('#instructions')
const container = getElement<HTMLElement>('#recipeContainer')
const count = getElement<HTMLElement>('#recipeCount')
const clearButton = getElement<HTMLButtonElement>('#clearRecipesButton')
const formMessage = getElement<HTMLElement>('#formMessage')

const collection = new RecipeCollection()

function renderRecipes(): void {
  const recipes = collection.getAll()
  template.render(recipes)
  count.textContent = `${recipes.length} ${recipes.length === 1 ? 'recipe' : 'recipes'}`
  clearButton.disabled = recipes.length === 0
}

const template = new RecipeTemplate(
  container,
  (id) => {
    collection.toggleFavorite(id)
    renderRecipes()
  },
  (id) => {
    collection.remove(id)
    renderRecipes()
  },
)

form.addEventListener('submit', (event) => {
  event.preventDefault()

  const title = titleInput.value.trim()
  const ingredients = ingredientsInput.value
    .split('\n')
    .map((ingredient) => ingredient.trim())
    .filter(Boolean)
  const instructions = instructionsInput.value.trim()

  if (!title || ingredients.length === 0 || !instructions) {
    formMessage.textContent = 'Please fill in each field before adding your recipe.'
    return
  }

  collection.add(title, ingredients, instructions)
  form.reset()
  formMessage.textContent = 'Recipe added to your collection.'
  renderRecipes()
  titleInput.focus()
})

clearButton.addEventListener('click', () => {
  collection.clear()
  renderRecipes()
  formMessage.textContent = 'Your recipe book has been cleared.'
})

renderRecipes()
