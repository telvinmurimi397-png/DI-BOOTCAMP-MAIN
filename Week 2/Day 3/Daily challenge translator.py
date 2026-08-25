french_words = ["Bonjour", "Au revoir", "Bienvenue", "A bientôt"]

translations = {
    "Bonjour": "Hello",
    "Au revoir": "Goodbye",
    "Bienvenue": "Welcome",
    "A bientôt": "See you soon",
}

translations = {word: translations[word] for word in french_words}

print(translations)