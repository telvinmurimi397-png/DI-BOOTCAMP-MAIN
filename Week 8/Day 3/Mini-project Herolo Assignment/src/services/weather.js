const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'

export async function searchCities(query, signal) {
  const url = new URL(GEOCODING_URL)
  url.search = new URLSearchParams({
    name: query,
    count: '6',
    language: 'en',
    format: 'json',
  })

  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error('City search is unavailable right now.')

  const data = await response.json()
  return data.results ?? []
}

export async function fetchWeather(place, signal) {
  const url = new URL(FORECAST_URL)
  url.search = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset',
    timezone: 'auto',
    forecast_days: '5',
  })

  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error('Weather data is unavailable right now.')

  return response.json()
}

export function describeWeatherCode(code) {
  if (code === 0) return 'Clear sky'
  if ([1, 2, 3].includes(code)) return ['Mainly clear', 'Partly cloudy', 'Overcast'][code - 1]
  if ([45, 48].includes(code)) return 'Fog'
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle'
  if ([61, 63, 65, 66, 67].includes(code)) return 'Rain'
  if ([71, 73, 75, 77].includes(code)) return 'Snow'
  if ([80, 81, 82].includes(code)) return 'Rain showers'
  if ([85, 86].includes(code)) return 'Snow showers'
  if ([95, 96, 99].includes(code)) return 'Thunderstorm'
  return 'Weather conditions'
}

export function weatherIcon(code, isDay = true) {
  if (code === 0) return isDay ? '☀️' : '🌙'
  if ([1, 2].includes(code)) return isDay ? '🌤️' : '☁️'
  if ([3, 45, 48].includes(code)) return '☁️'
  if ([71, 73, 75, 77, 85, 86].includes(code)) return '❄️'
  if ([95, 96, 99].includes(code)) return '⛈️'
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return '🌧️'
  return '🌡️'
}

export function formatWeekday(date) {
  return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(new Date(`${date}T12:00:00`))
}
