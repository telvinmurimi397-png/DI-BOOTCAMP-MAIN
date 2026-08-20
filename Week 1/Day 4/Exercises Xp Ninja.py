#Exercise 1: What’s your name?

Python
def get_full_name(first_name, last_name, middle_name=""):
    if middle_name:
        full_name = f"{first_name} {middle_name} {last_name}"
    else:
        full_name = f"{first_name} {last_name}"

    return full_name.title()


# Examples
print(get_full_name(first_name="john", middle_name="hooker", last_name="lee"))
print(get_full_name(first_name="bruce", last_name="lee"))


# Exercise 2: From English to Morse

Python
MORSE_CODE_DICT = {
    "A": ".-",
    "B": "-...",
    "C": "-.-.",
    "D": "-..",
    "E": ".",
    "F": "..-.",
    "G": "--.",
    "H": "....",
    "I": "..",
    "J": ".---",
    "K": "-.-",
    "L": ".-..",
    "M": "--",
    "N": "-.",
    "O": "---",
    "P": ".--.",
    "Q": "--.-",
    "R": ".-.",
    "S": "...",
    "T": "-",
    "U": "..-",
    "V": "...-",
    "W": ".--",
    "X": "-..-",
    "Y": "-.--",
    "Z": "--..",
    "1": ".----",
    "2": "..---",
    "3": "...--",
    "4": "....-",
    "5": ".....",
    "6": "-....",
    "7": "--...",
    "8": "---..",
    "9": "----.",
    "0": "-----",
}

# Reverse mapping for Morse to English
REVERSE_MORSE_DICT = {value: key for key, value in MORSE_CODE_DICT.items()}


def english_to_morse(text):
    words = text.upper().split(" ")
    morse_words = []

    for word in words:
        morse_letters = [
            MORSE_CODE_DICT[char] for char in word if char in MORSE_CODE_DICT
        ]
        morse_words.append(" ".join(morse_letters))

    return " / ".join(morse_words)


def morse_to_english(morse_code):
    words = morse_code.split(" / ")
    english_words = []

    for word in words:
        letters = word.split(" ")
        english_letters = [
            REVERSE_MORSE_DICT[code]
            for code in letters
            if code in REVERSE_MORSE_DICT
        ]
        english_words.append("".join(english_letters))

    return " ".join(english_words)


# Examples
encoded = english_to_morse("HELLO WORLD")
print(f"Morse: {encoded}")
print(f"English: {morse_to_english(encoded)}")


#Exercise 3: Box of stars

Python
def box_printer(*args):
    # Find the length of the longest word
    max_len = max(len(word) for word in args)

    # Print top border (longest length + 4 for borders and spacing)
    print("*" * (max_len + 4))

    # Print each word padded with spaces inside borders
    for word in args:
        print(f"* {word.ljust(max_len)} *")

    # Print bottom border
    print("*" * (max_len + 4))


# Example
box_printer("Hello", "World", "in", "reallylongword", "a", "frame")
#Exercise 4: What is the purpose of this code?

#Purpose:
#This code implements the Insertion Sort algorithm to sort a list of numbers in ascending order in-place.

#How it works:

#It iterates through the list starting from the second element (index = 1).

#For each element (currentvalue), it compares it with the preceding elements to its left.

#It shifts all elements larger than currentvalue one position to the right.

#Finally, it inserts currentvalue into its correct sorted position.

#Output:

Python
[17, 20, 26, 31, 44, 54, 55, 77, 93]