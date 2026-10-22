import type { Book } from '../model/Book'
import { BookCard } from './BookCard'

interface BookListProps {
  books: Book[]
}

export function BookList({ books }: BookListProps) {
  if (books.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon" aria-hidden="true">✳</span>
        <h3>Your next favorite is waiting.</h3>
        <p>Try another filter, or add a book and start your collection.</p>
        <a href="#add-book">Add your first book <span aria-hidden="true">↗</span></a>
      </div>
    )
  }

  return (
    <div className="book-grid">
      {books.map((book, index) => <BookCard book={book} index={index} key={book.id} />)}
    </div>
  )
}
