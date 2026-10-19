import { useSelector } from 'react-redux'
import { selectCategories } from '../store/selectors.js'

function CategorySelector({ selectedCategoryId, onSelect }) {
  const categories = useSelector(selectCategories)
  const options = [
    { id: 'all', name: 'All tasks' },
    ...categories,
    { id: 'uncategorized', name: 'Uncategorized' },
  ]

  return (
    <nav className="category-nav" aria-label="Filter tasks by category">
      {options.map((category) => (
        <button
          className={`category-option${selectedCategoryId === category.id ? ' is-selected' : ''}`}
          type="button"
          key={category.id}
          aria-pressed={selectedCategoryId === category.id}
          onClick={() => onSelect(category.id)}
        >
          <span className={`category-dot dot-${category.color || 'neutral'}`} aria-hidden="true" />
          <span>{category.name}</span>
        </button>
      ))}
    </nav>
  )
}

export default CategorySelector
