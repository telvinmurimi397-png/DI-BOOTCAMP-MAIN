import math

class Pagination:
    def __init__(self, items=None, page_size=10):
        self.items = items if items is not None else []
        self.page_size = int(page_size)
        self.current_idx = 0
        
        # Calculate total pages (avoid zero division by defaulting to at least 1 page)
        self.total_pages = math.ceil(len(self.items) / self.page_size) if self.items else 1

    def get_visible_items(self):
        """Returns the list of items visible on the current page using slicing."""
        start = self.current_idx * self.page_size
        end = start + self.page_size
        return self.items[start:end]

    def go_to_page(self, page_num):
        """
        Navigates to the specified page number (1-based indexing).
        Raises ValueError if page_num is out of range.
        """
        page_num = int(page_num)
        if page_num < 1 or page_num > self.total_pages:
            raise ValueError(f"Page number {page_num} is out of range (1 - {self.total_pages}).")
        
        self.current_idx = page_num - 1
        return self  # Return self for method chaining

    def first_page(self):
        """Navigates to the first page."""
        self.current_idx = 0
        return self

    def last_page(self):
        """Navigates to the last page."""
        self.current_idx = self.total_pages - 1
        return self

    def next_page(self):
        """Moves one page forward if not already on the last page."""
        if self.current_idx < self.total_pages - 1:
            self.current_idx += 1
        return self

    def previous_page(self):
        """Moves one page backward if not already on the first page."""
        if self.current_idx > 0:
            self.current_idx -= 1
        return self

    # Step 5 (Bonus): Custom string representation
    def __str__(self):
        return "\n".join(str(item) for item in self.get_visible_items())

    # Bonus Method Aliases for camelCase chaining support
    def nextPage(self):
        return self.next_page()

    def previousPage(self):
        return self.previous_page()

    def firstPage(self):
        return self.first_page()

    def lastPage(self):
        return self.last_page()

    def goToPage(self, page_num):
        return self.go_to_page(page_num)

    def getVisibleItems(self):
        return self.get_visible_items()


# ==================== STEP 6 & BONUS TESTING ====================

alphabetList = list("abcdefghijklmnopqrstuvwxyz")
p = Pagination(alphabetList, 4)

# Test 1: First page visible items
print(p.get_visible_items())
# Output: ['a', 'b', 'c', 'd']

# Test 2: Next page
p.next_page()
print(p.get_visible_items())
# Output: ['e', 'f', 'g', 'h']

# Test 3: Last page
p.last_page()
print(p.get_visible_items())
# Output: ['y', 'z']

# Test 4: Custom __str__ method on first page
p.first_page()
print("--- Custom __str__ Output ---")
print(str(p))

# Test 5: Bonus camelCase method chaining
print("\n--- Method Chaining Bonus ---")
chained_result = p.firstPage().nextPage().nextPage().nextPage().getVisibleItems()
print(chained_result)
# Output: ['m', 'n', 'o', 'p']

# Test 6: Exception handling on out-of-bounds page navigation
print("\n--- Exception Handling ---")
try:
    p.go_to_page(10)
except ValueError as e:
    print(f"ValueError: {e}")

try:
    p.go_to_page(0)
except ValueError as e:
    print(f"ValueError: {e}")