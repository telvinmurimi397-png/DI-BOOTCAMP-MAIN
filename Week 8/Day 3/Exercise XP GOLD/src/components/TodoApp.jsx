import { useReducer, useRef } from 'react'

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_TODO': {
      const newTodo = action.payload
      return [newTodo, ...state]
    }
    case 'REMOVE_TODO': {
      return state.filter((t) => t.id !== action.payload)
    }
    default:
      return state
  }
}

function createTodo(text) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    text: text.trim(),
  }
}

export default function TodoApp() {
  const [todos, dispatch] = useReducer(reducer, [])
  const inputRef = useRef(null)

  function handleAdd(event) {
    event.preventDefault()
    const text = inputRef.current.value
    if (!text || !text.trim()) return
    const todo = createTodo(text)
    dispatch({ type: 'ADD_TODO', payload: todo })
    inputRef.current.value = ''
    inputRef.current.focus()
  }

  function handleRemove(id) {
    dispatch({ type: 'REMOVE_TODO', payload: id })
  }

  return (
    <div className="todo-app">
      <form className="todo-form" onSubmit={handleAdd}>
        <label htmlFor="todo-input" className="visually-hidden">New todo</label>
        <input id="todo-input" ref={inputRef} placeholder="Add a todo and press Enter" />
        <button type="submit">Add</button>
      </form>

      <ul className="todo-list">
        {todos.length === 0 && <li className="empty">No todos yet</li>}
        {todos.map((todo) => (
          <li key={todo.id} className="todo-item">
            <span className="todo-text">{todo.text}</span>
            <button className="remove" onClick={() => handleRemove(todo.id)} aria-label={`Remove ${todo.text}`}>
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
