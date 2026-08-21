#Exercise 1: Insert item at a defined index

Python
my_list = [10, 20, 30, 40]
item = "new_item"
index = 2

my_list.insert(index, item)
print(my_list)  # [10, 20, 'new_item', 30, 40]
#Exercise 2: Count spaces in a string

Python
text = "Hello world from Python"
space_count = text.count(" ")
print(space_count)  # 3
#Exercise 3: Count upper and lower case letters

Python
text = "Hello World!"
uppercase = sum(1 for char in text if char.isupper())
lowercase = sum(1 for char in text if char.islower())

print(f"Upper case: {uppercase}, Lower case: {lowercase}")
#Exercise 4: Custom sum function

Python
def my_sum(lst):
    total = 0
    for num in lst:
        total += num
    return total


print(my_sum([1, 5, 4, 2]))  # 12
#Exercise 5: Find max number in a list

Python
def find_max(lst):
    max_val = lst[0]
    for num in lst[1:]:
        if num > max_val:
            max_val = num
    return max_val


print(find_max([0, 1, 3, 50]))  # 50
#Exercise 6: Factorial of a number

Python
def factorial(n):
    result = 1
    for i in range(1, n + 1):
        result *= i
    return result


print(factorial(4))  # 24
#Exercise 7: Custom element count in a list

Python
def list_count(lst, target):
    count = 0
    for item in lst:
        if item == target:
            count += 1
    return count


print(list_count(["a", "a", "t", "o"], "a"))  # 2
#Exercise 8: L2-norm (Euclidean norm)

Python
import math


def norm(lst):
    sum_of_squares = sum(x**2 for x in lst)
    return int(math.sqrt(sum_of_squares))


print(norm([1, 2, 2]))  # 3
#Exercise 9: Check if an array is monotonic

Python
def is_mono(lst):
    is_inc = all(lst[i] <= lst[i + 1] for i in range(len(lst) - 1))
    is_dec = all(lst[i] >= lst[i + 1] for i in range(len(lst) - 1))
    return is_inc or is_dec


print(is_mono([7, 6, 5, 5, 2, 0]))  # True
print(is_mono([2, 3, 3, 3]))  # True
print(is_mono([1, 2, 0, 4]))  # False
#Exercise 10: Print longest word in a list

Python
def print_longest_word(words):
    longest = max(words, key=len)
    print(longest)


print_longest_word(["apple", "banana", "dragonfruit", "kiwi"])  # dragonfruit
#Exercise 11: Separate integers and strings

Python
mixed_list = [1, "apple", 2, "banana", 3, "cherry"]
integers = [x for x in mixed_list if isinstance(x, int)]
strings = [x for x in mixed_list if isinstance(x, str)]

print(f"Integers: {integers}")  # [1, 2, 3]
print(f"Strings: {strings}")  # ['apple', 'banana', 'cherry']
#Exercise 12: Check if string is palindrome

Python
def is_palindrome(s):
    cleaned = s.lower().replace(" ", "")
    return cleaned == cleaned[::-1]


print(is_palindrome("radar"))  # True
print(is_palindrome("John"))  # False
#Exercise 13: Count words longer than k

Python
def sum_over_k(sentence, k):
    words = sentence.split()
    return sum(1 for word in words if len(word) > k)


sentence = "Do or do not there is no try"
print(sum_over_k(sentence, 2))  # 3
#Exercise 14: Average value in dictionary

Python
def dict_avg(d):
    return sum(d.values()) / len(d)


print(dict_avg({"a": 1, "b": 2, "c": 8, "d": 1}))  # 3.0
#Exercise 15: Find common divisors

Python
def common_div(a, b):
    divisors = []
    for i in range(1, min(a, b) + 1):
        if a % i == 0 and b % i == 0:
            divisors.append(i)
    return divisors


print(common_div(10, 20))  # [1, 2, 5, 10]
#Exercise 16: Test if a number is prime

Python
def is_prime(n):
    if n <= 1:
        return False
    for i in range(2, int(n**0.5) + 1):
        if n % i == 0:
            return False
    return True


print(is_prime(11))  # True
#Exercise 17: Print elements where index and value are even

Python
def weird_print(lst):
    result = [val for idx, val in enumerate(lst) if idx % 2 == 0 and val % 2 == 0]
    print(result)


weird_print([1, 2, 2, 3, 4, 5])  # [2, 4]
#Exercise 18: Count types of keyword arguments

Python
def type_count(**kwargs):
    counts = {}
    for value in kwargs.values():
        type_name = type(value).__name__
        counts[type_name] = counts.get(type_name, 0) + 1

    formatted = ", ".join(f"{t}: {c}" for t, c in counts.items())
    print(formatted)


type_count(a=1, b="string", c=1.0, d=True, e=False)
# int: 1, str: 1, float: 1, bool: 2
#Exercise 19: Custom split function

Python
def custom_split(text, delimiter=None):
    if delimiter is None:
        return text.split()  # Handles consecutive whitespaces automatically

    result = []
    current = ""
    for char in text:
        if char == delimiter:
            result.append(current)
            current = ""
        else:
            current += char
    result.append(current)
    return result


print(custom_split("apple,banana,orange", ","))  # ['apple', 'banana', 'orange']
#Exercise 20: Convert string to password format

Python
def mask_password(password):
    return "*" * len(password)


print(mask_password("mypassword"))  # **********