import { createContext, useContext, useEffect, useState } from 'react'

const FavoritesContext = createContext(null)
const STORAGE_KEY = 'herolo-weather-favorites'

function loadFavorites() {
  try {
    const storedValue = localStorage.getItem(STORAGE_KEY)
    if (!storedValue) return { favorites: [], error: '' }

    const parsed = JSON.parse(storedValue)
    if (!Array.isArray(parsed)) throw new Error('Saved favorites are not a list.')

    const favorites = parsed.filter((place) =>
      place &&
      typeof place.name === 'string' &&
      Number.isFinite(place.latitude) &&
      Number.isFinite(place.longitude),
    )
    return { favorites, error: '' }
  } catch (error) {
    console.error('Could not load saved weather favorites:', error)
    return { favorites: [], error: 'Saved favorites could not be read from this browser.' }
  }
}

export function placeKey(place) {
  return `${place.latitude.toFixed(3)},${place.longitude.toFixed(3)}`
}

export function FavoritesProvider({ children }) {
  const [initialState] = useState(loadFavorites)
  const [favorites, setFavorites] = useState(initialState.favorites)
  const [storageError, setStorageError] = useState(initialState.error)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
      setStorageError('')
    } catch (error) {
      console.error('Could not save weather favorites:', error)
      setStorageError('Favorites could not be saved in this browser.')
    }
  }, [favorites])

  function toggleFavorite(place) {
    const key = placeKey(place)
    setFavorites((currentFavorites) =>
      currentFavorites.some((favorite) => placeKey(favorite) === key)
        ? currentFavorites.filter((favorite) => placeKey(favorite) !== key)
        : [place, ...currentFavorites],
    )
  }

  function removeFavorite(place) {
    const key = placeKey(place)
    setFavorites((currentFavorites) =>
      currentFavorites.filter((favorite) => placeKey(favorite) !== key),
    )
  }

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, removeFavorite, storageError }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (context === null) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}
