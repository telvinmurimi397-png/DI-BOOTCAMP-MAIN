from Game import Game

def get_user_menu_choice():
    """Displays menu options and validates user selection."""
    while True:
        print("=== ROCK PAPER SCISSORS ===")
        print("1. Play a new game")
        print("2. Show scores")
        print("3. Quit")
        
        choice = input("Enter your choice (1-3): ").strip()
        if choice in ["1", "2", "3"]:
            return choice
        print("Invalid choice! Please select 1, 2, or 3.\n")

def print_results(results):
    """Prints game summary and exit message."""
    print("\n" + "="*25)
    print("      GAME SUMMARY")
    print("="*25)
    print(f"Wins:   {results.get('win', 0)}")
    print(f"Losses: {results.get('loss', 0)}")
    print(f"Draws:  {results.get('draw', 0)}")
    print("="*25)
    print("Thank you for playing!\n")

def main():
    """Manages program execution flow and score tracking."""
    results = {"win": 0, "loss": 0, "draw": 0}
    
    while True:
        user_choice = get_user_menu_choice()
        
        if user_choice == "1":
            game_instance = Game()
            outcome = game_instance.play()
            results[outcome] += 1
        elif user_choice == "2":
            print("\n--- Current Scoreboard ---")
            print(f"Wins: {results['win']} | Losses: {results['loss']} | Draws: {results['draw']}\n")
        elif user_choice == "3":
            print_results(results)
            break

if __name__ == "__main__":
    main()