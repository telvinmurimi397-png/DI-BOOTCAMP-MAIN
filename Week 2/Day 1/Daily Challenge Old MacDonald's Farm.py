class Farm:
    def __init__(self, farm_name):
        self.name = farm_name
        self.animals = {}

    # Step 3 & Step 8: Upgraded add_animal to support positional args, default count, and **kwargs
    def add_animal(self, animal_type=None, count=1, **kwargs):
        # Handle single positional call: add_animal('cow', 5) or add_animal('sheep')
        if animal_type:
            if animal_type in self.animals:
                self.animals[animal_type] += count
            else:
                self.animals[animal_type] = count

        # Handle keyword arguments: add_animal(cow=5, sheep=2, goat=12)
        for animal, quantity in kwargs.items():
            if animal in self.animals:
                self.animals[animal] += quantity
            else:
                self.animals[animal] = quantity

    # Step 4: Display farm information
    def get_info(self):
        info_str = f"{self.name}'s farm\n\n"
        for animal, quantity in self.animals.items():
            info_str += f"{animal:<7} : {quantity}\n"
        info_str += "\n    E-I-E-I-0!"
        return info_str

    # Step 6 (Bonus): Get sorted list of animal types
    def get_animal_types(self):
        return sorted(list(self.animals.keys()))

    # Step 7 (Bonus): Get short summary sentence
    def get_short_info(self):
        animal_types = self.get_animal_types()
        formatted_animals = []

        for animal in animal_types:
            # Add 's' pluralization if count > 1
            if self.animals[animal] > 1:
                formatted_animals.append(f"{animal}s")
            else:
                formatted_animals.append(animal)

        # Join elements with commas and 'and' for the last element
        if len(formatted_animals) > 1:
            animals_str = ", ".join(formatted_animals[:-1]) + f" and {formatted_animals[-1]}"
        elif formatted_animals:
            animals_str = formatted_animals[0]
        else:
            animals_str = "no animals"

        return f"{self.name}'s farm has {animals_str}."


# ==================== TESTING THE CODE ====================

# Step 5: Test basic functionality
macdonald = Farm("McDonald")
macdonald.add_animal('cow', 5)
macdonald.add_animal('sheep')
macdonald.add_animal('sheep')
macdonald.add_animal('goat', 12)

print(macdonald.get_info())

# Step 8 (Bonus): Test add_animal using **kwargs
macdonald.add_animal(horse=2, pig=3)

# Test bonus methods
print("\n--- Animal Types ---")
print(macdonald.get_animal_types())

print("\n--- Short Info ---")
print(macdonald.get_short_info())