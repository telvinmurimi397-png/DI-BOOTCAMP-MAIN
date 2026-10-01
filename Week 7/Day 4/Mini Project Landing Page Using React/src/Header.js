import { useState } from 'react'

function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <header className="site-header" id="top">
      <nav className="navbar container" aria-label="Main navigation">
        <a className="brand" href="#top" onClick={closeMenu}>
          <span className="brand-mark" aria-hidden="true">C</span>
          <span>Company</span>
        </a>
        <button
          className="nav-toggle"
          type="button"
          aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <i className={`fa-solid ${menuOpen ? 'fa-xmark' : 'fa-bars'}`} aria-hidden="true" />
        </button>
        <div
          className={`nav-links${menuOpen ? ' is-open' : ''}`}
          id="primary-navigation"
        >
          <a href="#about" onClick={closeMenu}>About</a>
          <a href="#values" onClick={closeMenu}>Our values</a>
          <a className="nav-contact" href="#contact" onClick={closeMenu}>
            Contact us <i className="fa-solid fa-arrow-right" aria-hidden="true" />
          </a>
        </div>
      </nav>
    </header>
  )
}

export default Header
