#Exercise 1: What Are You Learning?

def display_message():
    print("I am learning about functions in Python.")

display_message()


#Exercise 2: What’s Your Favorite Book?

def favorite_book(title):
    print(f"One of my favorite books is {title}")

favorite_book("Alice in Wonderland")


#Exercise 3: Some Geography

def describe_city(city, country="Unknown"):
    print(f"{city} is in {country}.")

describe_city("Reykjavik", "Iceland")
describe_city("Paris")


#Exercise 4: Random

import random

def check_random_number(user_number):
    random_num = random.randint(1, 100)
    if user_number == random_num:
        print("Success!")
    else:
        print(f"Fail! Your number: {user_number}, Random number: {random_num}")

check_random_number(50)


#Exercise 5: Let’s Create Some Personalized Shirts!

def make_shirt(size="large", text="I love Python"):
    print(f"The size of the shirt is {size} and the text is {text}.")

# Large shirt with default message
make_shirt()

# Medium shirt with default message
make_shirt(size="medium")

# Shirt of any size with a custom message
make_shirt("small", "Custom message")

# Bonus: Keyword arguments
make_shirt(text="Hello!", size="small")


#Exercise 6: Magicians…

magician_names = ['Harry Houdini', 'David Blaine', 'Criss Angel']

def show_magicians(magicians):
    for name in magicians:
        print(name)

def make_great(magicians):
    for i in range(len(magicians)):
        magicians[i] = f"{magicians[i]} the Great"

make_great(magician_names)
show_magicians(magician_names)


#Exercise 7: Temperature Advice

import random

# Step 1 & 4 (Bonus): Floating-point & Season-based temperature generation
def get_random_temp(season=None):
    if season == "winter":
        return round(random.uniform(-10, 8), 1)
    elif season == "spring":
        return round(random.uniform(9, 20), 1)
    elif season == "summer":
        return round(random.uniform(21, 40), 1)
    elif season == "autumn":
        return round(random.uniform(5, 18), 1)
    
    return round(random.uniform(-10, 40), 1)

# Step 2, 3 & 5 (Bonus): Main function with month and season handling
def main():
    try:
        month = int(input("Enter the month number (1-12): "))
    except ValueError:
        month = None

    season = None
    if month in [12, 1, 2]:
        season = "winter"
    elif month in [3, 4, 5]:
        season = "spring"
    elif month in [6, 7, 8]:
        season = "summer"
    elif month in [9, 10, 11]:
        season = "autumn"

    temp = get_random_temp(season)
    print(f"The temperature right now is {temp} degrees Celsius.")

    if temp < 0:
        print("Brrr, that’s freezing! Wear some extra layers today.")
    elif 0 <= temp <= 16:
        print("Quite chilly! Don’t forget your coat.")
    elif 16 < temp <= 23:
        print("Nice weather.")
    elif 23 < temp <= 32:
        print("A bit warm, stay hydrated.")
    elif 32 < temp <= 40:
        print("It’s really hot! Stay cool.")

main()