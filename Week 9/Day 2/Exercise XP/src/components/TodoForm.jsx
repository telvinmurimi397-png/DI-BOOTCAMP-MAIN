import { useState } from 'react'
import { connect } from 'react-redux'
import { addTodo } from '../redux/actions.js'

function TodoForm({ addTodo }) {
  const [text, setText] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    const value = text.trim()
    if (!value) return
    addTodo(value)
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
      <button className="add-button" type="submit" aria-label="Add task">
        <span aria-hidden="true">+</span>
        Add task
      </button>
    </form>
  )
}

export default connect(null, { addTodo })(TodoForm)