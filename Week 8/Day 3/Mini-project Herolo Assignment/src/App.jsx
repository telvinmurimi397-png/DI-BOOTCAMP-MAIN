import { NavLink, Route, Routes } from 'react-router-dom'
import FavoritesPage from './pages/FavoritesPage.jsx'
import WeatherPage from './pages/WeatherPage.jsx'
import { useFavorites } from './context/FavoritesContext.jsx'

export default function App() {
  const { storageError } = useFavorites()

  return (
    <div className="app">
      <header className="site-header">
        <div className="container app-container header-inner">
          <NavLink className="brand" to="/" aria-label="Skyward weather home">
            <span className="brand-mark" aria-hidden="true">S</span>
            <span>skyward</span>
          </NavLink>
          <nav className="main-nav" aria-label="Main navigation">
            <NavLink end to="/" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              Weather
            </NavLink>
            <NavLink to="/favorites" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              Favorites
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="container app-container main-content">
        {storageError && <div className="alert alert-warning storage-warning" role="status">{storageError}</div>}
        <Routes>
          <Route path="/" element={<WeatherPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="*" element={<WeatherPage />} />
        </Routes>
      </main>

      <footer className="site-footer">
        <div className="container app-container">Weather data by Open-Meteo</div>
      </footer>
    </div>
  )
}
