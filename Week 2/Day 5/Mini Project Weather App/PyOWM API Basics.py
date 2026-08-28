from datetime import datetime
import requests
from pyowm import OWM

API_KEY = "YOUR_API_KEY"
owm = OWM(API_KEY)
mgr = owm.weather_manager()


def print_weather_details(city_name):
    # 1. Get current weather
    observation = mgr.weather_at_place(city_name)
    weather = observation.weather

    # 2. Get wind info
    wind = weather.wind()  # Returns dict e.g., {'speed': 4.1, 'deg': 80}

    # 3. Get sunrise and sunset times (convert timestamp to readable string)
    sunrise = datetime.fromtimestamp(weather.sunrise_time()).strftime(
        "%H:%M:%S"
    )
    sunset = datetime.fromtimestamp(weather.sunset_time()).strftime("%H:%M:%S")

    # 4. Display in a user-friendly way
    print(f"=== Weather in {city_name} ===")
    print(f"Status: {weather.detailed_status}")
    print(f"Temperature: {weather.temperature('celsius')['temp']}°C")
    print(f"Wind Speed: {wind['speed']} m/s (Direction: {wind.get('deg', 'N/A')}°)")
    print(f"Sunrise: {sunrise} | Sunset: {sunset}\n")


# Steps 1–4 for Paris
print_weather_details("Paris, FR")

# Step 5: User input + City ID lookup
user_city = input("Enter a city name: ")
reg = owm.city_id_registry()
list_of_locations = reg.locations_for(user_city)

if list_of_locations:
    city_id = list_of_locations[0].id
    obs_by_id = mgr.weather_at_id(city_id)
    print(
        f"\nRetrieved by ID ({city_id}): {obs_by_id.weather.detailed_status}"
    )
else:
    print("City not found.")

# Step 6: 5-day forecast at 3h intervals
forecast_3h = mgr.forecast_at_place("Los Angeles, US", "3h")
print("\n=== Forecast for Los Angeles (Next 3 Entries) ===")
for weather in forecast_3h.forecast.weathers[:3]:
    print(
        f"Time: {weather.reference_time('iso')} - Temp: {weather.temperature('celsius')['temp']}°C"
    )


# Step 7: Air Pollution API (Direct HTTP Request)
def get_air_pollution(lat, lon):
    url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={API_KEY}"
    res = requests.get(url).json()
    aqi = res["list"][0]["main"]["aqi"]
    print(f"\nAir Quality Index (AQI) for ({lat}, {lon}): {aqi}")


get_air_pollution(48.8566, 2.3522)  # Paris coordinates