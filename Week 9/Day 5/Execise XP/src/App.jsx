import { useState } from 'react'
import { useSelector } from 'react-redux'
import {
  selectBooks,
  selectFantasyBooks,
  selectHorrorBooks,
  selectScienceFictionBooks,
} from './store/selectors.js'

const genres = [
  { label: 'All books', selector: selectBooks },
  { label: 'Horror', selector: selectHorrorBooks },
  { label: 'Fantasy', selector: selectFantasyBooks },
  { label: 'Science fiction', selector: selectScienceFictionBooks },
]

function BookList() {
  const [activeGenre, setActiveGenre] = useState('All books')
  const selectedGenre = genres.find((genre) => genre.label === activeGenre)
  const books = useSelector(selectedGenre.selector)
  const allBooks = useSelector(selectBooks)

  return (
    <main className="page-shell">
      <header className="masthead">
        <div className="masthead-copy">
          <p className="eyebrow">Week 9 · Day 5 · Redux performance</p>
          <h1>A shelf for<br /><span>every story.</span></h1>
          <p className="intro">Browse a small collection by genre. Each list is derived with a memoized selector, so unchanged inventory reuses its previous result.</p>
        </div>
        <div className="shelf-mark" aria-hidden="true">
          <span className="book-spine spine-rust" />
          <span className="book-spine spine-blue" />
          <span className="book-spine spine-green" />
          <span className="book-spine spine-yellow" />
          <span className="shelf-line" />
        </div>
      </header>

      <section className="inventory" aria-labelledby="inventory-title">
        <div className="inventory-heading">
          <div>
            <p className="eyebrow">The collection</p>
            <h2 id="inventory-title">Book inventory</h2>
          </div>
          <p className="inventory-total"><strong>{allBooks.length}</strong> titles</p>
        </div>

        <div className="genre-tabs" role="group" aria-label="Filter books by genre">
          {genres.map(({ label }) => (
            <button
              key={label}
              type="button"
              className={`genre-tab${activeGenre === label ? ' is-active' : ''}`}
              aria-pressed={activeGenre === label}
              onClick={() => setActiveGenre(label)}
            >
              {label}
              <span>{label === 'All books' ? allBooks.length : getGenreCount(label, allBooks)}</span>
            </button>
          ))}
        </div>

        <div className="list-summary" aria-live="polite">
          <span>{activeGenre}</span>
          <span>{books.length} {books.length === 1 ? 'book' : 'books'}</span>
        </div>

        <ul className="book-list">
          {books.map((book, index) => (
            <li className="book-row" key={book.id} style={{ '--row-index': index }}>
              <span className="book-number">{String(index + 1).padStart(2, '0')}</span>
              <div className="book-details">
                <h3>{book.title}</h3>
                <p>{book.author}</p>
              </div>
              <span className={`genre-tag genre-${book.genre.toLowerCase().replaceAll(' ', '-')}`}>
                {book.genre}
              </span>
            </li>
          ))}
        </ul>
        <p className="selector-note">Selector: <code>{getSelectorName(activeGenre)}</code> · cached result recalculates only when the books array changes.</p>
      </section>
      <footer className="page-footer">Inventory state and genre filtering are kept separate: Redux stores the books; selectors shape the view.</footer>
    </main>
  )
}

function getGenreCount(label, books) {
  return books.filter((book) => book.genre.toLowerCase() === label.toLowerCase()).length
}

function getSelectorName(label) {
  return {
    'All books': 'selectBooks',
    Horror: 'selectHorrorBooks',
    Fantasy: 'selectFantasyBooks',
    'Science fiction': 'selectScienceFictionBooks',
  }[label]
}

export default BookList
