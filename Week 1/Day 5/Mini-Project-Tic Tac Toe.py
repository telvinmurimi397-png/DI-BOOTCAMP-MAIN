def display_board(board):
    """Prints the 3x3 game board nicely formatted."""
    print("\n  0   1   2")
    for row_idx, row in enumerate(board):
        print(f"{row_idx} " + " | ".join(row))
        if row_idx < 2:
            print("  " + "---+" * 2 + "---")
    print()


def player_input(board, player):
    """Gets row and column numbers from player, validating the choice."""
    while True:
        try:
            user_input = input(
                f"Player '{player}', enter row and column (e.g., 0 2): "
            )
            row_str, col_str = user_input.strip().split()
            row, col = int(row_str), int(col_str)

            if row not in [0, 1, 2] or col not in [0, 1, 2]:
                print(
                    "Invalid position! Row and column must be 0, 1, or 2. Try again."
                )
                continue

            if board[row][col] != " ":
                print("That spot is already taken! Choose an empty cell.")
                continue

            return row, col

        except ValueError:
            print(
                "Invalid input! Please enter two numbers separated by a space."
            )


def check_win(board, player):
    """Checks all rows, columns, and diagonals for a win condition."""
    # Check rows
    for row in board:
        if all(cell == player for cell in row):
            return True

    # Check columns
    for col in range(3):
        if all(board[row][col] == player for row in range(3)):
            return True

    # Check diagonals
    if all(board[i][i] == player for i in range(3)):
        return True
    if all(board[i][2 - i] == player for i in range(3)):
        return True

    return False


def check_tie(board):
    """Checks if all cells are filled and there is no empty space left."""
    for row in board:
        if " " in row:
            return False
    return True


def play():
    """Main game loop managing turns, status checks, and board state."""
    # Step 1: Representing the board (3x3 grid initialized with empty spaces)
    board = [[" " for _ in range(3)] for _ in range(3)]
    current_player = "X"

    print("--- Welcome to Tic Tac Toe! ---")

    while True:
        display_board(board)

        # Get current player move and update board
        row, col = player_input(board, current_player)
        board[row][col] = current_player

        # Check for win
        if check_win(board, current_player):
            display_board(board)
            print(f"🎉 Congratulations! Player '{current_player}' wins!")
            break

        # Check for tie
        if check_tie(board):
            display_board(board)
            print("🤝 It's a tie!")
            break

        # Switch to the next player
        current_player = "O" if current_player == "X" else "X"


if __name__ == "__main__":
    play()