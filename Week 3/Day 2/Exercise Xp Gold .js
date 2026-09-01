// Exercise 1: is_Blank
function isBlank(str) {
    return str.trim().length === 0;
}

console.log(isBlank('')); // true
console.log(isBlank('abc')); // false

// Exercise 2: Abbrev_name
function abbrevName(name) {
    const parts = name.trim().split(" ");
    if (parts.length > 1) {
        return `${parts[0]} ${parts[1].charAt(0).toUpperCase()}.`;
    }
    return parts[0];
}

console.log(abbrevName("Robin Singh")); // "Robin S."

// Exercise 3: SwapCase
function swapCase(str) {
    return str
        .split("")
        .map(char => {
            if (char === char.toUpperCase()) {
                return char.toLowerCase();
            } else {
                return char.toUpperCase();
            }
        })
        .join("");
}

console.log(swapCase('The Quick Brown Fox')); // "tHE qUICK bROWN fOX"

// Exercise 4: Omnipresent value
function isOmnipresent(arr, val) {
    return arr.every(subarray => subarray.includes(val));
}

console.log(isOmnipresent([[1, 1], [1, 3], [5, 1], [6, 1]], 1)); // true
console.log(isOmnipresent([[1, 1], [1, 3], [5, 1], [6, 1]], 6)); // false

// Exercise 5: Red table
// Add this code inside the <script> tag in your HTML file:
if (typeof document !== "undefined") {
    const table = document.body.firstElementChild;

    for (let i = 0; i < table.rows.length; i++) {
        // The diagonal cell for row i is at index i
        const cell = table.rows[i].cells[i];
        cell.style.backgroundColor = "red";
    }
}