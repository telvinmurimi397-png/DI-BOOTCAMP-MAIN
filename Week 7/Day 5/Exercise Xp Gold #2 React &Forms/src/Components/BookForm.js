import { useState } from 'react'

const emptyBook = {
  title: '',
  author: '',
  genre: '',
  year: '',
}

function BookForm() {
  const [book, setBook] = useState(emptyBook)
  const [submittedBook, setSubmittedBook] = useState(null)

  const handleChange = (event) => {
    const { name, value } = event.currentTarget
    setBook((currentBook) => ({ ...currentBook, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const formData = { ...book }
    setSubmittedBook(formData)
    console.log(formData)
  }

  return (
    <div className="form-exercise">
      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Title
          <input
            name="title"
            value={book.title}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Author
          <input
            name="author"
            value={book.author}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Genre
          <select
            name="genre"
            value={book.genre}
            onChange={handleChange}
            required
          >
            <option value="" disabled>
              Select a genre
            </option>
            <option value="Fiction">Fiction</option>
            <option value="Non-fiction">Non-fiction</option>
            <option value="Mystery">Mystery</option>
            <option value="Science fiction">Science fiction</option>
            <option value="Other">Other</option>
          </select>
        </label>
        <label>
          Year
          <input
            type="number"
            name="year"
            value={book.year}
            onChange={handleChange}
            min="0"
            max="9999"
            required
          />
        </label>
        <button type="submit">Submit</button>
      </form>

      {submittedBook && (
        <div className="success-message" role="status">
          <p>Book data submitted successfully!</p>
          <pre>{JSON.stringify(submittedBook, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

export default BookForm
