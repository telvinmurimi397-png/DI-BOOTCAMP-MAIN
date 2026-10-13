import { useState } from 'react'
import { connect } from 'react-redux'
import TodoForm from './components/TodoForm.jsx'
import TodoList from './components/TodoList.jsx'
import { clearCompleted } from './redux/actions.js'

const filters = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'In progress' },
  { id: 'completed', label: 'Done' },
]

function App({ todos, clearCompleted }) {
  const [filter, setFilter] = useState('all')
  const remaining = todos.filter((todo) => !todo.completed).length
  const completed = todos.length - remaining

  return (
    <main className="page-shell">
      <div className="topline">
        <a className="wordmark" href="#top" aria-label="Today, in order home">
          <span className="wordmark-mark" aria-hidden="true">t.</span>
          <span>today, in order</span>
        </a>
        <span className="date-note">A SMALL PLAN FOR A GOOD DAY</span>
      </div>

      <section className="todo-panel" id="top" aria-labelledby="page-title">
        <header className="panel-header">
          <div>
            <p className="eyebrow">YOUR DAILY LIST</p>
            <h1 id="page-title">Make space<br />for what matters.</h1>
          </div>
          <div className="progress-stamp" aria-label={`${completed} of ${todos.length} tasks complete`}>
            <span>{String(completed).padStart(2, '0')}</span>
            <i aria-hidden="true">/</i>
            <span className="stamp-total">{String(todos.length).padStart(2, '0')}</span>
            <small>DONE</small>
          </div>
        </header>

        <TodoForm />

        <div className="list-toolbar">
          <div className="filter-tabs" role="tablist" aria-label="Filter tasks">
            {filters.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={filter === item.id}
                className={filter === item.id ? 'filter-tab is-selected' : 'filter-tab'}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
                {item.id === 'active' && <span className="tab-count">{remaining}</span>}
              </button>
            ))}
          </div>
          {completed > 0 && (
            <button className="clear-button" type="button" onClick={clearCompleted}>
              Clear done
            </button>
          )}
        </div>

        <TodoList filter={filter} />

        <footer className="panel-footer">
          <span><strong>{remaining}</strong> {remaining === 1 ? 'task' : 'tasks'} left</span>
          <span className="footer-note">One thing at a time.</span>
        </footer>
      </section>

      <p className="page-caption">A little less noise. A little more intention.</p>
    </main>
  )
}

const mapStateToProps = (state) => ({ todos: state })

export default connect(mapStateToProps, { clearCompleted })(App)