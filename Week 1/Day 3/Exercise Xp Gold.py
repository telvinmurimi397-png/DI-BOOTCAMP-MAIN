#Exercise 1: Birthday Look-up

birthdays = {
    "Alice": "1995/04/12",
    "Bob": "1988/11/23",
    "Charlie": "2001/01/15",
    "Diana": "1999/08/30",
    "Ethan": "1992/06/05"
}

print("Welcome to the Birthday Look-up App!")
print("You can look up the birthdays of the people in the list!")

name = input("Enter a person's name: ").strip()
birthday = birthdays.get(name)

print(f"{name}'s birthday is on {birthday}.")


#Exercise 2: Birthdays Advanced

birthdays = {
    "Alice": "1995/04/12",
    "Bob": "1988/11/23",
    "Charlie": "2001/01/15",
    "Diana": "1999/08/30",
    "Ethan": "1992/06/05"
}

print("Welcome! Here are the people in our list:")
for person in birthdays.keys():
    print(f"- {person}")

name = input("\nEnter a person's name to look up their birthday: ").strip()

if name in birthdays:
    print(f"{name}'s birthday is on {birthdays[name]}.")
else:
    print(f"Sorry, we don't have the birthday information for {name}.")
    
    
#Exercise 3: Add Your Own Birthday

birthdays = {
    "Alice": "1995/04/12",
    "Bob": "1988/11/23",
    "Charlie": "2001/01/15",
    "Diana": "1999/08/30",
    "Ethan": "1992/06/05"
}

# Add a new birthday entry
new_name = input("Add a person's name: ").strip()
new_bday = input("Add their birthday (YYYY/MM/DD): ").strip()
birthdays[new_name] = new_bday

# Display all names
print("\nAvailable names:")
for person in birthdays.keys():
    print(f"- {person}")

# Look up a name
search_name = input("\nEnter a person's name to look up: ").strip()

if search_name in birthdays:
    print(f"{search_name}'s birthday is on {birthdays[search_name]}.")
else:
    print(f"Sorry, we don't have the birthday information for {search_name}.")
    
    
#Exercise 4: Fruit Shop

# Part 1: Items and Prices
items = {
    "banana": 4,
    "apple": 2,
    "orange": 1.5,
    "pear": 3
}

for fruit, price in items.items():
    print(f"A {fruit} costs ${price}.")

# Part 2: Total Stock Value Calculation
items_stock = {
    "banana": {"price": 4, "stock": 10},
    "apple": {"price": 2, "stock": 5},
    "orange": {"price": 1.5, "stock": 24},
    "pear": {"price": 3, "stock": 1}
}

total_cost = 0
for details in items_stock.values():
    total_cost += details["price"] * details["stock"]

print(f"\nTotal cost to buy everything in stock: ${total_cost}")