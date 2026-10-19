# Shopping Cart Selector

A React and Redux Toolkit exercise demonstrating memoized selectors and derived cart totals.

## Run locally

```sh
npm install
npm run dev
```

## Redux selectors

- `selectProducts` returns the catalog.
- `selectCartItems` joins cart quantities with product details.
- `calculateTotalPrice` derives the subtotal from the selected cart items.

Add products to the bag, then use the quantity controls to update or remove cart lines. Redux Toolkit's `configureStore` includes its default middleware.
