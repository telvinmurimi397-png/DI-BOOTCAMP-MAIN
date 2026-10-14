import { useSelector } from 'react-redux'
import TodoItem from './TodoItem.jsx'

function TodoList() {
  const todos = useSelector((state) => state.todos)

  if (todos.length === 0) {
    return (
      <div className="empty-state">
        <span aria-hidden="true">—</span>
        <p>Your list is clear. Add a task to get started.</p>
      </div>
    )
  }

  return (
    <ul className="todo-list">
      {todos.map((todo) => <TodoItem key={todo.id} todo={todo} />)}
    </ul>
  )
}

export default TodoList
