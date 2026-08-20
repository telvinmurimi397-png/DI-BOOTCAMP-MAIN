import re

MATRIX_STR = """
7ir
Tsi
h%x
i ?
sM# 
$a 
#t%"""

# Step 1: Transforming the String into a 2D List
# Split string into lines and convert non-empty lines into lists of characters
rows = [list(line) for line in MATRIX_STR.split("\n") if line]

# Step 2 & 3: Processing Columns and Filtering Characters
num_rows = len(rows)
num_cols = len(rows[0])

# Read top-to-bottom, left-to-right to collect all characters in order
column_characters = []
for col in range(num_cols):
    for row in range(num_rows):
        column_characters.append(rows[row][col])

column_str = "".join(column_characters)

# Step 4 & 5: Replacing Symbols with Spaces & Constructing Message
# Replace any sequence of non-alphabetical characters that sits between two letters with a space
decoded_message = re.sub(r"(?<=[a-zA-Z])[^a-zA-Z]+(?=[a-zA-Z])", " ", column_str)

# Clean up any leftover non-alpha characters from the ends
decoded_message = re.sub(r"^[^a-zA-Z]+|[^a-zA-Z]+$", "", decoded_message)

print(decoded_message)