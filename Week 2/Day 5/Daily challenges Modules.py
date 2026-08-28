import requests
import time


def webpage_load_time(url):
    start_time = time.time()

    response = requests.get(url)

    end_time = time.time()

    load_time = end_time - start_time

    return load_time


# Test the function with different websites
websites = [
    "https://www.google.com",
    "https://www.ynet.co.il",
    "https://www.imdb.com"
]

for website in websites:
    try:
        time_taken = webpage_load_time(website)
        print(f"{website} took {time_taken:.2f} seconds to respond")
    except requests.RequestException as error:
        print(f"Could not access {website}: {error}")