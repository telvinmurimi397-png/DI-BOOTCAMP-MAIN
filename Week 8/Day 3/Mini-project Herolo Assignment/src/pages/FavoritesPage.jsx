import { useState } from 'react'
import WeatherDetails from '../components/WeatherDetails.jsx'
import { useFavorites, placeKey } from '../context/FavoritesContext.jsx'

function favoriteLabel(place) {
  return [place.name, place.admin1, place.country].filter(Boolean).join(', ')
}

export default function FavoritesPage() {
  const { favorites, removeFavorite } = useFavorites()
  const [selectedPlace, setSelectedPlace] = useState(null)

  function handleRemove(place) {
    removeFavorite(place)
    if (selectedPlace && placeKey(selectedPlace) === placeKey(place)) {
      setSelectedPlace(null)
    }
  }

  return (
    <div className="favorites-page">
      <header className="page-heading">
        <p className="eyebrow">Your saved places</p>
        <h1>Favorite cities</h1>
        <p>Quickly revisit the weather in the places you care about.</p>
      </header>

      {favorites.length === 0 ? (
        <section className="welcome-panel favorites-empty">
          <div className="welcome-symbol" aria-hidden="true">☆</div>
          <h2>No favorites saved yet</h2>
          <p>Search a city on the weather page and save it here for quick access.</p>
        </section>
      ) : (
        <div className="favorites-layout">
          <section className="favorite-list" aria-label="Saved cities">
            {favorites.map((place) => (
              <div
                className={`favorite-card${selectedPlace && placeKey(selectedPlace) === placeKey(place) ? ' selected' : ''}`}
                key={placeKey(place)}
              >
                <button className="favorite-select" type="button" onClick={() => setSelectedPlace(place)}>
                  <span className="favorite-city-icon" aria-hidden="true">⌖</span>
                  <span className="favorite-city-name">{favoriteLabel(place)}</span>
                  <span className="favorite-chevron" aria-hidden="true">→</span>
                </button>
                <button
                  className="favorite-remove"
                  type="button"
                  aria-label={`Remove ${place.name} from favorites`}
                  onClick={() => handleRemove(place)}
                >
                  ×
                </button>
              </div>
            ))}
          </section>

          {selectedPlace ? (
            <WeatherDetails place={selectedPlace} />
          ) : (
            <section className="favorite-prompt">
              <div className="welcome-symbol" aria-hidden="true">☁️</div>
              <h2>Select a city</h2>
              <p>Choose a saved place to view its latest weather.</p>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
