import { useDispatch, useSelector } from 'react-redux'
import { addToCart } from '../features/cart/cartSlice.js'
import { fetchProducts } from '../features/products/productThunks.js'

function ProductListing() {
  const { items: products, status, error } = useSelector((state) => state.products)
  const dispatch = useDispatch()

  if (status === 'loading' || status === 'idle') {
    return <div className="catalog-status" role="status"><span className="loader" />Finding good things…</div>
  }

  if (status === 'failed') {
    return (
      <div className="catalog-error" role="alert">
        <p>We couldn’t load the products: {error}</p>
        <button className="retry-button" type="button" onClick={() => dispatch(fetchProducts())}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <article className="product-card" key={product.id}>
          <div className="product-image-wrap">
            <img className="product-image" src={product.image} alt={product.title} loading="lazy" />
          </div>
          <div className="product-info">
            <span className="product-category">{product.category}</span>
            <h3>{product.title}</h3>
            <div className="product-bottom">
              <span className="product-price">${product.price.toFixed(2)}</span>
              <button
                className="add-cart-button"
                type="button"
                aria-label={`Add ${product.title} to cart`}
                onClick={() => dispatch(addToCart(product))}
              >
                Add <span aria-hidden="true">+</span>
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

export default ProductListing
