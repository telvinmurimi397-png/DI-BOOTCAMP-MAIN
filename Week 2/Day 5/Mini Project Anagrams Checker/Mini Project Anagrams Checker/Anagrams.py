from anagram_checker import AnagramChecker

def validate_input(user_input):
    """Validates that input is a single alphabetic word without extra spaces/numbers."""
    cleaned = user_input.strip()
    
    # Check for multiple words
    if len(cleaned.split()) > 1:
        print("Error: Only a single word is allowed.")
        return False
        
    # Check if input is strictly alphabetic
    if not cleaned.isalpha():
        print("Error: Word must only contain alphabetic characters (no numbers or special characters).")
        return False
        
    return True

def main():
    checker = AnagramChecker()
    
    while True:
        print("\n" + "="*30)
        print("    ANAGRAM CHECKER MENU")
        print("="*30)
        print("1. Find anagrams for a word")
        print("2. Exit")
        
        choice = input("\nChoose an option (1-2): ").strip()
        
        if choice == "2":
            print("Goodbye!")
            break
        elif choice == "1":
            raw_input = input("Enter a word: ")
            
            if not validate_input(raw_input):
                continue
                
            word = raw_input.strip().lower()
            is_valid = checker.is_valid_word(word)
            anagrams = checker.get_anagrams(word)
            
            # Format and display output
            print("\n" + "-"*30)
            print(f"YOUR WORD : \"{word.upper()}\"")
            if is_valid:
                print("This is a valid English word.")
            else:
                print("Note: This word was not found in the dictionary file.")
                
            if anagrams:
                print(f"Anagrams for your word: {', '.join(anagrams)}")
            else:
                print("No anagrams found for your word.")
            print("-" * 30)
        else:
            print("Invalid selection. Please enter 1 or 2.")

if __name__ == "__main__":
    main()