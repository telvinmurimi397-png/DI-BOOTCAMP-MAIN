import { useEffect, useState } from 'react'
import { BookForm } from './components/BookForm'
import { BookList } from './components/BookList'
import { useAppDispatch, useAppSelector } from './app/hooks'
import {
  selectVisibleBooks,
  setCategory,
  setFilter,
  setSearch,
  setSort,
  type BookFilter,
  type BookSort,
} from './features/books/booksSlice'
import './App.css'

const filters: { value: BookFilter; label: string }[] = [
  { value: 'all', label: 'All books' },
  { value: 'unread', label: 'To read' },
  { value: 'read', label: 'Finished' },
]

function App() {
  const dispatch = useAppDispatch()
  const books = useAppSelector((state) => state.books.books)
  const filter = useAppSelector((state) => state.books.filter)
  const category = useAppSelector((state) => state.books.category)
  const search = useAppSelector((state) => state.books.search)
  const sort = useAppSelector((state) => state.books.sort)
  const visibleBooks = useAppSelector(selectVisibleBooks)
  const storageError = useAppSelector((state) => state.books.storageError)
  const [searchInput, setSearchInput] = useState(search)

  useEffect(() => {
    const timeout = window.setTimeout(() => dispatch(setSearch(searchInput)), 250)
    return () => window.clearTimeout(timeout)
  }, [dispatch, searchInput])

  const categories = [...new Set(books.map((book) => book.category))].sort()
  const readCount = books.filter((book) => book.isRead).length
  const unreadCount = books.length - readCount

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="Shelf home">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span>shelf<span className="brand-period">.</span></span>
        </a>
        <span className="topbar-note">YOUR PERSONAL LIBRARY</span>
      </header>

      <section className="hero" id="home">
        <div className="hero-copy">
          <p className="eyebrow"><span /> A LITTLE SPACE FOR BIG STORIES</p>
          <h1>Keep your next<br /><em>great read</em> close.</h1>
          <p className="hero-description">
            A home for the books you love, the ones you&apos;re reading, and the ones you can&apos;t wait to start.
          </p>
          <a className="hero-link" href="#library">Explore your shelf <span aria-hidden="true">↓</span></a>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="sun-disc" />
          <div className="book-stack stack-back"><span /></div>
          <div className="book-stack stack-middle"><span /></div>
          <div className="book-stack stack-front"><span /></div>
          <div className="art-spark spark-one">✳</div>
          <div className="art-spark spark-two">✦</div>
          <div className="art-label">MAKE ROOM<br />FOR WONDER</div>
        </div>
      </section>

      <section className="library-section" id="library">
        <div className="section-heading">
          <div>
            <p className="eyebrow">THE COLLECTION</p>
            <h2>Your bookshelf<span className="brand-period">.</span></h2>
          </div>
          <div className="book-count"><strong>{books.length.toString().padStart(2, '0')}</strong><span>BOOKS<br />COLLECTED</span></div>
        </div>

        <div className="stats-row" aria-label="Reading statistics">
          <div className="stat-card"><span className="stat-icon">↗</span><span><strong>{books.length}</strong><small>in your library</small></span></div>
          <div className="stat-card"><span className="stat-icon read-icon">✓</span><span><strong>{readCount}</strong><small>finished reading</small></span></div>
          <div className="stat-card"><span className="stat-icon unread-icon">✳</span><span><strong>{unreadCount}</strong><small>still to discover</small></span></div>
        </div>

        <div className="library-toolbar">
          <div className="filter-tabs" role="group" aria-label="Filter books">
            {filters.map((item) => (
              <button
                className={`filter-tab${filter === item.value ? ' active' : ''}`}
                key={item.value}
                onClick={() => dispatch(setFilter(item.value))}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="toolbar-controls">
            <label className="search-box">
              <span aria-hidden="true">⌕</span>
              <input
                aria-label="Search books"
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Find a book..."
                type="search"
                value={searchInput}
              />
            </label>
            <label className="select-wrap">
              <span className="visually-hidden">Filter by category</span>
              <select onChange={(event) => dispatch(setCategory(event.target.value))} value={category}>
                <option value="all">All genres</option>
                {categories.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="select-wrap sort-select">
              <span className="visually-hidden">Sort books</span>
              <select onChange={(event) => dispatch(setSort(event.target.value as BookSort))} value={sort}>
                <option value="recent">Recently added</option>
                <option value="title">Title A–Z</option>
                <option value="author">Author A–Z</option>
              </select>
            </label>
          </div>
        </div>

        {storageError && <p className="storage-message" role="status">{storageError}</p>}
        <BookList books={visibleBooks} />
      </section>

      <BookForm />

      <footer className="footer">
        <a className="brand footer-brand" href="#home"><span className="brand-mark" aria-hidden="true">S</span><span>shelf<span className="brand-period">.</span></span></a>
        <p>Every book is a new place to go.</p>
        <a href="#home" className="back-to-top">BACK TO TOP ↑</a>
      </footer>
    </main>
  )
}

export default App
