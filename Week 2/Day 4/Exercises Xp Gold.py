# Exercise 1: Restaurant Menu Manager

import json
from pathlib import Path

DEFAULT_MENU = [
    {"name": "Vegetable soup", "price": 30},
    {"name": "Hamburger", "price": 44.9},
    {"name": "Milkshake", "price": 22.5},
    {"name": "Artichoke", "price": 18},
    {"name": "Beef stew", "price": 52.5},
]


class MenuManager:
    def __init__(self, filepath="restaurant_menu.json"):
        self.filepath = Path(filepath)
        if self.filepath.exists():
            try:
                with self.filepath.open("r") as file:
                    data = json.load(file)
                self.menu = data.get("items", [])
            except json.JSONDecodeError:
                self.menu = DEFAULT_MENU.copy()
        else:
            self.menu = DEFAULT_MENU.copy()

    def add_item(self, name, price):
        self.menu.append({"name": name, "price": float(price)})

    def remove_item(self, name):
        for index, item in enumerate(self.menu):
            if item["name"].lower() == name.lower():
                del self.menu[index]
                return True
        return False

    def save_to_file(self):
        with self.filepath.open("w") as file:
            json.dump({"items": self.menu}, file, indent=4)


def load_manager():
    return MenuManager()

def add_item_to_menu(manager):
    name = input("Enter item name to add: ").strip()
    try:
        price = float(input("Enter item price: ").strip())
        manager.add_item(name, price)
        print("Item was added successfully.")
    except ValueError:
        print("Error: Invalid price entered.")

def remove_item_from_menu(manager):
    name = input("Enter item name to remove: ").strip()
    if manager.remove_item(name):
        print("Item was deleted successfully.")
    else:
        print("Error: Item was not found in the menu.")

def show_restaurant_menu(manager):
    print("\n--- Restaurant Menu ---")
    for item in manager.menu:
        print(f"* {item['name']}: ${item['price']}")
    print("-" * 23)

def show_user_menu():
    manager = load_manager()
    while True:
        print("\n*** MENU OPTIONS ***")
        print("(a) Add an item")
        print("(d) Delete an item")
        print("(v) View the menu")
        print("(x) Exit")
        
        choice = input("Choose an option: ").strip().lower()

        if choice == 'a':
            add_item_to_menu(manager)
        elif choice == 'd':
            remove_item_from_menu(manager)
        elif choice == 'v':
            show_restaurant_menu(manager)
        elif choice == 'x':
            manager.save_to_file()
            print("Menu was saved successfully. Goodbye!")
            break
        else:
            print("Invalid choice. Please choose a valid option.")

if __name__ == "__main__":
    show_user_menu()
    
    
# Exercise 2: Giphy API #1
import requests

api_key = "hpvZycW22qCjn5cRM1xtWB8NKq4dQ2My"
query = "hilarious"
rating = "g"
limit = 10

def count_tall_gifs():
    url = f"https://api.giphy.com/v1/gifs/search?q={query}&rating={rating}&limit={limit}&api_key={api_key}"
    response = requests.get(url)

    if response.status_code == 200:
        data = response.json().get("data", [])
        filtered_gifs = [
            gif for gif in data
            if int(gif["images"]["original"]["height"]) > 100
        ]
        print(f"Number of GIFs with height > 100: {len(filtered_gifs)}")
        print(f"Total GIFs retrieved (limit applied): {len(data)}")
    else:
        print(f"Failed to fetch data. Status code: {response.status_code}")
    
    
# Exercise 3: Giphy API #2
import requests

API_KEY = "hpvZycW22qCjn5cRM1xtWB8NKq4dQ2My"

def fetch_gifs():
    user_term = input("Enter a search term or phrase: ").strip()
    search_url = f"https://api.giphy.com/v1/gifs/search?q={user_term}&api_key={API_KEY}"
    
    response = requests.get(search_url)
    
    if response.status_code == 200:
        results = response.json().get("data", [])
        
        # Check if term returns non-empty results
        if results and user_term:
            print(f"\nFound {len(results)} GIFs for '{user_term}':")
            for gif in results[:5]:  # Display top 5 URLs as reference
                print(f"- {gif['title']}: {gif['url']}")
        else:
            print(f"\nCould not find any GIFs for '{user_term}'. Fetching trending GIFs instead...")
            fetch_trending_gifs()
    else:
        print("An error occurred while communicating with Giphy.")

def fetch_trending_gifs():
    trending_url = f"https://api.giphy.com/v1/gifs/trending?api_key={API_KEY}"
    response = requests.get(trending_url)
    
    if response.status_code == 200:
        results = response.json().get("data", [])
        print(f"\nTop {len(results[:5])} Trending GIFs of the day:")
        for gif in results[:5]:
            print(f"- {gif['title']}: {gif['url']}")

if __name__ == "__main__":
    count_tall_gifs()
    fetch_gifs()