#Exercise 1: Concatenate lists

list1 = [1, 2, 3]
list2 = [4, 5, 6]

# Using extend()
list1.extend(list2)
print(list1)

# Alternative using unpack operator (*)
# concatenated = [*list1, *list2]

#Exercise 2: Range of numbers

for num in range(1500, 2501):
    if num % 5 == 0 and num % 7 == 0:
        print(num)
#Exercise 3: Check the index

names = ['Samus', 'Cortana', 'V', 'Link', 'Mario', 'Cortana', 'Samus']
user_name = input("Enter your name: ")

if user_name in names:
    print(names.index(user_name))
else:
    print("Name not found in the list.")
    
#Exercise 4: Greatest Number

num1 = float(input("Input the 1st number: "))
num2 = float(input("Input the 2nd number: "))
num3 = float(input("Input the 3rd number: "))

greatest = max(num1, num2, num3)
print(f"The greatest number is: {int(greatest) if greatest.is_integer() else greatest}")

#Exercise 5: The Alphabet

alphabet = "abcdefghijklmnopqrstuvwxyz"
vowels = "aeiou"

for char in alphabet:
    if char in vowels:
        print(f"'{char}' is a vowel.")
    else:
        print(f"'{char}' is a consonant.")
#Exercise 6: Words and letters

words = [input(f"Enter word {i+1}/7: ") for i in range(7)]
letter = input("Enter a single letter to search for: ")

for word in words:
    index = word.find(letter)
    if index != -1:
        print(f"In '{word}', the first appearance of '{letter}' is at index {index}.")
    else:
        print(f"The letter '{letter}' does not appear in the word '{word}'.")
#Exercise 7: Min, Max, Sum

numbers = list(range(1, 1000001))

print("Min:", min(numbers))
print("Max:", max(numbers))
print("Sum:", sum(numbers))
#Exercise 8: List and Tuple

user_input = input("Enter comma-separated numbers: ")

num_list = user_input.split(",")
num_tuple = tuple(num_list)

print(num_list)
print(num_tuple)
#Exercise 9: Random number

import random

wins = 0
losses = 0

while True:
    user_choice = input("\nGuess a number from 1 to 9 (or type 'quit' to exit): ").strip()
    
    if user_choice.lower() == 'quit':
        break
        
    if not user_choice.isdigit() or not (1 <= int(user_choice) <= 9):
        print("Please enter a valid number between 1 and 9.")
        continue

    guess = int(user_choice)
    secret_num = random.randint(1, 9)

    if guess == secret_num:
        print("Winner!")
        wins += 1
    else:
        print(f"Better luck next time. (The number was {secret_num})")
        losses += 1

print(f"\n--- Game Over ---")
print(f"Total Wins: {wins} | Total Losses: {losses}")