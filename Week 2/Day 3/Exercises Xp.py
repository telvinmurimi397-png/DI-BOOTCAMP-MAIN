# Exercise 1: Currencies


class Currency:
    def __init__(self, currency, amount):
        self.currency = currency
        self.amount = amount

    def __str__(self):
        return f"{self.amount} {self.currency}s" if self.amount != 1 else f"{self.amount} {self.currency}"

    def __repr__(self):
        return self.__str__()

    def __int__(self):
        return self.amount

    def __add__(self, other):
        if isinstance(other, Currency):
            if self.currency != other.currency:
                raise TypeError(f"Cannot add between Currency type <{self.currency}> and <{other.currency}>")
            return self.amount + other.amount
        elif isinstance(other, (int, float)):
            return self.amount + other
        return NotImplemented

    def __iadd__(self, other):
        if isinstance(other, Currency):
            if self.currency != other.currency:
                raise TypeError(f"Cannot add between Currency type <{self.currency}> and <{other.currency}>")
            self.amount += other.amount
        elif isinstance(other, (int, float)):
            self.amount += other
        else:
            return NotImplemented
        return self


# Exercise 1 demo
c1 = Currency("dollar", 5)
c2 = Currency("dollar", 10)
print(c1)
print(repr(c1))
print(int(c1))
print(c1 + c2)
print(c1 + 3)
c1 += 2
print(c1)


# Exercise 2: Import

def add_numbers(a, b):
    print(a + b)


try:
    from func import add_numbers as imported_add_numbers
    imported_add_numbers(10, 20)
except ModuleNotFoundError:
    print("Exercise 2: module 'func.py' not found. Using local function instead.")
    add_numbers(10, 20)


# Exercise 3: String Module

import random
import string

letters = string.ascii_letters
random_string = "".join(random.choice(letters) for _ in range(5))

print(random_string)


# Exercise 4: Current Date

from datetime import date


def display_current_date():
    today = date.today()
    print(f"Today's date: {today}")


display_current_date()


# Exercise 5: Amount of Time Left Until January 1st

from datetime import datetime


def time_until_new_year():
    now = datetime.now()
    next_year = now.year + 1
    new_year = datetime(next_year, 1, 1)

    time_left = new_year - now
    print(f"Time left until January 1st: {time_left}")


time_until_new_year()


# Exercise 6: Birthday and Minutes

from datetime import datetime


def minutes_lived(birthdate_str, date_format="%Y-%m-%d"):
    birthdate = datetime.strptime(birthdate_str, date_format)
    now = datetime.now()

    delta = now - birthdate
    minutes = int(delta.total_seconds() // 60)

    print(f"You have lived approximately {minutes:,} minutes in your life.")


minutes_lived("1995-08-15")


# Exercise 7: Faker Module

try:
    from faker import Faker
except ModuleNotFoundError:
    print("Install faker before running Exercise 7: pip install faker")
else:
    fake = Faker()
    users = []

    def add_fake_users(count):
        for _ in range(count):
            user = {
                "name": fake.name(),
                "address": fake.address(),
                "language_code": fake.language_code()
            }
            users.append(user)

    add_fake_users(5)

    for u in users:
        print(u)