import datetime
import matplotlib.pyplot as plt
from pyowm import OWM
import pytz

API_KEY = "66fc4498eb8cc8e72246dc479baeea0e"


def init_plot():
    """Initializes figure, title, and label formatting."""
    plt.figure(figsize=(6, 6))
    plt.title("Humidity Forecast", fontsize=14, pad=10)
    plt.ylabel("Humidity (%)", fontsize=11)
    plt.ylim(0, 105)  # Scale up to 105 to give space above bars
    plt.xlabel("Day", fontsize=11)


def plot_temperatures(days, humidity_values):
    """Plots the blue bar chart matching the required visual layout."""
    bars = plt.bar(days, humidity_values, color="#1f77b4", width=0.7)
    plt.tick_params(direction="in", length=5)
    return bars


def write_humidity_on_bar_chart(bars):
    """Writes the % humidity centered inside/on top of each bar."""
    for bar in bars:
        height = bar.get_height()
        plt.text(
            bar.get_x() + bar.get_width() / 2.0,
            height - 8,  # Slightly below top edge of bar
            f"{int(height)}%",
            ha="center",
            va="bottom",
            color="white",
            fontsize=10,
            weight="bold",
        )


def main():
    owm = OWM(API_KEY)
    mgr = owm.weather_manager()

    # Retrieve forecast for Paris (or any city)
    forecast = mgr.forecast_at_place("Paris, FR", "3h").forecast

    # Aggregate average humidity for 3 distinct consecutive days
    daily_humidity = {}
    tz = pytz.timezone("UTC")

    for w in forecast.weathers:
        dt = datetime.datetime.fromtimestamp(w.reference_time(), tz=tz)
        date_str = dt.strftime("%m/%d")
        if date_str not in daily_humidity:
            daily_humidity[date_str] = []
        daily_humidity[date_str].append(w.humidity)

    # Take first 3 days
    days = list(daily_humidity.keys())[:3]
    humidity_avg = [
        sum(daily_humidity[d]) / len(daily_humidity[d]) for d in days
    ]

    # Generate Chart
    init_plot()
    bars = plot_temperatures(days, humidity_avg)
    write_humidity_on_bar_chart(bars)

    # Set window title via backend manager
    fig = plt.gcf()
    fig.canvas.manager.set_window_title("PyOWM Weather")

    plt.tight_layout()
    plt.show()


if __name__ == "__main__":
    main()