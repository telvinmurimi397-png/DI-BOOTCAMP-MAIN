import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { addTodo } from '../redux/todosSlice.js'

function AddTodo() {
  const [title, setTitle] = useState('')
  const dispatch = useDispatch()

  function handleSubmit(event) {
    event.preventDefault()
    const trimmedTitle = title.trim()

    if (!trimmedTitle) return

    dispatch(addTodo(trimmedTitle))
    setTitle('')
  }

  return (
    <form className="todo-form" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor="new-todo">Add a task</label>
      <input
        id="new-todo"
        type="text"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="What needs doing?"
        maxLength={120}
        required
      />
      <button className="add-button" type="submit">
        <span aria-hidden="true">+</span>
        Add task
      </button>
    </form>
  )
}

export default AddTodo
