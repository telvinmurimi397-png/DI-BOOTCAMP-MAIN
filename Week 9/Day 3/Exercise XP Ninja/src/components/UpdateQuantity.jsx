import { useDispatch } from 'react-redux'
import { updateQuantity } from '../redux/inventorySlice.js'

function UpdateQuantity({ product }) {
  const dispatch = useDispatch()

  function changeQuantity(event) {
    const quantity = Number(event.target.value)
    if (Number.isInteger(quantity) && quantity >= 0) {
      dispatch(updateQuantity({ id: product.id, quantity }))
    }
  }

  return (
    <label className="quantity-control">
      <span className="sr-only">Quantity for {product.name}</span>
      <input
        aria-label={`Quantity for ${product.name}`}
        min="0"
        onChange={changeQuantity}
        type="number"
        value={product.quantity}
      />
      <span className="quantity-unit">units</span>
    </label>
  )
}

export default UpdateQuantity
