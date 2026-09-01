// Exercise 1: Random Number
function logEvenUpToRandom() {
    const randomNumber = Math.floor(Math.random() * 100) + 1;
    console.log(`Random Number: ${randomNumber}`);

    for (let i = 0; i <= randomNumber; i += 2) {
        console.log(i);
    }
}

logEvenUpToRandom();

// Exercise 2: Capitalized letters
function capitalize(str) {
    let evenCaps = "";
    let oddCaps = "";

    for (let i = 0; i < str.length; i++) {
        if (i % 2 === 0) {
            evenCaps += str[i].toUpperCase();
            oddCaps += str[i].toLowerCase();
        } else {
            evenCaps += str[i].toLowerCase();
            oddCaps += str[i].toUpperCase();
        }
    }

    return [evenCaps, oddCaps];
}

console.log(capitalize("abcdef")); // ['AbCdEf', 'aBcDeF']

// Exercise 3: Is palindrome?
function isPalindrome(str) {
    const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, "");
    const reversed = cleaned.split("").reverse().join("");
    return cleaned === reversed;
}

console.log(isPalindrome("madam")); // true
console.log(isPalindrome("kayak")); // true
console.log(isPalindrome("hello")); // false

// Exercise 4: Biggest Number
function biggestNumberInArray(arrayNumber) {
    let max = -Infinity;

    for (const item of arrayNumber) {
        if (typeof item === "number" && !isNaN(item)) {
            if (item > max) {
                max = item;
            }
        }
    }

    return max === -Infinity ? 0 : max;
}

console.log(biggestNumberInArray([-1, 0, 3, 100, 99, 2, 99])); // 100
console.log(biggestNumberInArray(['a', 3, 4, 2])); // 4
console.log(biggestNumberInArray([])); // 0

// Exercise 5: Unique Elements
function getUniqueElements(arr) {
    return Array.from(new Set(arr));
}

console.log(getUniqueElements([1, 2, 3, 3, 3, 3, 4, 5])); // [1, 2, 3, 4, 5]

// Exercise 6: Calendar
function createCalendar(year, month) {
    if (typeof document === "undefined") {
        console.log("Calendar requires a browser DOM. Skip this example in Node.");
        return;
    }

    const monthIndex = month - 1;
    const daysOfWeek = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

    const table = document.createElement("table");
    const headerRow = document.createElement("tr");

    daysOfWeek.forEach(day => {
        const th = document.createElement("th");
        th.textContent = day;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    let firstDayIndex = new Date(year, monthIndex, 1).getDay();
    let startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const totalDays = new Date(year, month, 0).getDate();

    let currentRow = document.createElement("tr");

    for (let i = 0; i < startOffset; i++) {
        const td = document.createElement("td");
        td.textContent = ".";
        currentRow.appendChild(td);
    }

    for (let day = 1; day <= totalDays; day++) {
        if (currentRow.children.length === 7) {
            table.appendChild(currentRow);
            currentRow = document.createElement("tr");
        }

        const td = document.createElement("td");
        td.textContent = day;
        currentRow.appendChild(td);
    }

    while (currentRow.children.length > 0 && currentRow.children.length < 7) {
        const td = document.createElement("td");
        td.textContent = ".";
        currentRow.appendChild(td);
    }

    if (currentRow.children.length > 0) {
        table.appendChild(currentRow);
    }

    document.body.appendChild(table);
}

// Example invocation for September 2012
if (typeof document !== "undefined") {
    createCalendar(2012, 9);
}