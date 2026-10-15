import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AuthForm from './components/AuthForm.jsx'
import ProductListing from './components/ProductListing.jsx'
import ShoppingCart from './components/ShoppingCart.jsx'
import { fetchProducts } from './features/products/productThunks.js'

function App() {
  const dispatch = useDispatch()
  const { items, status } = useSelector((state) => state.products)

  useEffect(() => {
    dispatch(fetchProducts())
  }, [dispatch])

  return (
    <main className="page-shell">
      <nav className="topbar" aria-label="Main navigation">
        <a className="wordmark" href="#top" aria-label="Common Goods home">
          <span className="brand-mark" aria-hidden="true">c.</span>
          <span>common goods</span>
        </a>
        <div className="topbar-right">
          <span className="secure-note"><span aria-hidden="true">✳</span> A considered collection</span>
          <AuthForm />
        </div>
      </nav>

      <header className="hero" id="top">
        <div>
          <p className="eyebrow">EVERYDAY, MADE BETTER</p>
          <h1>Good things.<br /><span>Thoughtfully found.</span></h1>
          <p className="intro">Useful little discoveries for the way you live.</p>
        </div>
        <div className="hero-stamp" aria-label="A collection of considered goods">
          <span>CURATED</span>
          <strong>✳</strong>
          <span>WITH CARE</span>
        </div>
      </header>

      <div className="shop-layout">
        <section className="catalog" aria-label="Products">
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">THE COLLECTION</p>
              <h2>Made for keeping</h2>
            </div>
            {status === 'succeeded' && <span className="product-count">{items.length} finds</span>}
          </div>
          <ProductListing />
        </section>
        <ShoppingCart />
      </div>

      <footer className="page-footer">
        <span>Find the good in everyday.</span>
        <span>A simulated shop · Redux Toolkit</span>
      </footer>
    </main>
  )
}

export default App
