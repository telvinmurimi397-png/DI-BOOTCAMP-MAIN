import { useDispatch } from 'react-redux'
import { removeTodo, toggleTodo } from '../redux/todoSlice.js'

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
        <span className="todo-text">{todo.text}</span>
      </label>
      <button
        className="remove-button"
        type="button"
        onClick={() => dispatch(removeTodo(todo.id))}
        aria-label={`Remove ${todo.text}`}
        title="Remove task"
      >
        <span aria-hidden="true">×</span>
      </button>
    </li>
  )
}

export default TodoItem
