import { connect } from 'react-redux'
import { removeTodo, toggleTodo } from '../redux/actions.js'

function TodoItem({ todo, categoryId, toggleTodo, removeTodo }) {
  return (
    <li className={`todo-item${todo.completed ? ' is-complete' : ''}`}>
      <label className="todo-label">
        <input
          className="todo-checkbox"
          type="checkbox"
          checked={todo.completed}
          onChange={() => toggleTodo(categoryId, todo.id)}
        />
        <span className="checkmark" aria-hidden="true">{todo.completed ? '✓' : ''}</span>
        <span className="todo-text">{todo.text}</span>
      </label>
      <button
        className="remove-button"
        type="button"
        onClick={() => removeTodo(categoryId, todo.id)}
        aria-label={`Remove ${todo.text}`}
        title="Remove task"
      >
        <span aria-hidden="true">×</span>
      </button>
    </li>
  )
}

export default connect(null, { toggleTodo, removeTodo })(TodoItem)
