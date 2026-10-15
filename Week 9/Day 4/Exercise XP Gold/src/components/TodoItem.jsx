import { useDispatch } from 'react-redux'
import { removeTodo, toggleTodo } from '../redux/todosSlice.js'

function TodoItem({ todo }) {
  const dispatch = useDispatch()

  return (
    <li className={`todo-item${todo.completed ? ' is-complete' : ''}`}>
      <label className="todo-label">
        <input
          className="todo-checkbox"
          type="checkbox"
          checked={todo.completed}
          onChange={() => dispatch(toggleTodo(todo.id))}
        />
        <span className="checkmark" aria-hidden="true">{todo.completed ? '✓' : ''}</span>
        <span className="todo-text">{todo.title}</span>
      </label>
      <button
        className="remove-button"
        type="button"
        aria-label={`Remove ${todo.title}`}
        onClick={() => dispatch(removeTodo(todo.id))}
      >
        ×
      </button>
    </li>
  )
}

export default TodoItem
