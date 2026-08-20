#Challenge 1: Multiples of a Number

# Get user inputs
number = int(input("Enter a number: "))
length = int(input("Enter a length: "))

# Generate list of multiples using a loop
multiples = []
for i in range(1, length + 1):
    multiples.append(number * i)

print(multiples)


#Challenge 2: Remove Consecutive Duplicate Letters

# Get user input
user_word = input("Enter a word: ")

# Process string to remove consecutive duplicates
new_word = ""
for char in user_word:
    if not new_word or char != new_word[-1]:
        new_word += char

print(new_word)