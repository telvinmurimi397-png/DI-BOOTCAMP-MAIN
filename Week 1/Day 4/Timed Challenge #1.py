def count_occurrences(text, char):
    return text.count(char)


# --- User Input & Output ---
user_string = input("String: ")
user_char = input("Character: ")

result = count_occurrences(user_string, user_char)
print(result)