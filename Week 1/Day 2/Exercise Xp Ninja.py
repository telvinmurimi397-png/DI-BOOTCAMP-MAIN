# Exercise 1: Formula
import math

C = 50
H = 30

user_input = input("Enter comma-separated values for D: ")
d_values = user_input.split(",")

results = []
for d in d_values:
    D = float(d.strip())
    Q = math.sqrt((2 * C * D) / H)
    results.append(str(round(Q)))

print(",".join(results))


# Exercise 2: List of integers
import random

# Core program with initial list
numbers = [3, 47, 99, -80, 22, 97, 54, -23, 5, 7]

# 2a. Printed in a single line
print("Original list:", numbers)

# 2b. Sorted in descending order
sorted_desc = sorted(numbers, reverse=True)
print("Sorted descending:", sorted_desc)

# 2c. Sum of all numbers
print("Sum:", sum(numbers))

# 3. First and last numbers
first_and_last = [numbers[0], numbers[-1]]
print("First and last:", first_and_last)

# 4. Numbers greater than 50
greater_than_50 = [n for n in numbers if n > 50]
print("Greater than 50:", greater_than_50)

# 5. Numbers smaller than 10
smaller_than_10 = [n for n in numbers if n < 10]
print("Smaller than 10:", smaller_than_10)

# 6. Numbers squared
squared = [n ** 2 for n in numbers]
print("Squared numbers:", squared)

# 7. Without duplicates
unique_numbers = list(set(numbers))
print("Without duplicates:", unique_numbers)
print("Count of unique numbers:", len(unique_numbers))

# 8. Average
avg = sum(numbers) / len(numbers)
print("Average:", avg)

# 9. Largest number
print("Largest:", max(numbers))

# 10. Smallest number
print("Smallest:", min(numbers))

# 11. Bonus: Without built-in functions
total = 0
largest = numbers[0]
smallest = numbers[0]
count = 0

for num in numbers:
    total += num
    count += 1
    if num > largest:
        largest = num
    if num < smallest:
        smallest = num

manual_avg = total / count
print(f"Manual stats -> Sum: {total}, Avg: {manual_avg}, Max: {largest}, Min: {smallest}")

# 12. Bonus: Ask user for 10 numbers
user_numbers = []
for i in range(10):
    val = int(input(f"Enter number {i+1}/10 (-100 to 100): "))
    user_numbers.append(val)

# 13. Bonus: Generate 10 random integers
random_10 = [random.randint(-100, 100) for _ in range(10)]

# 14. Bonus: Random quantity (at least 50 elements)
amount = random.randint(50, 100)
random_variable_qty = [random.randint(-100, 100) for _ in range(amount)]

# 15. Bonus Question Answer:
# Yes, the analysis code using dynamic lengths (len(), loops, list comprehensions) 
# will work seamlessly regardless of how many elements are in the list.


# Exercise 3: Working on a paragraph
import re

paragraph = """Python is an high-level, general-purpose programming language. 
Its design philosophy emphasizes code readability with the use of significant indentation. 
Python is dynamically typed and garbage-collected."""

# Character counts
char_count = len(paragraph)
non_whitespace_count = len(re.sub(r'\s+', '', paragraph))

# Word counts
words = paragraph.split()
word_count = len(words)
unique_words = set(words)
unique_word_count = len(unique_words)
non_unique_word_count = word_count - unique_word_count

# Sentence counts
sentences = [s for s in re.split(r'[.!?]+', paragraph) if s.strip()]
sentence_count = len(sentences)
avg_words_per_sentence = word_count / sentence_count if sentence_count > 0 else 0

print("--- Paragraph Analysis ---")
print(f"Total characters: {char_count}")
print(f"Non-whitespace characters: {non_whitespace_count}")
print(f"Total sentences: {sentence_count}")
print(f"Total words: {word_count}")
print(f"Unique words: {unique_word_count}")
print(f"Non-unique words: {non_unique_word_count}")
print(f"Average words per sentence: {avg_words_per_sentence:.2f}")


# Exercise 4: Frequency Of The Words
text = input("Enter a string: ")
words = text.split()

word_counts = {}
for word in words:
    word_counts[word] = word_counts.get(word, 0) + 1

for word in sorted(word_counts.keys()):
    print(f"{word}:{word_counts[word]}")