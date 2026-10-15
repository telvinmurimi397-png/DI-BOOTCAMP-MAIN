import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  books: [
    { id: 1, title: 'The Haunting of Hill House', author: 'Shirley Jackson', genre: 'Horror' },
    { id: 2, title: 'Frankenstein', author: 'Mary Shelley', genre: 'Horror' },
    { id: 3, title: 'The Hobbit', author: 'J.R.R. Tolkien', genre: 'Fantasy' },
    { id: 4, title: 'A Wizard of Earthsea', author: 'Ursula K. Le Guin', genre: 'Fantasy' },
    { id: 5, title: 'Dune', author: 'Frank Herbert', genre: 'Science Fiction' },
    { id: 6, title: 'Kindred', author: 'Octavia E. Butler', genre: 'Science Fiction' },
    { id: 7, title: 'The Fifth Season', author: 'N.K. Jemisin', genre: 'Fantasy' },
    { id: 8, title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin', genre: 'Science Fiction' },
  ],
}

const booksSlice = createSlice({
  name: 'books',
  initialState,
  reducers: {},
})

export default booksSlice.reducer
