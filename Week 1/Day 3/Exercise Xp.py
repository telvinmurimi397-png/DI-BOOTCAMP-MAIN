#Exercise 1: Converting Lists into Dictionaries

keys = ['Ten', 'Twenty', 'Thirty']
values = [10, 20, 30]

# Using zip and dict constructor
result = dict(zip(keys, values))
print(result)


#Exercise 2: Cinemax #2

family = {"rick": 43, 'beth': 13, 'morty': 5, 'summer': 8}
total_cost = 0

for name, age in family.items():
    if age < 3:
        price = 0
    elif 3 <= age <= 12:
        price = 10
    else:
        price = 15
        
    print(f"{name.capitalize()} owes ${price} for the ticket.")
    total_cost += price

print(f"\nTotal cost for the family: ${total_cost}")

# Bonus: User Input
user_family = {}
while True:
    name = input("\nEnter family member's name (or 'done' to calculate): ").strip()
    if name.lower() == 'done':
        break
    age = int(input(f"Enter age for {name}: "))
    user_family[name] = age

user_total = 0
for name, age in user_family.items():
    price = 0 if age < 3 else (10 if 3 <= age <= 12 else 15)
    user_total += price

print(f"Total ticket cost for custom family: ${user_total}")


#Exercise 3: Zara

# 1. Create the dictionary
brand = {
    "name": "Zara",
    "creation_date": 1975,
    "creator_name": "Amancio Ortega Gaona",
    "type_of_clothes": ["men", "women", "children", "home"],
    "international_competitors": ["Gap", "H&M", "Benetton"],
    "number_stores": 7000,
    "major_color": {
        "France": "blue",
        "Spain": "red",
        "US": ["pink", "green"]
    }
}

# 2. Modify number_stores
brand["number_stores"] = 2

# 3. Print clients description
clothes = ", ".join(brand["type_of_clothes"])
print(f"Zara's clients look for clothing for {clothes}.")

# 4. Add country_creation
brand["country_creation"] = "Spain"

# 5. Add Desigual if international_competitors exists
if "international_competitors" in brand:
    brand["international_competitors"].append("Desigual")

# 6. Delete creation_date key
brand.pop("creation_date")

# 7. Print last international competitor
print("Last competitor:", brand["international_competitors"][-1])

# 8. Print major colors in the US
print("US major colors:", brand["major_color"]["US"])

# 9. Print number of keys
print("Number of keys:", len(brand))

# 10. Print all keys
print("All keys:", list(brand.keys()))

# Bonus: Merge dictionaries
more_on_zara = {
    "creation_date": 1975,
    "number_stores": 10000
}
brand.update(more_on_zara)
print("\nMerged brand dictionary:", brand)


#Exercise 4: Disney Characters

Python
users = ["Mickey", "Minnie", "Donald", "Ariel", "Pluto"]

# 1. Character to index mapping
dict1 = {user: i for i, user in enumerate(users)}
print("1.", dict1)

# 2. Index to character mapping
dict2 = {i: user for i, user in enumerate(users)}
print("2.", dict2)

# 3. Alphabetically sorted mapped to index
dict3 = {user: i for i, user in enumerate(sorted(users))}
print("3.", dict3)