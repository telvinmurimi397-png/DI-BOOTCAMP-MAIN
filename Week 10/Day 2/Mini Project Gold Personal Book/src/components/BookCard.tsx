import { useBookActions } from '../app/hooks'
import type { Book } from '../model/Book'

const covers = ['cover-rose', 'cover-blue', 'cover-gold', 'cover-green', 'cover-lilac']

interface BookCardProps {
  book: Book
  index: number
}

export function BookCard({ book, index }: BookCardProps) {
  const { remove, toggleRead } = useBookActions()

  return (
    <article className="book-card">
      <div className={`book-cover ${covers[index % covers.length]}`}>
        <span className="cover-topline">A STORY TO KEEP</span>
        <span className="cover-title">{book.title}</span>
        <span className="cover-rule" />
        <span className="cover-author">{book.author}</span>
        <span className="cover-number">{String(index + 1).padStart(2, '0')}</span>
      </div>
      <div className="book-card-body">
        <div className="book-meta"><span>{book.category}</span><span className="book-dot">·</span><time dateTime={book.addedAt}>{new Date(book.addedAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</time></div>
        <h3>{book.title}</h3>
        <p className="book-author">by {book.author}</p>
        {book.description && <p className="book-description">{book.description}</p>}
        <div className="book-card-actions">
          <button
            aria-pressed={book.isRead}
            className={`read-toggle${book.isRead ? ' is-read' : ''}`}
            onClick={() => toggleRead(book.id)}
            type="button"
          >
            <span aria-hidden="true">{book.isRead ? '✓' : '○'}</span> {book.isRead ? 'Finished' : 'Mark as read'}
          </button>
          <button aria-label={`Remove ${book.title}`} className="remove-book" onClick={() => remove(book.id)} type="button">Remove</button>
        </div>
      </div>
    </article>
  )
}
