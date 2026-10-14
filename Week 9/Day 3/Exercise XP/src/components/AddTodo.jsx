import { useState } from 'react'
import { nanoid } from '@reduxjs/toolkit'
import { useDispatch } from 'react-redux'
import { addTodo } from '../redux/todoSlice.js'

function AddTodo() {
  const [text, setText] = useState('')
  const dispatch = useDispatch()

  function handleSubmit(event) {
    event.preventDefault()
    const value = text.trim()
    if (!value) return

    dispatch(addTodo({ id: nanoid(), text: value, completed: false }))
    setText('')
  }

  return (
    <form className="todo-form" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor="new-todo">Add a task</label>
      <input
        id="new-todo"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="What needs your attention?"
        maxLength={120}
      />
      <button className="add-button" type="submit">
        <span aria-hidden="true">+</span>
        Add task
      </button>
    </form>
  )
}

export default AddTodo
