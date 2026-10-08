import { useState } from 'react'
import {
  NavLink,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from 'react-router-dom'
import categories from './categories.js'
import ImageGallery from './components/ImageGallery.jsx'

function SearchForm() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    const query = search.trim()
    if (query) navigate(`/search/${encodeURIComponent(query)}`)
  }

  return (
    <form className="search-form" role="search" onSubmit={handleSubmit}>
      <label className="visually-hidden" htmlFor="photo-search">
        Search photos
      </label>
      <span className="search-icon" aria-hidden="true">
        ⌕
      </span>
      <input
        id="photo-search"
        type="search"
        placeholder="Search for anything…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <button type="submit" disabled={!search.trim()}>
        Search
      </button>
    </form>
  )
}

function CategoryGallery() {
  const { categorySlug } = useParams()
  const category = categories.find((item) => item.slug === categorySlug)

  if (!category) return <Navigate to="/mountain" replace />

  return (
    <ImageGallery
      key={category.slug}
      query={category.search}
      heading={`${category.name} photos`}
    />
  )
}

function SearchGallery() {
  const { query = '' } = useParams()

  return (
    <ImageGallery
      key={query}
      query={query}
      heading={`Results for “${query}”`}
    />
  )
}

function App() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <NavLink className="brand" to="/mountain" aria-label="SnapShot home">
            <span className="brand-mark" aria-hidden="true">
              S
            </span>
            <span>snap<span className="brand-light">shot</span></span>
          </NavLink>
          <SearchForm />
          <span className="header-note">A world of photos</span>
        </div>
      </header>

      <main className="main-content">
        <section className="welcome">
          <div className="welcome-copy">
            <p className="section-kicker">Find your inspiration</p>
            <h2>See the world<br />a little differently.</h2>
            <p className="welcome-description">
              Discover beautiful photographs from every corner of the world.
            </p>
          </div>
          <div className="welcome-art" aria-hidden="true">
            <span className="sun" />
            <span className="mountain mountain-back" />
            <span className="mountain mountain-front" />
            <span className="art-caption">COLLECT MOMENTS</span>
          </div>
        </section>

        <nav className="category-nav" aria-label="Photo categories">
          {categories.map((category) => (
            <NavLink
              key={category.slug}
              className={({ isActive }) =>
                `category-link${isActive ? ' active' : ''}`
              }
              to={`/${category.slug}`}
            >
              {category.name}
            </NavLink>
          ))}
        </nav>

        <Routes>
          <Route path="/" element={<Navigate to="/mountain" replace />} />
          <Route path="/:categorySlug" element={<CategoryGallery />} />
          <Route path="/search/:query" element={<SearchGallery />} />
          <Route path="*" element={<Navigate to="/mountain" replace />} />
        </Routes>

        <footer className="site-footer">
          Images provided by Wikimedia Commons
        </footer>
      </main>
    </div>
  )
}

export default App
