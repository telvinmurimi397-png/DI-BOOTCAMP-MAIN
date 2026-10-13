import { useState } from 'react'
import { connect } from 'react-redux'
import CategorySection from './components/CategorySection.jsx'

const filters = [
  { id: 'all', label: 'All tasks' },
  { id: 'active', label: 'To do' },
  { id: 'completed', label: 'Done' },
]

function App({ categories }) {
  const [filter, setFilter] = useState('all')
  const allTodos = categories.flatMap((category) => category.todos)
  const completed = allTodos.filter((todo) => todo.completed).length
  const remaining = allTodos.length - completed

  return (
    <main className="page-shell">
      <header className="topline">
        <a className="wordmark" href="#top" aria-label="Today, in order home">
          <span className="wordmark-mark" aria-hidden="true">t.</span>
          <span>today, in order</span>
        </a>
        <span className="date-note">A PLACE FOR EVERY KIND OF TASK</span>
      </header>

      <section className="todo-panel" id="top" aria-labelledby="page-title">
        <header className="panel-header">
          <div>
            <p className="eyebrow">YOUR LIST, IN GOOD ORDER</p>
            <h1 id="page-title">Make room<br />for what matters.</h1>
          </div>
          <div className="progress-stamp" aria-label={`${completed} of ${allTodos.length} tasks complete`}>
            <span>{String(completed).padStart(2, '0')}</span>
            <i aria-hidden="true">/</i>
            <span className="stamp-total">{String(allTodos.length).padStart(2, '0')}</span>
            <small>DONE</small>
          </div>
        </header>

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
          <span className="category-count">{categories.length} categories</span>
        </div>

        <div className="category-grid">
          {categories.map((category, index) => (
            <CategorySection
              key={category.id}
              categoryId={category.id}
              filter={filter}
              index={index}
            />
          ))}
        </div>

        <footer className="panel-footer">
          <span><strong>{remaining}</strong> {remaining === 1 ? 'task' : 'tasks'} left</span>
          <span className="footer-note">One thing at a time.</span>
        </footer>
      </section>

      <p className="page-caption">A little less noise. A little more intention.</p>
    </main>
  )
}

const mapStateToProps = (state) => ({ categories: state.categories })

export default connect(mapStateToProps)(App)
