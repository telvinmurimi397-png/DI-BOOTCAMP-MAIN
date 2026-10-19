# Productivity Tracker

A React and Redux Toolkit app for organizing tasks and tracking daily progress.

## Run locally

```sh
npm install
npm run dev
```

## Selectors

- `selectTasksByCategory(state, categoryId)` filters tasks for a category. Use `all` for the full list and `uncategorized` for tasks without a category.
- `selectCompletedTasks(state, categoryId)` returns the completed task count for the same view.
- `selectCategoryById(state, categoryId)` looks up a category by ID.

Tasks support adding, editing, deleting, completion toggling, and progress updates. Categories support adding, renaming, and deleting. Deleting a category moves its tasks to Uncategorized instead of removing them. Redux Toolkit's `configureStore` enables its default middleware.
