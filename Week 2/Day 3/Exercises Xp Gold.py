# Exercise 1: Upcoming Holiday
import random
import re
import string
from datetime import date, datetime


try:
    import holidays
except ImportError:
    holidays = None


def _fallback_us_holidays(years):
    """Return a small dictionary of common US public holidays for the provided years."""
    holiday_map = {}
    for year in years:
        fixed_holidays = {
            date(year, 1, 1): "New Year's Day",
            date(year, 7, 4): "Independence Day",
            date(year, 11, 11): "Veterans Day",
            date(year, 12, 25): "Christmas Day",
        }
        # Add a few common floating holidays.
        holiday_map.update(fixed_holidays)
        holiday_map[date(year, 1, 15)] = "Martin Luther King Jr. Day"
        holiday_map[date(year, 2, 19)] = "Presidents' Day"
        holiday_map[date(year, 5, 27)] = "Memorial Day"
        holiday_map[date(year, 9, 2)] = "Labor Day"
        holiday_map[date(year, 11, 28)] = "Thanksgiving Day"
    return holiday_map


def upcoming_holiday(country_code="US"):
    today = datetime.now()
    print(f"Today's date: {today.strftime('%Y-%m-%d %H:%M:%S')}")

    if holidays is not None:
        country_holidays = holidays.country_holidays(country_code, years=[today.year, today.year + 1])
    else:
        country_holidays = _fallback_us_holidays([today.year, today.year + 1])

    future_holidays = [(holiday_date, name) for holiday_date, name in country_holidays.items() if holiday_date >= today.date()]
    if future_holidays:
        next_date, name = sorted(future_holidays)[0]
        days_left = (next_date - today.date()).days
        print(f"The next holiday is {name} in {days_left} days.")
    else:
        print("No upcoming holidays found.")


# Exercise 2: How Old Are You On Jupiter?
def calculate_age_on_planets(seconds):
    earth_year_seconds = 31557600

    orbital_periods = {
        "Earth": 1.0,
        "Mercury": 0.2408467,
        "Venus": 0.61519726,
        "Mars": 1.8808158,
        "Jupiter": 11.862615,
        "Saturn": 29.447498,
        "Uranus": 84.016846,
        "Neptune": 164.79132,
    }

    earth_years = seconds / earth_year_seconds

    for planet, period in orbital_periods.items():
        planet_age = earth_years / period
        print(f"{planet}: {planet_age:.2f} years old")


# Exercise 3: Regular Expression #1
def return_numbers(text):
    numbers = re.findall(r"\d", text)
    return "".join(numbers)


# Exercise 4: Regular Expression #2
def validate_name():
    name = input("Please enter your full name (e.g., John Doe): ")
    pattern = r"^[A-Z][a-zA-Z]*\s[A-Z][a-zA-Z]*$"

    if re.match(pattern, name):
        print("Valid name!")
    else:
        print("Invalid name. Must consist of First Name and Last Name with proper capitalization.")


# Exercise 5: Password Generator
def generate_password(length):
    digits = string.digits
    lowercase = string.ascii_lowercase
    uppercase = string.ascii_uppercase
    special = "!@#$%^&*_-"
    all_chars = digits + lowercase + uppercase + special

    password_chars = [
        random.choice(digits),
        random.choice(lowercase),
        random.choice(uppercase),
        random.choice(special),
    ]

    password_chars += [random.choice(all_chars) for _ in range(length - 4)]
    random.shuffle(password_chars)
    return "".join(password_chars)


def test_password(password, expected_length):
    if len(password) != expected_length:
        return False
    if not re.search(r"\d", password):
        return False
    if not re.search(r"[a-z]", password):
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"[!@#$%^&*_\-]", password):
        return False
    return True


def run_tests():
    for _ in range(100):
        length = random.randint(6, 30)
        password = generate_password(length)
        assert test_password(password, length), f"Test failed for password: {password}"
    print("All 100 password generation tests passed successfully!")


def main():
    # Demo Exercise 1
    upcoming_holiday()
    print()

    # Demo Exercise 2
    calculate_age_on_planets(1000000000)
    print()

    # Demo Exercise 3
    print(return_numbers("k5k3q2g5z6x9bn"))
    print()

    # Demo Exercise 4
    validate_name()
    print()

    # Demo Exercise 5
    run_tests()

    while True:
        try:
            length = int(input("Enter password length (between 6 and 30): "))
            if 6 <= length <= 30:
                break
            print("Length must be between 6 and 30.")
        except ValueError:
            print("Please enter a valid number.")

    password = generate_password(length)
    print(f"\nGenerated Password: {password}")
    print("⚠️  Make sure to store your password in a safe place!")


if __name__ == "__main__":
    main()