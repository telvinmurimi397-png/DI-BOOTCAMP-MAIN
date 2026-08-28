#Exercise 1: Restaurant Menu Manager - Regular Expressions

import json
import re

def display_heart():
    """Displays an ASCII heart made of stars (*)."""
    heart = [
        "  ***   ***  ",
        " ***** ***** ",
        "*************",
        " *********** ",
        "  *********  ",
        "   *******   ",
        "    *****    ",
        "     ***     ",
        "      *      "
    ]
    print("\n".join(heart))

def validate_item_name(name):
    """Validates the item name according to rule requirements:
    1. First word starts with 'V'.
    2. Connection words (e.g. of, and, the, in, to) are lowercase.
    3. Other main words are Capitalized.
    4. At least two 'e' characters, and no numbers.
    """
    # Check for numbers
    if re.search(r'\d', name):
        return False
    
    # Check for at least two 'e's (case-insensitive)
    if len(re.findall(r'e', name, re.IGNORECASE)) < 2:
        return False
        
    connection_words = {"of", "and", "the", "in", "to", "for", "a", "an", "with", "on"}
    
    # Match words and hyphens
    words = re.findall(r'[A-Za-z]+', name)
    if not words:
        return False
        
    # Check first word starts with capital 'V'
    if not words[0].startswith('V'):
        return False

    # Validate capitalization rules for each word
    for word in words:
        if word in connection_words:
            if not word.islower():
                return False
        else:
            if not word[0].isupper():
                return False
                
    return True

def validate_price(price):
    """Validates price matching pattern XX,14 where X are digits."""
    return bool(re.fullmatch(r'\d{2},14', price))

def add_menu_item(json_file="menu.json"):
    # Read existing menu or create default structure
    try:
        with open(json_file, "r") as f:
            data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        data = {"valentine_items": []}
        
    if "valentine_items" not in data:
        data["valentine_items"] = []

    print("--- Add Valentine's Special Item ---")
    item_name = input("Enter item name (e.g., Vegetable Soup of Valentines-day): ").strip()
    price = input("Enter price (Format XX,14): ").strip()

    if not validate_item_name(item_name):
        print("\nInvalid Item Name! Must start with 'V', capitalize words (except connection words), contain no numbers, and have at least 2 'e's.")
        return

    if not validate_price(price):
        print("\nInvalid Price! Must follow the format XX,14 (e.g., 25,14).")
        return

    data["valentine_items"].append({"name": item_name, "price": price})
    
    with open(json_file, "w") as f:
        json.dump(data, f, indent=4)

    print("\nItem added successfully!")
    print("\n--- Valentine Menu ---")
    display_heart()
    for item in data["valentine_items"]:
        print(f"* {item['name']} - ${item['price']}")

if __name__ == "__main__":
    add_menu_item()
#Exercise 2: Dungeons & Dragons Character Generator

import random
import json

class Character:
    def __init__(self, name, age):
        self.name = name
        self.age = age
        self.stats = {
            "Strength": self._roll_ability_score(),
            "Dexterity": self._roll_ability_score(),
            "Constitution": self._roll_ability_score(),
            "Intelligence": self._roll_ability_score(),
            "Wisdom": self._roll_ability_score(),
            "Charisma": self._roll_ability_score()
        }

    @staticmethod
    def _roll_ability_score():
        """Rolls 4 six-sided dice, drops the lowest, and returns the sum of the remaining 3."""
        rolls = [random.randint(1, 6) for _ in range(4)]
        rolls.sort()
        return sum(rolls[1:])

    def to_dict(self):
        """Converts character object to dictionary for JSON output."""
        return {
            "name": self.name,
            "age": self.age,
            "stats": self.stats
        }

class Game:
    def __init__(self):
        self.characters = []

    def setup_game(self):
        try:
            num_players = int(input("How many players are playing? "))
        except ValueError:
            print("Invalid input, defaulting to 1 player.")
            num_players = 1

        for i in range(num_players):
            print(f"\n--- Player {i + 1} Character Creation ---")
            name = input("Enter character name: ").strip()
            age = input("Enter character age: ").strip()
            char = Character(name, age)
            self.characters.append(char)

    def export_to_txt(self, filename="characters.txt"):
        with open(filename, "w") as f:
            f.write("=== D&D PARTY CHARACTERS ===\n\n")
            for char in self.characters:
                f.write(f"Name: {char.name} | Age: {char.age}\n")
                f.write("Stats:\n")
                for stat, value in char.stats.items():
                    f.write(f"  - {stat}: {value}\n")
                f.write("-" * 30 + "\n")
        print(f"Exported characters to {filename}")

    def export_to_json(self, filename="characters.json"):
        data = [char.to_dict() for char in self.characters]
        with open(filename, "w") as f:
            json.dump(data, f, indent=4)
        print(f"Exported characters to {filename}")

    def start(self):
        self.setup_game()
        self.export_to_txt()
        self.export_to_json()

if __name__ == "__main__":
    game = Game()
    game.start()