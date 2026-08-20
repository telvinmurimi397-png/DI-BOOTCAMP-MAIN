import random

user_string = input("Enter a string (must be 10 characters long): ")

if len(user_string) < 10:
    print("String not long enough.")
elif len(user_string) > 10:
    print("String too long.")
else:
    print("Perfect string")

    print(f"First character: {user_string[0]}")
    print(f"Last character: {user_string[-1]}")

    current_string = ""
    for char in user_string:
        current_string += char
        print(current_string)

    char_list = list(user_string)
    random.shuffle(char_list)
    jumbled_string = "".join(char_list)
    print(f"Jumbled string: {jumbled_string}")