#Exercise 1: Hello World-I love Python

Python
print(("Hello world\n" * 4) + ("I love python\n" * 4), end="")
#Exercise 2: What is the Season?

Python
month = int(input("Enter a month (1 to 12): "))

if 3 <= month <= 5:
    print("Spring")
elif 6 <= month <= 8:
    print("Summer")
elif 9 <= month <= 11:
    print("Autumn")
elif month in (12, 1, 2):
    print("Winter")
else:
    print("Invalid month number. Please enter a value between 1 and 12.")