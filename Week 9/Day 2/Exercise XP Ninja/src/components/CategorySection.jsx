import { useState } from 'react'
import { connect } from 'react-redux'
import { addTodo } from '../redux/todoActions.js'
import TodoItem from './TodoItem.jsx'

function CategorySection({ userId, categoryId, category, filter, index, addTodo }) {
  const [text, setText] = useState('')
  if (!category) return null

  const visibleTodos = category.todos.filter((todo) => {
    if (filter === 'active') return !todo.completed
    if (filter === 'completed') return todo.completed
    return true
  })
  const completed = category.todos.filter((todo) => todo.completed).length

  function handleSubmit(event) {
    event.preventDefault()
    const value = text.trim()
    if (!value) return
    addTodo(userId, categoryId, value)
    setText('')
  }

  return (
    <section className={`category-card category-${categoryId}`} aria-labelledby={`category-${categoryId}`}>
      <header className="category-heading">
        <div className="category-symbol" aria-hidden="true">{String(index + 1).padStart(2, '0')}</div>
        <div className="category-title-group">
          <h2 id={`category-${categoryId}`}>{category.name}</h2>
          <p>{category.description}</p>
        </div>
        <span className="category-progress" aria-label={`${completed} complete`}>{String(completed).padStart(2, '0')} / {String(category.todos.length).padStart(2, '0')}</span>
      </header>

      <form className="category-form" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor={`new-${userId}-${categoryId}`}>Add a task to {category.name}</label>
        <input id={`new-${userId}-${categoryId}`} value={text} onChange={(event) => setText(event.target.value)} placeholder={`Add to ${category.name.toLowerCase()}...`} maxLength={120} />
        <button type="submit" aria-label={`Add task to ${category.name}`} title="Add task">+</button>
      </form>

      {visibleTodos.length > 0 ? (
        <ul className="todo-list">
          {visibleTodos.map((todo) => (
            <TodoItem key={todo.id} todo={todo} userId={userId} categoryId={categoryId} />
          ))}
        </ul>
      ) : (
        <p className="empty-note">Nothing here for this view.</p>
      )}
    </section>
  )
}

const mapStateToProps = (state, ownProps) => ({
  category: state.todosByUser[ownProps.userId]?.find((item) => item.id === ownProps.categoryId),
})

export default connect(mapStateToProps, { addTodo })(CategorySection)
