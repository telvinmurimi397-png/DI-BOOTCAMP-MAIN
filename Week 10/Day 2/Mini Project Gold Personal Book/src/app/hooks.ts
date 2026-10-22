import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from './store'
import { addBook, removeBook, toggleReadStatus } from '../features/books/booksSlice'
import type { NewBook } from '../model/Book'

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()

export function useBookActions() {
  const dispatch = useAppDispatch()

  return {
    add: (book: NewBook) => dispatch(addBook(book)),
    remove: (id: string) => dispatch(removeBook(id)),
    toggleRead: (id: string) => dispatch(toggleReadStatus(id)),
  }
}
