import { connect } from 'react-redux'
import TodoItem from './TodoItem.jsx'

function TodoList({ todos, filter }) {
  const visibleTodos = todos.filter((todo) => {
    if (filter === 'active') return !todo.completed
    if (filter === 'completed') return todo.completed
    return true
  })

  if (visibleTodos.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-mark" aria-hidden="true">—</span>
        <p>{todos.length === 0 ? 'A clear page. Add a task to begin.' : 'Nothing in this view.'}</p>
      </div>
    )
  }

  return (
    <ul className="todo-list">
      {visibleTodos.map((todo) => <TodoItem key={todo.id} todo={todo} />)}
    </ul>
  )
}

const mapStateToProps = (state) => ({ todos: state })

export default connect(mapStateToProps)(TodoList)