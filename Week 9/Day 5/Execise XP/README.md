# Book Inventory Selector

A React and Redux Toolkit exercise demonstrating memoized selectors with `createSelector`.

## Run locally

```sh
npm install
npm run dev
```

## Selectors

- `selectBooks` returns the complete inventory.
- `selectHorrorBooks`, `selectFantasyBooks`, and `selectScienceFictionBooks` return memoized genre lists.

Switch genres with the tabs to see each selector drive the displayed inventory. Redux Toolkit's `configureStore` includes its default middleware.
