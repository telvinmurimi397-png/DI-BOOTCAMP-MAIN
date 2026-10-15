import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { clearCart, removeFromCart, updateQuantity } from '../features/cart/cartSlice.js'

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

function ShoppingCart() {
  const [checkoutComplete, setCheckoutComplete] = useState(false)
  const items = useSelector((state) => state.cart.items)
  const dispatch = useDispatch()
  const itemCount = items.reduce((total, item) => total + item.quantity, 0)
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0)

  return (
    <aside className="cart-panel" aria-label="Shopping cart">
      <div className="cart-heading">
        <div>
          <p className="section-eyebrow">YOUR PICKS</p>
          <h2>Shopping bag <span>({itemCount})</span></h2>
        </div>
        {items.length > 0 && (
          <button className="text-button" type="button" onClick={() => {
            setCheckoutComplete(false)
            dispatch(clearCart())
          }}>Clear</button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="cart-empty">
          <span aria-hidden="true">○</span>
          <p>{checkoutComplete ? 'Order simulated. Thanks for shopping with us!' : 'Your bag is waiting for something good.'}</p>
        </div>
      ) : (
        <>
          <ul className="cart-list">
            {items.map((item) => (
              <li className="cart-item" key={item.id}>
                <img src={item.image} alt="" />
                <div className="cart-item-info">
                  <h3>{item.title}</h3>
                  <span className="cart-item-price">{currency.format(item.price)}</span>
                  <div className="quantity-control" aria-label={`Quantity for ${item.title}`}>
                    <button
                      type="button"
                      aria-label={`Decrease ${item.title} quantity`}
                      onClick={() => dispatch(updateQuantity({ id: item.id, amount: -1 }))}
                    >−</button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      aria-label={`Increase ${item.title} quantity`}
                      onClick={() => dispatch(updateQuantity({ id: item.id, amount: 1 }))}
                    >+</button>
                  </div>
                </div>
                <div className="cart-item-end">
                  <strong>{currency.format(item.price * item.quantity)}</strong>
                  <button
                    className="remove-item"
                    type="button"
                    aria-label={`Remove ${item.title} from cart`}
                    onClick={() => dispatch(removeFromCart(item.id))}
                  >Remove</button>
                </div>
              </li>
            ))}
          </ul>
          <div className="cart-total">
            <span>Subtotal</span>
            <strong>{currency.format(subtotal)}</strong>
          </div>
          <button className="checkout-button" type="button" disabled={!items.length} onClick={() => {
            setCheckoutComplete(true)
            dispatch(clearCart())
          }}>
            Continue to checkout <span aria-hidden="true">→</span>
          </button>
          <p className="cart-note">A little treat, just for you.</p>
        </>
      )}
    </aside>
  )
}

export default ShoppingCart
