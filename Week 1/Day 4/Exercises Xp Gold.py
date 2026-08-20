#Exercise 1: When will I retire?

from datetime import date


def get_age(year, month, day):
    today = date.today()

    age = today.year - year
    # Subtract 1 if the birthday hasn't occurred yet this year
    if (today.month, today.day) < (month, day):
        age -= 1
    return age


def can_retire(gender, date_of_birth):
    # Parse the date string "yyyy/mm/dd"
    year, month, day = map(int, date_of_birth.split("/"))

    # Get the age using our helper function
    age = get_age(year, month, day)

    # Determine eligibility based on gender and age
    if gender.lower() == "m" and age >= 67:
        return True
    elif gender.lower() == "f" and age >= 62:
        return True
    else:
        return False


# User Interaction
user_gender = input("Enter your gender ('m' or 'f'): ")
user_dob = input("Enter your date of birth (yyyy/mm/dd): ")

if can_retire(user_gender, user_dob):
    print("You are eligible to retire!")
else:
    print("You are not eligible to retire yet.")
    
    
#Exercise 2: Sum

def sum_series(X):
    # Convert integer X to string to easily create XX, XXX, XXXX
    x_str = str(X)

    term1 = int(x_str)
    term2 = int(x_str * 2)
    term3 = int(x_str * 3)
    term4 = int(x_str * 4)

    return term1 + term2 + term3 + term4


# Example check
print(sum_series(3))  # Output: 3702


#Exercise 3: Double Dice

import random


def throw_dice():
    return random.randint(1, 6)


def throw_until_doubles():
    throws = 0
    while True:
        dice1 = throw_dice()
        dice2 = throw_dice()
        throws += 1
        if dice1 == dice2:
            break
    return throws


def main():
    # Use a list to store the number of throws for each of the 100 double attempts
    throw_counts = []

    for _ in range(100):
        throws_taken = throw_until_doubles()
        throw_counts.append(throws_taken)

    total_throws = sum(throw_counts)
    average_throws = round(total_throws / len(throw_counts), 2)

    print(f"Total throws: {total_throws}")
    print(f"Average throws to reach doubles: {average_throws}")


main()