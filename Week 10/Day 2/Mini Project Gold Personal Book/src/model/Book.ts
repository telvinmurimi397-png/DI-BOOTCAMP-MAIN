export interface Book {
  id: string
  title: string
  author: string
  category: string
  description: string
  addedAt: string
  isRead: boolean
}

export type NewBook = Pick<Book, 'title' | 'author' | 'category' | 'description'>

export class BookItem implements Book {
  readonly id: string
  readonly title: string
  readonly author: string
  readonly category: string
  readonly description: string
  readonly addedAt: string
  readonly isRead: boolean

  constructor(
    id: string,
    title: string,
    author: string,
    category: string,
    description: string,
    addedAt: string = new Date().toISOString(),
    isRead = false,
  ) {
    this.id = id
    this.title = title
    this.author = author
    this.category = category
    this.description = description
    this.addedAt = addedAt
    this.isRead = isRead
  }

  get displayTitle(): string {
    return this.title.trim()
  }

  get displayAuthor(): string {
    return this.author.trim()
  }

  toJSON(): Book {
    return {
      id: this.id,
      title: this.displayTitle,
      author: this.displayAuthor,
      category: this.category,
      description: this.description.trim(),
      addedAt: this.addedAt,
      isRead: this.isRead,
    }
  }

  static fromJSON(value: unknown): Book | null {
    if (typeof value !== 'object' || value === null) return null
    const book = value as Partial<Book>
    if (
      typeof book.id !== 'string' ||
      typeof book.title !== 'string' ||
      typeof book.author !== 'string' ||
      typeof book.category !== 'string' ||
      typeof book.description !== 'string' ||
      typeof book.addedAt !== 'string' ||
      typeof book.isRead !== 'boolean'
    ) return null
    return new BookItem(
      book.id,
      book.title,
      book.author,
      book.category,
      book.description,
      book.addedAt,
      book.isRead,
    ).toJSON()
  }
}
