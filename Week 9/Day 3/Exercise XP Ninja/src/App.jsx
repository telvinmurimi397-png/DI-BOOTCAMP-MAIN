import { useSelector } from 'react-redux'
import AddProduct from './components/AddProduct.jsx'
import InventoryList from './components/InventoryList.jsx'

function App() {
  const products = useSelector((state) => state.inventory.products)
  const totalUnits = products.reduce((total, product) => total + product.quantity, 0)
  const inventoryValue = products.reduce((total, product) => total + product.quantity * product.price, 0)

  return (
    <main className="page-shell">
      <header className="topline">
        <a className="wordmark" href="#top" aria-label="Stockroom home">
          <span className="wordmark-mark" aria-hidden="true">s.</span>
          <span>stockroom</span>
        </a>
        <span className="date-note">A CLEAR VIEW OF WHAT YOU HAVE</span>
      </header>

      <section className="inventory-panel" id="top" aria-labelledby="page-title">
        <header className="panel-header">
          <div>
            <p className="eyebrow">STORE INVENTORY</p>
            <h1 id="page-title">Know what’s<br />on your shelves.</h1>
          </div>
          <div className="product-count" aria-label={`${products.length} products`}>
            <span>{String(products.length).padStart(2, '0')}</span>
            <small>PRODUCTS</small>
          </div>
        </header>

        <div className="summary-strip">
          <div><span>UNITS IN STOCK</span><strong>{totalUnits.toLocaleString()}</strong></div>
          <div><span>STOCK VALUE</span><strong>{inventoryValue.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</strong></div>
        </div>

        <AddProduct />
        <InventoryList />

        <footer className="panel-footer">
          <span>{products.length} {products.length === 1 ? 'product' : 'products'} tracked</span>
          <span>Every item, accounted for.</span>
        </footer>
      </section>

      <p className="page-caption">A little more visibility. A little less guesswork.</p>
    </main>
  )
}

export default App
