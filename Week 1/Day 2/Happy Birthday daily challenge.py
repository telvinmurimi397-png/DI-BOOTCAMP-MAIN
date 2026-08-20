from datetime import datetime


def is_leap_year(year):
    """Check if a given year is a leap year."""
    return (year % 4 == 0 and year % 100 != 0) or (year % 400 == 0)


def print_cake(num_candles):
    """Generate and print the birthday cake with the specified number of candles."""
    candles = "i" * num_candles
    top_layer = f"____{candles}____".center(17)

    cake = f"""
       {top_layer}
      |:H:a:p:p:y:|
    __|___________|__
   |^^^^^^^^^^^^^^^^^|
   |:B:i:r:t:h:d:a:y:|
   |                 |
   ~~~~~~~~~~~~~~~~~~~
"""
    print(cake)


def main():
    # 1. Get birthdate from user
    birthdate_str = input("Enter your birthdate (DD/MM/YYYY): ")

    try:
        birthdate = datetime.strptime(birthdate_str, "%d/%m/%Y")
    except ValueError:
        print("Invalid date format! Please use DD/MM/YYYY.")
        return

    if birthdate.date() > datetime.now().date():
        print("Birthdate cannot be in the future.")
        return

    # 2. Calculate age
    today = datetime.now()
    age = (
        today.year
        - birthdate.year
        - ((today.month, today.day) < (birthdate.month, birthdate.day))
    )

    # 3. Determine number of candles (last digit of age)
    num_candles = age % 10

    # 4. Display cake(s)
    print(f"\nYou are {age} years old!")

    # Bonus check: If born in a leap year, print two cakes
    if is_leap_year(birthdate.year):
        print("You were born in a leap year! Here are two cakes:\n")
        print_cake(num_candles)
        print_cake(num_candles)
    else:
        print_cake(num_candles)


if __name__ == "__main__":
    main()