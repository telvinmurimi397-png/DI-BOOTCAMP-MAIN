// 1 & 2. .toString() and .join() Methods

const numbers = [5, 0, 9, 1, 7, 4, 2, 6, 3, 8];

// 1. Convert array to string using .toString()
const strWithToString = numbers.toString();
console.log("toString():", strWithToString);
// Output: "5,0,9,1,7,4,2,6,3,8"

// 2. Convert array to string using .join() with different separators
console.log("join('+'):", numbers.join("+"));
// Output: "5+0+9+1+7+4+2+6+3+8"

console.log("join(' '):", numbers.join(" "));
// Output: "5 0 9 1 7 4 2 6 3 8"

console.log("join(''):", numbers.join(""));
// Output: "5091742638"

// 3. Bonus: Bubble Sort (Descending Order)

const numbersToSort = [5, 0, 9, 1, 7, 4, 2, 6, 3, 8];

// Outer loop: controls the number of passes over the array
for (let i = 0; i < numbersToSort.length; i++) {
  // Inner loop: compares adjacent elements
  for (let j = 0; j < numbersToSort.length - 1 - i; j++) {
    // Compare current element with the next element
    // For descending order, swap if current is SMALLER than the next
    if (numbersToSort[j] < numbersToSort[j + 1]) {
      // Temporary variable to hold the value during swapping
      let temp = numbersToSort[j];

      // Swap values
      numbersToSort[j] = numbersToSort[j + 1];
      numbersToSort[j + 1] = temp;

      // Log the array state after each swap to observe progress
      console.log(`Swapped ${numbersToSort[j + 1]} and ${numbersToSort[j]}:`, numbersToSort);
    }
  }
}

console.log("Sorted Array (Descending):", numbersToSort);
// Output: [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]