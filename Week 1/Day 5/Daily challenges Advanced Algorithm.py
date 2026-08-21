import random

list_of_numbers = [random.randint(0, 10000) for _ in range(20000)]
target_number = 3728

# Set to keep track of numbers we've seen so far
seen = set()
# Set to keep track of unique pairs found
pairs = set()

for num in list_of_numbers:
    complement = target_number - num

    if complement in seen:
        # Store sorted pairs so (A, B) and (B, A) are treated as identical
        pair = (min(num, complement), max(num, complement))
        pairs.add(pair)

    seen.add(num)

# Print all unique pairs found
print(f"Found {len(pairs)} unique pairs summing to {target_number}:")
for num1, num2 in pairs:
    print(f"{num1} and {num2} sums to the target_number {target_number}")