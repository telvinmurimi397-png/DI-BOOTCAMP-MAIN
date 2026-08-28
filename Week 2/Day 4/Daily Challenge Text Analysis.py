import string
import re

class Text:
    def __init__(self, text):
        self.text = text

    def _words(self):
        return re.findall(r"[a-zA-Z0-9]+(?:'[a-zA-Z0-9]+)?", self.text.lower())

    # Step 2: Implement word_frequency Method
    def word_frequency(self, word):
        words = self._words()
        count = words.count(word.lower().strip(string.punctuation))
        if count == 0:
            return f"The word '{word}' was not found in the text."
        return count

    # Step 3: Implement most_common_word Method
    def most_common_word(self):
        words = self._words()
        if not words:
            return None
        
        freq_dict = {}
        for word in words:
            freq_dict[word] = freq_dict.get(word, 0) + 1
            
        most_common = max(freq_dict, key=freq_dict.get)
        return most_common

    # Step 4: Implement unique_words Method
    def unique_words(self):
        return list(dict.fromkeys(self._words()))

    # Step 5: Implement from_file Class Method
    @classmethod
    def from_file(cls, file_path):
        with open(file_path, "r", encoding="utf-8") as file:
            content = file.read()
        return cls(content)


# Bonus: Text Modification
# Step 6: Create the TextModification Class inheriting from Text
class TextModification(Text):

    # Step 7: Implement remove_punctuation Method
    def remove_punctuation(self):
        # Uses str.translate and string.punctuation to strip punctuation
        translator = str.maketrans("", "", string.punctuation)
        return self.text.translate(translator)

    # Step 8: Implement remove_stop_words Method
    def remove_stop_words(self):
        stop_words = {
            "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", 
            "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being", 
            "below", "between", "both", "but", "by", "can't", "cannot", "could", "couldn't", 
            "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during", 
            "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", 
            "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", 
            "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", 
            "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", 
            "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", 
            "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", 
            "our", "ours", "ourselves", "out", "over", "own", "same", "shan't", "she", 
            "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such", 
            "than", "that", "that's", "the", "their", "theirs", "them", "themselves", 
            "then", "there", "there's", "these", "they", "they'd", "they'll", "they're", 
            "they've", "this", "those", "through", "to", "too", "under", "until", "up", 
            "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", 
            "weren't", "what", "what's", "when", "when's", "where", "where's", "which", 
            "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would", 
            "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", 
            "yourself", "yourselves"
        }
        words = self.text.split()
        filtered_words = [word for word in words if word.lower() not in stop_words]
        return " ".join(filtered_words)

    # Step 9: Implement remove_special_characters Method
    def remove_special_characters(self):
        # Keeps alphanumeric characters and spaces, removing special symbols
        return re.sub(r'[^a-zA-Z0-9\s]', '', self.text)


def main():
    sample_text = TextModification(
        "A good book is a good friend. A good friend is valuable!"
    )
    print(f"Frequency of 'good': {sample_text.word_frequency('good')}")
    print(f"Most common word: {sample_text.most_common_word()}")
    print(f"Unique words: {sample_text.unique_words()}")
    print(f"Without punctuation: {sample_text.remove_punctuation()}")
    print(f"Without stop words: {sample_text.remove_stop_words()}")
    print(f"Without special characters: {sample_text.remove_special_characters()}")


if __name__ == "__main__":
    main()