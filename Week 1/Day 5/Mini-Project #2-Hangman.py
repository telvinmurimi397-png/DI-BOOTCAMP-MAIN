import random

wordslist = [
    'correction',
    'childish',
    'beach',
    'python',
    'assertive',
    'interference',
    'complete',
    'share',
    'credit card',
    'rush',
    'south',
]
word = random.choice(wordslist)

### YOUR CODE STARTS FROM HERE ###

body_parts = ['head', 'body', 'left arm', 'right arm', 'left leg', 'right leg']
guessed_letters = set()
incorrect_guesses = 0
max_incorrect = len(body_parts)


def display_word(target_word, guessed):
    """Displays stars '*' for hidden letters and actual letters for correct guesses."""
    display = []
    for char in target_word:
        if char == ' ':
            display.append(' ')  # Keep spaces visible if present (e.g. 'credit card')
        elif char in guessed:
            display.append(char)
        else:
            display.append('*')
    return ''.join(display)


print("--- Welcome to Hangman! ---")

while incorrect_guesses < max_incorrect:
    current_display = display_word(word, guessed_letters)
    print(f"\nWord: {current_display}")

    # Check for win condition (no '*' left in display)
    if '*' not in current_display:
        print("\n🎉 Congratulations! You guessed the word correctly!")
        break

    guess = input("Guess a letter: ").lower().strip()

    # Input validation
    if len(guess) != 1 or not guess.isalpha():
        print("Please enter a single letter.")
        continue

    if guess in guessed_letters:
        print(f"You already guessed '{guess}'. Try a different letter.")
        continue

    guessed_letters.add(guess)

    # Check if guess is in word
    if guess in word:
        print(f"Good guess! '{guess}' is in the word.")
    else:
        incorrect_guesses += 1
        added_part = body_parts[incorrect_guesses - 1]
        print(f"Wrong guess! Added {added_part} to the gallows.")

        # Display active gallows status
        current_gallows = body_parts[:incorrect_guesses]
        print(f"Gallows parts added ({incorrect_guesses}/{max_incorrect}): {', '.join(current_gallows)}")

# Check for lose condition
if '*' in display_word(word, guessed_letters):
    print(f"\n💀 Game over! All 6 body parts are on the gallows. The word was '{word}'.")