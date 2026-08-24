# Exercise 1: Geometry
import math

class Circle:
    def __init__(self, radius=1.0):
        self.radius = radius

    def perimeter(self):
        return 2 * math.pi * self.radius

    def area(self):
        return math.pi * (self.radius ** 2)

    def definition(self):
        print("A circle is a 2D shape consisting of all points in a plane that are at a given distance (radius) from a central point.")

# Example Usage:
c = Circle(5.0)
print(f"Perimeter: {c.perimeter():.2f}")
print(f"Area: {c.area():.2f}")
c.definition()


# Exercise 2: Custom List Class
import random

class MyList:
    def __init__(self, letter_list):
        self.letters = letter_list

    def reversed_list(self):
        return list(reversed(self.letters))

    def sorted_list(self):
        return sorted(self.letters)

    # Bonus method using list comprehension
    def generate_random_numbers(self, min_val=1, max_val=100):
        return [random.randint(min_val, max_val) for _ in range(len(self.letters))]

# Example Usage:
my_list = MyList(['d', 'a', 'c', 'b'])
print("Reversed:", my_list.reversed_list())
print("Sorted:", my_list.sorted_list())
print("Random numbers (bonus):", my_list.generate_random_numbers())


# Exercise 3: Restaurant Menu Manager (menu_manager.py)
class MenuManager:
    def __init__(self):
        self.menu = [
            {"name": "Soup", "price": 10, "spice": "B", "gluten": False},
            {"name": "Hamburger", "price": 15, "spice": "A", "gluten": True},
            {"name": "Salad", "price": 18, "spice": "A", "gluten": False},
            {"name": "French Fries", "price": 5, "spice": "C", "gluten": False},
            {"name": "Beef bourguignon", "price": 25, "spice": "B", "gluten": True}
        ]

    def add_item(self, name, price, spice, gluten):
        new_dish = {
            "name": name,
            "price": price,
            "spice": spice,
            "gluten": gluten
        }
        self.menu.append(new_dish)
        print(f"Added {name} to the menu.")

    def update_item(self, name, price, spice, gluten):
        for dish in self.menu:
            if dish["name"].lower() == name.lower():
                dish["price"] = price
                dish["spice"] = spice
                dish["gluten"] = gluten
                print(f"Updated {name} in the menu.")
                return
        print(f"Error: '{name}' is not in the menu.")

    def remove_item(self, name):
        for dish in self.menu:
            if dish["name"].lower() == name.lower():
                self.menu.remove(dish)
                print(f"Removed '{name}'. Updated menu:")
                print(self.menu)
                return
        print(f"Error: '{name}' is not in the menu.")

