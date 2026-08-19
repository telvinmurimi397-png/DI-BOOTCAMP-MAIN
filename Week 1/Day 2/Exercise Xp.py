# Exercise 1: Favorite Numbers

# Python
my_fav_numbers = {7, 13, 21}

# Add two new numbers
my_fav_numbers.add(42)
last_added = 99
my_fav_numbers.add(last_added)

# Remove the last added number
my_fav_numbers.remove(last_added)

friend_fav_numbers = {3, 13, 27, 42}

# Concatenate sets using union
our_fav_numbers = my_fav_numbers.union(friend_fav_numbers)
print(our_fav_numbers)
# Exercise 2: Tuple

# Python
my_tuple = (1, 2, 3)

# Tuples are immutable, so you cannot add elements directly using methods like append().
# Attempting to modify it raises an AttributeError or TypeError:
# my_tuple.append(4)  # AttributeError: 'tuple' object has no attribute 'append'

# To "add" items, you must create a new tuple by concatenation:
my_tuple = my_tuple + (4, 5)
print(my_tuple)
# Explanation: Tuples are immutable, so their structure cannot be modified in place.

# Exercise 3: List Manipulation

# Python
basket = ["Banana", "Apples", "Oranges", "Blueberries"]

basket.remove("Banana")
basket.remove("Blueberries")
basket.append("Kiwi")
basket.insert(0, "Apples")

apples_count = basket.count("Apples")
print(f"Apples count: {apples_count}")

basket.clear()
print("Final basket state:", basket)
# Exercise 4: Floats

# Float vs Integer: An int is a whole number, while a float can contain decimals.

# Python
sequence = [x / 2 for x in range(3, 11)]
print(sequence)
# Converts back integers where applicable:
sequence_formatted = [int(x) if x.is_integer() else x for x in sequence]
print(sequence_formatted)
# Exercise 5: For Loop

# Python
# Print numbers from 1 to 20 inclusive
for i in range(1, 21):
    print(i)

# Print numbers where the index/value is even
for i in range(1, 21):
    if i % 2 == 0:
        print(i)
# Exercise 6: While Loop

# Python
while True:
    name = input("Enter your name: ")
    if len(name) >= 3 and not any(char.isdigit() for char in name):
        print("thank you")
        break
    print("Invalid name. Must be at least 3 characters long and contain no digits.")
# Exercise 7: Favorite Fruits

# Python
user_fruits = input("Enter your favorite fruits separated by spaces: ").split()

selected_fruit = input("Enter the name of any fruit: ")

if selected_fruit in user_fruits:
    print("You chose one of your favorite fruits! Enjoy!")
else:
    print("You chose a new fruit. I hope you enjoy it!")
# Exercise 8: Pizza Toppings

# Python
toppings = []
base_price = 10.0
topping_price = 2.50

while True:
    topping = input("Enter a pizza topping (or 'quit' to finish): ").strip()
    if topping.lower() == 'quit':
        break
    toppings.append(topping)
    print(f"Adding {topping} to your pizza.")

total_cost = base_price + (len(toppings) * topping_price)

print("\n--- Order Summary ---")
print("Toppings:", ", ".join(toppings) if toppings else "None")
print(f"Total Price: ${total_cost:.2f}")

# Exercise 9: Cinemax Tickets

# Python
# Regular Ticket Pricing
ages_input = input("Enter the age of each family member separated by spaces: ").split()
ages = [int(age) for age in ages_input]

total_cost = 0
for age in ages:
    if age < 3:
        total_cost += 0
    elif 3 <= age <= 12:
        total_cost += 10
    else:
        total_cost += 15

print(f"Total ticket cost: ${total_cost}")

# Bonus: Restricted Movie (Ages 16–21)
teen_names = input("Enter attendee names separated by spaces: ").split()
allowed_attendees = []

for name in teen_names:
    age = int(input(f"Enter age for {name}: "))
    if 16 <= age <= 21:
        allowed_attendees.append(name)
    else:
        print(f"{name} is not allowed to watch this movie.")

print("Final list of attendees:", allowed_attendees)