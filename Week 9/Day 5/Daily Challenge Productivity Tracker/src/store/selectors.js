import { createSelector } from '@reduxjs/toolkit'

const selectAllTasks = (state) => state.productivity.tasks
export const selectCategories = (state) => state.productivity.categories

export const selectTasksByCategory = createSelector(
  [selectAllTasks, (_state, categoryId) => categoryId],
  (tasks, categoryId) => {
    if (categoryId === 'all') return tasks
    if (categoryId === 'uncategorized') return tasks.filter((task) => task.categoryId === null)
    return tasks.filter((task) => task.categoryId === categoryId)
  },
)

export const selectCompletedTasks = createSelector(
  [selectTasksByCategory],
  (tasks) => tasks.filter((task) => task.completed).length,
)

export const selectCategoryById = createSelector(
  [selectCategories, (_state, categoryId) => categoryId],
  (categories, categoryId) => categories.find((category) => category.id === categoryId),
)
