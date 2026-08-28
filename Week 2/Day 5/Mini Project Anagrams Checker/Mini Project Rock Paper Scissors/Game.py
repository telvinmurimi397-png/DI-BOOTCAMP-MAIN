import random

class Game:
    def get_user_item(self):
        """Asks and validates the user's move (rock, paper, or scissors)."""
        valid_items = ["rock", "paper", "scissors"]
        while True:
            user_input = input("Select an item (rock, paper, scissors): ").strip().lower()
            if user_input in valid_items:
                return user_input
            print("Invalid input! Please choose 'rock', 'paper', or 'scissors'.")

    def get_computer_item(self):
        """Randomly selects the computer's move."""
        return random.choice(["rock", "paper", "scissors"])

    def get_game_result(self, user_item, computer_item):
        """Determines the result of the game: win, draw, or loss."""
        if user_item == computer_item:
            return "draw"
        
        # Winning combinations for the user
        winning_moves = {
            "rock": "scissors",
            "paper": "rock",
            "scissors": "paper"
        }
        
        if winning_moves[user_item] == computer_item:
            return "win"
        else:
            return "loss"

    def play(self):
        """Executes one round of the game and displays outcome."""
        user_item = self.get_user_item()
        computer_item = self.get_computer_item()
        result = self.get_game_result(user_item, computer_item)
        
        print(f"\nYou selected: {user_item.capitalize()}")
        print(f"Computer selected: {computer_item.capitalize()}")
        
        if result == "win":
            print("Outcome: You won!\n")
        elif result == "loss":
            print("Outcome: You lost!\n")
        else:
            print("Outcome: It's a draw!\n")
            
        return result