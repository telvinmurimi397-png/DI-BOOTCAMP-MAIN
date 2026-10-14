import { useDispatch } from 'react-redux'
import { removeProduct } from '../redux/inventorySlice.js'

function RemoveProduct({ productId, productName }) {
  const dispatch = useDispatch()

  return (
    <button
      aria-label={`Remove ${productName}`}
      className="remove-button"
      onClick={() => dispatch(removeProduct(productId))}
      title="Remove product"
      type="button"
    >
      <span aria-hidden="true">×</span>
    </button>
  )
}

export default RemoveProduct
