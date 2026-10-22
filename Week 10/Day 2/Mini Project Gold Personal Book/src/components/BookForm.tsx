import { useState, type FormEvent } from 'react'
import { useBookActions } from '../app/hooks'

const genres = ['Fiction', 'Fantasy', 'Mystery', 'Romance', 'Science fiction', 'Biography', 'Non-fiction', 'Other']

export function BookForm() {
  const { add } = useBookActions()
  const [message, setMessage] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const title = String(data.get('title') ?? '').trim()
    const author = String(data.get('author') ?? '').trim()
    const category = String(data.get('category') ?? '')
    const description = String(data.get('description') ?? '').trim()

    if (!title || !author || !category) {
      setMessage('Add a title, author, and genre to save your book.')
      return
    }

    add({ title, author, category, description })
    form.reset()
    setMessage(`“${title}” is on your shelf.`)
    window.setTimeout(() => setMessage(''), 3500)
  }

  return (
    <section className="add-section" id="add-book">
      <div className="add-copy">
        <p className="eyebrow">THE NEXT CHAPTER</p>
        <h2>Make space for<br /><em>another story.</em></h2>
        <p>Every great reading list starts with one book. Add yours to the shelf.</p>
        <span className="add-decoration" aria-hidden="true">✳</span>
      </div>
      <form className="book-form" onSubmit={handleSubmit}>
        <div className="form-heading"><span>01 — NEW ADDITION</span><span aria-hidden="true">✦</span></div>
        <label>
          BOOK TITLE <span>*</span>
          <input maxLength={100} name="title" placeholder="e.g. The Midnight Library" required />
        </label>
        <div className="form-two-col">
          <label>
            AUTHOR <span>*</span>
            <input maxLength={80} name="author" placeholder="e.g. Matt Haig" required />
          </label>
          <label>
            GENRE <span>*</span>
            <select defaultValue="" name="category" required>
              <option disabled value="">Choose a genre</option>
              {genres.map((genre) => <option key={genre} value={genre}>{genre}</option>)}
            </select>
          </label>
        </div>
        <label>
          A NOTE ABOUT THE BOOK <small>OPTIONAL</small>
          <textarea maxLength={240} name="description" placeholder="What made you pick it up?" rows={3} />
        </label>
        <div className="form-footer">
          <p className="form-message" aria-live="polite">{message || 'A little note can help you remember why it matters.'}</p>
          <button className="add-button" type="submit">Add to shelf <span aria-hidden="true">↗</span></button>
        </div>
      </form>
    </section>
  )
}
