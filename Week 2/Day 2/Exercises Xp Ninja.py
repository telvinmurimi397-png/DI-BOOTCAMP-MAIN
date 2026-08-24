import time
import os

class Cell:
    """Represents an individual cell in Conway's Game of Life."""
    
    def __init__(self, state=False):
        self.is_alive = state

    def __str__(self):
        # Render live cells as '█' and dead cells as '.'
        return "█" if self.is_alive else "."


class GameOfLife:
    """Manages the grid, cell generations, and game execution."""

    def __init__(self, rows=10, cols=10, expandable=False, max_border=10000):
        self.rows = rows
        self.cols = cols
        self.expandable = expandable
        self.max_border = max_border
        self.generation = 0
        
        # Initialize grid with dead Cell objects
        self.grid = [[Cell(False) for _ in range(self.cols)] for _ in range(self.rows)]

    def set_pattern(self, pattern, start_row=0, start_col=0):
        """Places a 2D binary pattern (1 for alive, 0 for dead) onto the grid."""
        for r_idx, row in enumerate(pattern):
            for c_idx, val in enumerate(row):
                target_r = start_row + r_idx
                target_c = start_col + c_idx
                if 0 <= target_r < self.rows and 0 <= target_c < self.cols:
                    self.grid[target_r][target_c].is_alive = bool(val)

    def count_live_neighbors(self, row, col):
        """Counts how many of the 8 neighboring cells are alive."""
        live_count = 0
        # Check surrounding offsets (-1, 0, 1)
        for dr in (-1, 0, 1):
            for dc in (-1, 0, 1):
                if dr == 0 and dc == 0:
                    continue  # Skip the cell itself
                
                nr, nc = row + dr, col + dc
                if 0 <= nr < self.rows and 0 <= nc < self.cols:
                    if self.grid[nr][nc].is_alive:
                        live_count += 1
        return live_count

    def should_expand(self):
        """Checks if any edge cell is alive to expand borders safely."""
        if not self.expandable:
            return False
        
        # Check top/bottom boundaries
        top_edge = any(self.grid[0][c].is_alive for c in range(self.cols))
        bottom_edge = any(self.grid[self.rows - 1][c].is_alive for c in range(self.cols))
        # Check left/right boundaries
        left_edge = any(self.grid[r][0].is_alive for r in range(self.rows))
        right_edge = any(self.grid[r][self.cols - 1].is_alive for r in range(self.rows))

        return top_edge or bottom_edge or left_edge or right_edge

    def expand_grid(self):
        """Pads the grid borders with extra dead cells up to max_border size."""
        if self.rows >= self.max_border or self.cols >= self.max_border:
            return

        pad = 2  # Expand by 2 layers around the edges
        new_rows = self.rows + (pad * 2)
        new_cols = self.cols + (pad * 2)

        new_grid = [[Cell(False) for _ in range(new_cols)] for _ in range(new_rows)]

        # Copy existing grid into the center of the expanded grid
        for r in range(self.rows):
            for c in range(self.cols):
                new_grid[r + pad][c + pad].is_alive = self.grid[r][c].is_alive

        self.grid = new_grid
        self.rows = new_rows
        self.cols = new_cols

    def next_generation(self):
        """Calculates the state of the grid for the next step."""
        if self.expandable and self.should_expand():
            self.expand_grid()

        # Create a new grid buffer for the next state
        next_grid = [[Cell(False) for _ in range(self.cols)] for _ in range(self.rows)]

        for r in range(self.rows):
            for c in range(self.cols):
                neighbors = self.count_live_neighbors(r, c)
                is_currently_alive = self.grid[r][c].is_alive

                # Apply Conway's rules
                if is_currently_alive:
                    if neighbors in (2, 3):
                        next_grid[r][c].is_alive = True
                else:
                    if neighbors == 3:
                        next_grid[r][c].is_alive = True

        self.grid = next_grid
        self.generation += 1

    def display(self):
        """Displays current grid state in the terminal."""
        os.system('cls' if os.name == 'nt' else 'clear')
        print(f"=== Conway's Game of Life - Generation {self.generation} ===")
        print(f"Grid Size: {self.rows}x{self.cols}\n")
        
        for row in self.grid:
            print(" ".join(str(cell) for cell in row))
        print()

    def run(self, steps=20, delay=0.3):
        """Runs the simulation loop for a set number of steps."""
        for _ in range(steps):
            self.display()
            time.sleep(delay)
            self.next_generation()
        self.display()


# ==================== PRESET INITIAL PATTERNS ====================

# 1. Glider Pattern (Moves diagonally)
GLIDER = [
    [0, 1, 0],
    [0, 0, 1],
    [1, 1, 1]
]

# 2. Blinker Pattern (Oscillator)
BLINKER = [
    [1, 1, 1]
]

# 3. Beacon Pattern (Oscillator)
BEACON = [
    [1, 1, 0, 0],
    [1, 1, 0, 0],
    [0, 0, 1, 1],
    [0, 0, 1, 1]
]


# ==================== EXECUTION ====================
if __name__ == "__main__":
    # Fixed border simulation with a Glider pattern
    game = GameOfLife(rows=12, cols=12, expandable=True, max_border=10000)
    
    # Place a Glider in the top-left area
    game.set_pattern(GLIDER, start_row=1, start_col=1)
    
    # Run the simulation for 15 generations with 0.2s pause between steps
    game.run(steps=15, delay=0.2)