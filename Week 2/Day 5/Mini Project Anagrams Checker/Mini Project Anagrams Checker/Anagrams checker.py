class AnagramChecker:
    def __init__(self, file_path="sowpods.txt"):
        """Step 1: Load word list into a set and store in lowercase for fast lookup."""
        with open(file_path, "r", encoding="utf-8") as file:
            # Read words, strip whitespace, and convert to lowercase
            self.words = {line.strip().lower() for line in file if line.strip()}

    def is_valid_word(self, word):
        """Step 2: Check if the word exists in the word list."""
        return word.strip().lower() in self.words

    def is_anagram(self, word1, word2):
        """Step 3: Compare sorted characters of two words."""
        w1, w2 = word1.lower(), word2.lower()
        return sorted(w1) == sorted(w2)

    def get_anagrams(self, word):
        """Step 4: Find all valid anagrams for a given word (excluding the word itself)."""
        clean_word = word.strip().lower()
        anagrams = []
        
        for item in self.words:
            if item != clean_word and self.is_anagram(clean_word, item):
                anagrams.append(item)
                
        return anagrams