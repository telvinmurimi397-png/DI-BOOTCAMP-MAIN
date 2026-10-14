import { useSelector } from 'react-redux'
import RemoveProduct from './RemoveProduct.jsx'
import UpdateQuantity from './UpdateQuantity.jsx'

function InventoryList() {
  const products = useSelector((state) => state.inventory.products)

  if (products.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-mark" aria-hidden="true">—</span>
        <p>Your inventory is empty. Add a product to get started.</p>
      </div>
    )
  }

  return (
    <div className="inventory-list-wrap">
      <div className="list-heading" aria-hidden="true">
        <span>PRODUCT</span>
        <span>UNIT PRICE</span>
        <span>QUANTITY</span>
        <span />
      </div>
      <ul className="inventory-list">
        {products.map((product) => (
          <li className="inventory-row" key={product.id}>
            <div className="product-name">
              <span className="product-mark" aria-hidden="true">{product.name.charAt(0).toUpperCase()}</span>
              <strong>{product.name}</strong>
            </div>
            <span className="product-price">{product.price.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</span>
            <UpdateQuantity product={product} />
            <RemoveProduct productId={product.id} productName={product.name} />
          </li>
        ))}
      </ul>
    </div>
  )
}

export default InventoryList
