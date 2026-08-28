from pathlib import Path
import random
import json


def get_words_from_file(file_path):
    """Reads words from a file and returns them as a list."""
    with open(file_path, "r", encoding="utf-8") as file:
        content = file.read()
        words = content.split()
    return words


def get_random_sentence(length, file_path=None):
    """Generates a lowercase random sentence of a specified length."""
    word_file = Path(file_path) if file_path else Path(__file__).with_name("words.txt")
    words = get_words_from_file(word_file)
    selected_words = [random.choice(words) for _ in range(length)]
    sentence = " ".join(selected_words).lower()
    return sentence


def main():
    """Handles program flow and user input validation."""
    print("Welcome to the Random Sentence Generator!")
    
    user_input = input("Enter the desired sentence length (between 2 and 20): ").strip()
    
    try:
        length = int(user_input)
        if 2 <= length <= 20:
            sentence = get_random_sentence(length)
            print(f"\nGenerated Sentence:\n{sentence}")
        else:
            print("Error: The length must be an integer between 2 and 20 inclusive.")
    except ValueError:
        print("Error: Invalid input! Please enter a valid integer.")

if __name__ == "__main__":
    main()
    
    
    #Exercise 2: Working with JSON 

# Provided JSON string
sampleJson = """{ 
   "company":{ 
      "employee":{ 
         "name":"emma",
         "payable":{ 
            "salary":7000,
            "bonus":800
         }
      }
   }
}"""

# Step 1: Load the JSON string into a Python dictionary
data = json.loads(sampleJson)

# Step 2: Access and print the nested "salary" key
salary = data["company"]["employee"]["payable"]["salary"]
print(f"Salary: {salary}")

# Step 3: Add the "birth_date" key to the "employee" dictionary
data["company"]["employee"]["birth_date"] = "1995-04-12"

# Step 4: Save the modified dictionary to a file with indentation
with open("modified_employee.json", "w") as file:
    json.dump(data, file, indent=4)

print("Modified JSON saved successfully to 'modified_employee.json'.")