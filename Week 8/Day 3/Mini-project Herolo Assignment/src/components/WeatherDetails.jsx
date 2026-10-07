import { useEffect, useState } from 'react'
import { describeWeatherCode, fetchWeather, formatWeekday, weatherIcon } from '../services/weather.js'

function PlaceName({ place }) {
  const region = [place.admin1, place.country].filter(Boolean).join(', ')
  return (
    <>
      <h2>{place.name}</h2>
      {region && <p className="place-region">{region}</p>}
    </>
  )
}

export default function WeatherDetails({ place }) {
  const [weather, setWeather] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    setStatus('loading')
    setError('')
    setWeather(null)

    fetchWeather(place, controller.signal)
      .then((data) => {
        setWeather(data)
        setStatus('success')
      })
      .catch((fetchError) => {
        if (fetchError.name === 'AbortError') return
        console.error('Could not fetch weather:', fetchError)
        setError(fetchError.message || 'Could not load weather data.')
        setStatus('error')
      })

    return () => controller.abort()
  }, [place])

  return (
    <section className="weather-result" aria-label={`Weather for ${place.name}`}>
      {status === 'loading' && (
        <div className="loading-state" role="status">
          <span className="spinner-border spinner-border-sm" aria-hidden="true" />
          <span>Loading weather…</span>
        </div>
      )}
      {status === 'error' && <div className="alert alert-danger mb-0" role="alert">{error}</div>}
      {status === 'success' && weather && (
        <>
          <div className="current-weather">
            <div className="current-copy">
              <PlaceName place={place} />
              <p className="weather-description">
                {describeWeatherCode(weather.current.weather_code)}
              </p>
              <p className="feels-like">Feels like {Math.round(weather.current.apparent_temperature)}°</p>
            </div>
            <div className="current-temperature">
              <span className="current-icon" aria-hidden="true">
                {weatherIcon(weather.current.weather_code, weather.current.is_day === 1)}
              </span>
              <span className="temperature">{Math.round(weather.current.temperature_2m)}°</span>
              <span className="unit">C</span>
            </div>
          </div>

          <div className="weather-stats">
            <div><span>Humidity</span><strong>{weather.current.relative_humidity_2m}%</strong></div>
            <div><span>Wind</span><strong>{Math.round(weather.current.wind_speed_10m)} km/h</strong></div>
            <div><span>Precipitation</span><strong>{weather.current.precipitation} mm</strong></div>
          </div>

          <div className="forecast">
            <h3>5-day forecast</h3>
            <div className="forecast-list">
              {weather.daily.time.map((day, index) => (
                <div className="forecast-day" key={day}>
                  <span className="forecast-weekday">{index === 0 ? 'Today' : formatWeekday(day)}</span>
                  <span className="forecast-icon" aria-hidden="true">
                    {weatherIcon(weather.daily.weather_code[index])}
                  </span>
                  <span className="forecast-condition">
                    {describeWeatherCode(weather.daily.weather_code[index])}
                  </span>
                  <span className="forecast-temperatures">
                    {Math.round(weather.daily.temperature_2m_max[index])}°
                    <span>{Math.round(weather.daily.temperature_2m_min[index])}°</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <p className="updated-note">Temperatures are shown in °C · Local time {weather.current.time.replace('T', ' ')}</p>
        </>
      )}
    </section>
  )
}
