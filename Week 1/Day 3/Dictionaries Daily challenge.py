#Challenge 1: Letter Index Dictionary

def letter_index_dictionary():
    # 1. User Input
    word = input("Enter a word: ")

    # 2. Creating the Dictionary
    letter_indices = {}

    for index, letter in enumerate(word):
        if letter in letter_indices:
            letter_indices[letter].append(index)
        else:
            letter_indices[letter] = [index]

    # 3. Output
    return letter_indices


#Challenge 2: Affordable Items

def get_affordable_items(items_purchase, wallet):
    # Data Cleaning: Helper function to convert price strings to integers
    def clean_price(price_str):
        return int(price_str.replace("$", "").replace(",", ""))

    # Clean wallet balance
    money = clean_price(wallet)

    basket = []

    # Iterate through items in priority order
    for item, price_str in items_purchase.items():
        price = clean_price(price_str)
        if money >= price:
            basket.append(item)
            money -= price

    # Output result
    if not basket:
        return "Nothing"
    else:
        return sorted(basket)


# --- Example Test Cases ---

# Example 1
items_purchase_1 = {
    "Water": "$1",
    "Bread": "$3",
    "TV": "$1,000",
    "Fertilizer": "$20",
}
wallet_1 = "$300"

# Example 2
items_purchase_2 = {
    "Apple": "$4",
    "Honey": "$3",
    "Fan": "$14",
    "Bananas": "$4",
    "Pan": "$100",
    "Spoon": "$2",
}
wallet_2 = "$100"

# Example 3
items_purchase_3 = {
    "Phone": "$999",
    "Speakers": "$300",
    "Laptop": "$5,000",
    "PC": "$1200",
}
wallet_3 = "$1"


if __name__ == "__main__":
    # Run challenge 2 by default so the script does not stop on challenge 1 input.
    print(get_affordable_items(items_purchase_1, wallet_1))
    print(get_affordable_items(items_purchase_2, wallet_2))
    print(get_affordable_items(items_purchase_3, wallet_3))