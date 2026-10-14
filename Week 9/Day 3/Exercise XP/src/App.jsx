import { useSelector } from 'react-redux'
import AddTodo from './components/AddTodo.jsx'
import TodoList from './components/TodoList.jsx'

function App() {
  const todos = useSelector((state) => state.todos)
  const completedCount = todos.filter((todo) => todo.completed).length

  return (
    <main className="page-shell">
      <header className="page-heading">
        <p className="eyebrow">A LITTLE MORE INTENTION</p>
        <h1>Things to do<span>.</span></h1>
        <p className="intro">Keep track of what matters, one task at a time.</p>
      </header>

      <section className="todo-panel" aria-label="Todo list">
        <div className="panel-heading">
          <div>
            <h2>Your list</h2>
            <p>{todos.length === 0 ? 'A fresh start.' : `${todos.length} ${todos.length === 1 ? 'task' : 'tasks'} on your list`}</p>
          </div>
          <div className="completion-count" aria-label={`${completedCount} completed`}>
            <span>{String(completedCount).padStart(2, '0')}</span>
            <small>DONE</small>
          </div>
        </div>

        <AddTodo />
        <TodoList />

        <footer className="panel-footer">
          <span>{todos.length - completedCount} left to do</span>
          <span>Progress, not perfection.</span>
        </footer>
      </section>
    </main>
  )
}

export default App
