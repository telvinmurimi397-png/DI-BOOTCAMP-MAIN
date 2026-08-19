# Exercise 3: Outputs
print(3 <= 3 < 9)         # True
print(3 == 3 == 3)        # True
print(bool(0))            # False
print(bool(5 == "5"))    # False
print(bool(4 == 4) == bool("4" == "4"))  # True
print(bool(bool(None)))   # False

x = (1 == True)
y = (1 == False)
a = True + 4
b = False + 10

print("x is", x)
print("y is", y)
print("a:", a)
print("b:", b)

# Exercise 4: How many characters in a sentence?
my_text = """Lorem ipsum dolor sit amet, consectetur adipiscing elit,
sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
Ut enim ad minim veniam, quis nostrud exercitation ullamco
laboris nisi ut aliquip ex ea commodo consequat.
Duis aute irure dolor in reprehenderit in voluptate velit
esse cillum dolore eu fugiat nulla pariatur.
Excepteur sint occaecat cupidatat non proident,
sunt in culpa qui officia deserunt mollit anim id est laborum."""

print(len(my_text))

# Exercise 5: Longest word without a specific character
longest_length = 0

while True:
    sentence = input("Enter a sentence without the letter 'A' (or type 'quit' to stop): ").strip()

    if sentence.lower() == 'quit':
        break

    if 'a' in sentence.lower():
        print("Sorry, your sentence contains the letter 'A'! Try again.")
    else:
        if len(sentence) > longest_length:
            longest_length = len(sentence)
            print(f"Congratulations! New record length: {longest_length} characters!")
        else:
            print("Valid sentence, but not longer than your current record.")