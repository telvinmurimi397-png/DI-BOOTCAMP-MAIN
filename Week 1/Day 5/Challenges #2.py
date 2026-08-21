# Exercise 1

print("Pattern 1 (Centered Pyramid):")
rows = 3
for i in range(rows):
    spaces = " " * (rows - i - 1)
    stars = "*" * (2 * i + 1)
    print(spaces + stars)

print("\nPattern 2 (Right-Aligned Triangle):")
rows = 5
for i in range(rows):
    spaces = " " * (rows - i - 1)
    stars = "*" * (i + 1)
    print(spaces + stars)

print("\nPattern 3 (Hourglass / Dual Triangles):")
for i in range(1, 6):
    print("*" * i)

rows = 5
for i in range(rows):
    spaces = " " * i
    stars = "*" * (rows - i)
    print(spaces + stars)

# Exercise 2
# Selection sort example with comments
my_list = [2, 24, 12, 354, 233]
print("\nOriginal list:", my_list)

for i in range(len(my_list) - 1):
    minimum = i

    for j in range(i + 1, len(my_list)):
        if my_list[j] < my_list[minimum]:
            minimum = j

    if minimum != i:
        my_list[i], my_list[minimum] = my_list[minimum], my_list[i]

print("Sorted list:", my_list)

# Variable Trace:
# Initial State: my_list = [2, 24, 12, 354, 233]
# i = 0 -> minimum = 0, no smaller element found
# i = 1 -> minimum becomes 2, so [24, 12] is swapped
# i = 2 -> no smaller element found before index 2
# i = 3 -> minimum becomes 4, so [354, 233] is swapped
# Final result: [2, 12, 24, 233, 354]