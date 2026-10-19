# Todo List with Filters

A React and Redux Toolkit exercise demonstrating visibility filters and memoized selectors.

## Run locally

```sh
npm install
npm run dev
```

## Redux selectors

- `selectTodos` returns the list filtered by the current visibility setting.
- `selectVisibilityFilter` returns `All`, `Active`, or `Completed`.
- `selectFilteredTodosCount` derives the number of visible tasks.

Add tasks, toggle their completion, remove them, and switch the visibility filter. Redux Toolkit's `configureStore` includes its default middleware.
