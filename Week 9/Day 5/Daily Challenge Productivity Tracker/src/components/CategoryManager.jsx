import { useCallback, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { addCategory, deleteCategory, editCategory } from '../store/trackerSlice.js'
import { selectCategories } from '../store/selectors.js'

function CategoryManager({ onDeleteCategory }) {
  const dispatch = useDispatch()
  const categories = useSelector(selectCategories)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')

  const handleAdd = useCallback((event) => {
    event.preventDefault()
    const name = newName.trim()
    if (!name || categories.some((category) => category.name.toLowerCase() === name.toLowerCase())) return
    dispatch(addCategory(name))
    setNewName('')
  }, [categories, dispatch, newName])

  const handleEdit = useCallback((event) => {
    event.preventDefault()
    const name = editingName.trim()
    if (!name || categories.some((category) => category.id !== editingId && category.name.toLowerCase() === name.toLowerCase())) return
    dispatch(editCategory({ id: editingId, name }))
    setEditingId(null)
    setEditingName('')
  }, [categories, dispatch, editingId, editingName])

  const handleDelete = useCallback((categoryId) => {
    dispatch(deleteCategory(categoryId))
    onDeleteCategory(categoryId)
  }, [dispatch, onDeleteCategory])

  return (
    <section className="category-manager" aria-labelledby="categories-title">
      <div className="manager-heading">
        <div>
          <p className="eyebrow">Organize your work</p>
          <h2 id="categories-title">Categories</h2>
        </div>
        <span>{categories.length} groups</span>
      </div>
      <ul className="manage-category-list">
        {categories.map((category) => (
          <li key={category.id}>
            {editingId === category.id ? (
              <form className="category-edit-form" onSubmit={handleEdit}>
                <input aria-label="Category name" value={editingName} onChange={(event) => setEditingName(event.target.value)} maxLength={32} autoFocus />
                <button className="text-action" type="submit">Save</button>
                <button className="icon-button" type="button" aria-label="Cancel category edit" onClick={() => setEditingId(null)}>×</button>
              </form>
            ) : (
              <>
                <span className="category-name"><i className={`category-dot dot-${category.color}`} />{category.name}</span>
                <div className="category-actions">
                  <button className="text-action" type="button" onClick={() => { setEditingId(category.id); setEditingName(category.name) }}>Rename</button>
                  <button className="text-action delete-action" type="button" onClick={() => handleDelete(category.id)}>Delete</button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
      <form className="new-category-form" onSubmit={handleAdd}>
        <label className="visually-hidden" htmlFor="new-category">New category name</label>
        <input id="new-category" value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="Add a category" maxLength={32} />
        <button type="submit" aria-label="Add category"><span aria-hidden="true">+</span></button>
      </form>
    </section>
  )
}

export default CategoryManager
