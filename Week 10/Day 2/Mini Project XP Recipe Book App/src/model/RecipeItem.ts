import { v4 as uuidv4 } from 'uuid'

export interface RecipeData {
  id: string
  title: string
  ingredients: string[]
  instructions: string
  isFavorite: boolean
}

export class RecipeItem implements RecipeData {
  readonly id: string
  title: string
  ingredients: string[]
  instructions: string
  isFavorite: boolean

  constructor(
    title: string,
    ingredients: string[],
    instructions: string,
    id = uuidv4(),
    isFavorite = false,
  ) {
    this.id = id
    this.title = title
    this.ingredients = ingredients
    this.instructions = instructions
    this.isFavorite = isFavorite
  }

  static fromData(data: RecipeData): RecipeItem {
    return new RecipeItem(
      data.title,
      data.ingredients,
      data.instructions,
      data.id,
      data.isFavorite,
    )
  }
}
