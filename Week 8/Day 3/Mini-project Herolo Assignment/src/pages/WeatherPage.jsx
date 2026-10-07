import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import WeatherDetails from '../components/WeatherDetails.jsx'
import { useFavorites, placeKey } from '../context/FavoritesContext.jsx'
import { searchCities } from '../services/weather.js'

function cityLabel(city) {
  return [city.name, city.admin1, city.country].filter(Boolean).join(', ')
}

export default function WeatherPage() {
  const [query, setQuery] = useState('')
  const [cities, setCities] = useState([])
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const searchController = useRef(null)
  const { favorites, toggleFavorite } = useFavorites()

  async function handleSearch(event) {
    event.preventDefault()
    const cityName = query.trim()
    if (!cityName) return

    searchController.current?.abort()
    const controller = new AbortController()
    searchController.current = controller
    setStatus('loading')
    setError('')
    setCities([])
    setSelectedPlace(null)

    try {
      const results = await searchCities(cityName, controller.signal)
      setCities(results)
      setStatus(results.length ? 'results' : 'empty')
    } catch (searchError) {
      if (searchError.name === 'AbortError') return
      console.error('Could not search cities:', searchError)
      setError(searchError.message || 'Could not search for that city.')
      setStatus('error')
    }
  }

  function selectCity(city) {
    setSelectedPlace(city)
    setCities([])
    setStatus('idle')
  }

  const isFavorite = selectedPlace && favorites.some(
    (favorite) => placeKey(favorite) === placeKey(selectedPlace),
  )

  return (
    <div className="weather-page">
      <header className="page-heading">
        <p className="eyebrow">Your weather, at a glance</p>
        <h1>Find your forecast</h1>
        <p>Search for any city to see current conditions and the 5-day outlook.</p>
      </header>

      <section className="search-panel" aria-label="Search weather by city">
        <form className="search-form" onSubmit={handleSearch}>
          <label className="visually-hidden" htmlFor="city-search">City name</label>
          <span className="search-icon" aria-hidden="true">⌕</span>
          <input
            id="city-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search for a city…"
            autoComplete="off"
          />
          <button className="btn btn-primary search-button" type="submit" disabled={!query.trim() || status === 'loading'}>
            {status === 'loading' ? 'Searching…' : 'Search'}
          </button>
        </form>

        {status === 'loading' && (
          <p className="search-feedback" role="status">Looking up cities…</p>
        )}
        {status === 'empty' && (
          <p className="search-feedback" role="status">No matching cities found. Check the spelling and try again.</p>
        )}
        {status === 'error' && <div className="alert alert-danger search-alert" role="alert">{error}</div>}

        {cities.length > 0 && (
          <div className="city-results" aria-label="City search results">
            <p className="results-hint">Choose a location</p>
            {cities.map((city) => (
              <button
                className="city-result"
                type="button"
                key={`${city.id}-${city.latitude}-${city.longitude}`}
                onClick={() => selectCity(city)}
              >
                <span className="result-pin" aria-hidden="true">⌖</span>
                <span>{cityLabel(city)}</span>
                <span className="result-arrow" aria-hidden="true">→</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {selectedPlace ? (
        <>
          <div className="selected-heading">
            <p className="eyebrow">Current conditions</p>
            <button
              className={`favorite-button${isFavorite ? ' saved' : ''}`}
              type="button"
              onClick={() => toggleFavorite(selectedPlace)}
              aria-pressed={Boolean(isFavorite)}
            >
              <span aria-hidden="true">{isFavorite ? '★' : '☆'}</span>
              {isFavorite ? 'Saved to favorites' : 'Save to favorites'}
            </button>
          </div>
          <WeatherDetails place={selectedPlace} />
        </>
      ) : (
        <section className="welcome-panel">
          <div className="welcome-symbol" aria-hidden="true">☀️</div>
          <h2>Where to?</h2>
          <p>Search a city above to discover its current weather and upcoming forecast.</p>
          {favorites.length > 0 && (
            <p className="quick-favorites">
              Your saved places are ready on the <Link to="/favorites">favorites page</Link>.
            </p>
          )}
        </section>
      )}
    </div>
  )
}
