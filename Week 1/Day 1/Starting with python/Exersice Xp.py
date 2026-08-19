# Exercise 1: Hello World
# Python
print("Hello world\n" * 4, end="")

# Exercise 2: Some Math
# Python
print((99**3) * 8)

# Exercise 3: What is the output?
# Python
print(5 < 3)         # False
print(3 == 3)        # True
print(3 == "3")      # False
try:
    print("3" > 3)
except TypeError as e:
    print(type(e).__name__, e)
print("Hello" == "hello")  # False

# Exercise 4: Your computer brand
# Python
computer_brand = "Apple"
print(f"I have a {computer_brand} computer.")

# Exercise 5: Your information
# Python
name = "Telvin"
age = 25
shoe_size = 42
info = f"My name is {name}, I am {age} years old, and my shoe size is {shoe_size}."
print(info)

# Exercise 6: A & B
# Python
a = 10
b = 5

if a > b:
    print("Hello World")

# Exercise 7: Odd or Even
# Python
num = int(input("Enter a number: "))

if num % 2 == 0:
    print("The number is even.")
else:
    print("The number is odd.")

# Exercise 8: What's your name?
# Python
my_name = "Telvin"
user_name = input("What is your name? ")

if user_name.strip().capitalize() == my_name:
    print("No way! We have the exact same name. Did we just become best friends?")
else:
    print(f"Nice to meet you, {user_name}! My name is {my_name}, the clearly superior name.")

# Exercise 9: Tall enough to ride a roller coaster
# Python
height = float(input("Enter your height in cm: "))

if height > 145:
    print("You are tall enough to ride!")
else:
    print("You need to grow some more to ride.")