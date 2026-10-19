import { useState, type FormEvent } from 'react'
import List from './components/List'

export interface Book {
  id: string
  title: string
  author: string
}

const initialBooks: Book[] = [
  { id: 'book-1', title: 'The Creative Act', author: 'Rick Rubin' },
  { id: 'book-2', title: 'Braiding Sweetgrass', author: 'Robin Wall Kimmerer' },
  { id: 'book-3', title: 'Tomorrow, and Tomorrow, and Tomorrow', author: 'Gabrielle Zevin' },
]

function BookApp() {
  const [books, setBooks] = useState<Book[]>(initialBooks)
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [error, setError] = useState<string | null>(null)

  function addBook(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedTitle = title.trim()
    const trimmedAuthor = author.trim()

    if (!trimmedTitle || !trimmedAuthor) {
      setError('Add both a title and an author to continue.')
      return
    }

    const newBook: Book = {
      id: crypto.randomUUID(),
      title: trimmedTitle,
      author: trimmedAuthor,
    }

    setBooks((currentBooks) => [...currentBooks, newBook])
    setTitle('')
    setAuthor('')
    setError(null)
  }

  return (
    <main className="page-shell">
      <header className="topline">
        <a className="wordmark" href="#top" aria-label="Shelf Notes home"><span className="brand-mark">S</span> SHELF NOTES</a>
        <span className="topline-label">A LITTLE READING LIST</span>
      </header>

      <section className="intro" id="top">
        <p className="eyebrow"><span className="live-dot" /> WEEK 10 · DAY 1 · DAILY CHALLENGE</p>
        <h1>Good books<br />stay <span>with us.</span></h1>
        <p className="intro-copy">A small home for the stories and ideas worth keeping. Add a title, find it on your shelf.</p>
        <div className="intro-foot"><span>YOUR PERSONAL BOOKSHELF</span><span>EST. TODAY&nbsp; ✳</span></div>
      </section>

      <section className="content-grid" aria-label="Book list and add book form">
        <section className="books-section" aria-labelledby="books-title">
          <div className="section-heading">
            <div><p className="eyebrow">ON YOUR SHELF</p><h2 id="books-title">The collection<span>.</span></h2></div>
            <span className="book-count">{String(books.length).padStart(2, '0')} BOOKS</span>
          </div>
          <List
            items={books}
            getKey={(book) => book.id}
            emptyMessage="Your shelf is waiting for its first story."
            renderItem={(book, index) => (
              <article className="book-item">
                <span className={`book-number book-tone-${index % 4}`}>{String(index + 1).padStart(2, '0')}</span>
                <div className="book-copy"><h3>{book.title}</h3><p>{book.author}</p></div>
                <span className="book-spark" aria-hidden="true">↗</span>
              </article>
            )}
          />
          <p className="shelf-note">Every list item is rendered by the same generic component.</p>
        </section>

        <aside className="add-panel" aria-labelledby="add-title">
          <p className="eyebrow">MAKE ROOM ON THE SHELF</p>
          <h2 id="add-title">Add a book<span>.</span></h2>
          <p className="add-description">What are you reading, or what would you recommend?</p>
          <form className="book-form" onSubmit={addBook} noValidate>
            <label htmlFor="book-title">BOOK TITLE</label>
            <input id="book-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. The Midnight Library" />
            <label htmlFor="book-author">AUTHOR</label>
            <input id="book-author" value={author} onChange={(event) => setAuthor(event.target.value)} placeholder="e.g. Matt Haig" />
            {error && <p className="form-error" role="alert">{error}</p>}
            <button type="submit">Add to my shelf <span aria-hidden="true">↗</span></button>
          </form>
          <div className="generic-note"><span className="note-symbol">{'{ }'}</span><p><strong>One component, any item.</strong><br />A typed <code>renderItem</code> decides what each entry looks like.</p></div>
        </aside>
      </section>

      <footer className="page-footer">
        <span>WEEK 10 / DAY 1</span>
        <span>BUILT WITH REACT + TYPESCRIPT</span>
        <a href="#top">BACK TO TOP ↑</a>
      </footer>
    </main>
  )
}

export default BookApp
