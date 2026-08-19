# 1. Base String
cars_str = "Volkswagen, Toyota, Ford Motor, Honda, Chevrolet"

# 2. Convert to list
manufacturers = [brand.strip() for brand in cars_str.split(",")]

# 3. Print count
print(f"There are {len(manufacturers)} manufacturers in the list.")

# 4. Print in reverse/descending order (Z-A)
descending_list = sorted(manufacturers, reverse=True)
print("Descending order (Z-A):", descending_list)

# 5a. Count manufacturers with the letter 'o'
with_o = [m for m in manufacturers if 'o' in m.lower()]
print(f"Manufacturers with 'o': {len(with_o)}")

# 5b. Count manufacturers without the letter 'i'
without_i = [m for m in manufacturers if 'i' not in m.lower()]
print(f"Manufacturers without 'i': {len(without_i)}")


# --- Bonus 1: Remove Duplicates ---
duplicates_list = ["Honda", "Volkswagen", "Toyota", "Ford Motor", "Honda", "Chevrolet", "Toyota"]

# Remove duplicates while maintaining clean list using set
unique_list = list(set(duplicates_list))

# Format output as comma-separated string
formatted_str = ", ".join(unique_list)
print("\nUnique companies:", formatted_str)
print(f"There are now {len(unique_list)} companies in the list.")


# --- Bonus 2: Reverse Letters in Ascending Order ---
# Sort list alphabetically (A-Z) and reverse characters of each name
ascending_reversed_names = [brand[::-1] for brand in sorted(manufacturers)]
print("Ascending order with reversed letters:", ascending_reversed_names)