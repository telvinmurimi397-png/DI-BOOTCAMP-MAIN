# Challenge 1: Sorting

# Step 1: Get Input
user_input = input("Enter comma-separated words: ")

# Step 2: Split the String into a list of words
words_list = [word.strip() for word in user_input.split(",") if word.strip()]

# Step 3: Sort the List alphabetically
words_list.sort()

# Step 4: Join the Sorted List back into a comma-separated string
result = ",".join(words_list)

# Step 5: Print the Result
print(result)

# Challenge 2: Longest Word

# Step 1: Define the Function
def longest_word(sentence):
    # Step 2: Split the Sentence into Words
    words = sentence.split()

    # Step 3: Initialize Variables
    longest = ""

    # Step 4: Iterate Through the Words
    for word in words:
        cleaned_word = word.strip(".,!?;:")

        # Step 5: Compare Word Lengths (> ensures the first longest word is kept)
        if len(cleaned_word) > len(longest):
            longest = cleaned_word

    # Step 6: Return the Longest Word
    return longest


# Testing the function
print(longest_word("Margaret's toy is a pretty doll."))  # "Margaret's"
print(longest_word("A thing of beauty is a joy forever."))  # "forever"
print(longest_word("Forgetfulness is by all means powerless!"))  # "Forgetfulness"