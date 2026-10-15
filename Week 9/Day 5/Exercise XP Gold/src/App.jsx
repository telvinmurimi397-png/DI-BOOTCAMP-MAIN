import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { addProductToCart, updateCartQuantity } from './store/shoppingCartSlice.js'
import { calculateTotalPrice, selectCartItems, selectProducts } from './store/selectors.js'

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

function ProductCard({ product, onAdd }) {
  return (
    <article className="product-card">
      <div className="cover-wrap">
        <img
          className="book-cover"
          src={`https://covers.openlibrary.org/b/isbn/${product.isbn}-M.jpg`}
          alt={`Cover of ${product.title}`}
          loading="lazy"
          onError={(event) => { event.currentTarget.style.visibility = 'hidden' }}
        />
        <span className="cover-index">FIELDNOTES / {product.id.slice(1).padStart(2, '0')}</span>
      </div>
      <div className="product-info">
        <p className="product-category">{product.category}</p>
        <h3>{product.title}</h3>
        <p className="product-author">{product.author}</p>
        <div className="product-buy-row">
          <strong>{money.format(product.price)}</strong>
          <button className="add-button" type="button" onClick={() => onAdd(product.id)}>
            <span aria-hidden="true">+</span> Add to cart
          </button>
        </div>
      </div>
    </article>
  )
}

function CartLine({ item, onQuantityChange }) {
  return (
    <li className="cart-line">
      <div className="cart-line-copy">
        <h3>{item.title}</h3>
        <p>{money.format(item.price)} each</p>
      </div>
      <div className="quantity-controls" aria-label={`Quantity for ${item.title}`}>
        <button type="button" aria-label={`Remove one ${item.title}`} onClick={() => onQuantityChange(item.productId, item.quantity - 1)}>−</button>
        <span aria-live="polite">{item.quantity}</span>
        <button type="button" aria-label={`Add one ${item.title}`} onClick={() => onQuantityChange(item.productId, item.quantity + 1)}>+</button>
      </div>
      <strong className="line-total">{money.format(item.price * item.quantity)}</strong>
    </li>
  )
}

function ShoppingCart() {
  const dispatch = useDispatch()
  const products = useSelector(selectProducts)
  const cartItems = useSelector(selectCartItems)
  const totalPrice = useSelector(calculateTotalPrice)
  const itemCount = cartItems.reduce((count, item) => count + item.quantity, 0)

  const handleAddToCart = useCallback((productId) => {
    dispatch(addProductToCart(productId))
  }, [dispatch])

  const handleQuantityChange = useCallback((productId, quantity) => {
    dispatch(updateCartQuantity({ productId, quantity }))
  }, [dispatch])

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Fieldnotes Books home">
          <span className="brand-mark" aria-hidden="true">F</span>
          <span>fieldnotes<span className="brand-sub">BOOKS FOR THE CURIOUS</span></span>
        </a>
        <a className="cart-jump" href="#your-cart" aria-label={`Your cart, ${itemCount} items`}>
          Your bag <span>{String(itemCount).padStart(2, '0')}</span>
        </a>
      </header>

      <section className="page-intro" id="top">
        <p className="eyebrow">A considered collection · No. 01</p>
        <h1>Stories to take<br /><em>with you.</em></h1>
        <p>Good books for slow mornings, long walks, and looking at the world a little differently.</p>
      </section>

      <div className="shop-layout">
        <section className="catalog" aria-labelledby="catalog-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">The shelves</p>
              <h2 id="catalog-title">Selected reading</h2>
            </div>
            <span className="catalog-count">{products.length} titles</span>
          </div>
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} onAdd={handleAddToCart} />
            ))}
          </div>
        </section>

        <aside className="cart-panel" id="your-cart" aria-labelledby="cart-title">
          <div className="cart-heading">
            <div>
              <p className="eyebrow">Your selection</p>
              <h2 id="cart-title">Shopping bag</h2>
            </div>
            <span className="cart-count">{itemCount}</span>
          </div>
          {cartItems.length === 0 ? (
            <div className="empty-cart">
              <span className="empty-mark" aria-hidden="true">↗</span>
              <p>Your bag is still a blank page.</p>
              <span>Add a book to begin.</span>
            </div>
          ) : (
            <ul className="cart-list">
              {cartItems.map((item) => (
                <CartLine key={item.productId} item={item} onQuantityChange={handleQuantityChange} />
              ))}
            </ul>
          )}
          <div className="cart-total">
            <span>Subtotal</span>
            <strong>{money.format(totalPrice)}</strong>
          </div>
          <p className="shipping-note">Shipping and taxes calculated at checkout.</p>
          <button className="checkout-button" type="button" disabled={cartItems.length === 0}>
            Continue to checkout <span aria-hidden="true">→</span>
          </button>
        </aside>
      </div>

      <footer className="page-footer">
        <span>Independent reading, thoughtfully gathered.</span>
        <span>Cart total updates from a memoized selector.</span>
      </footer>
    </main>
  )
}

export default ShoppingCart
