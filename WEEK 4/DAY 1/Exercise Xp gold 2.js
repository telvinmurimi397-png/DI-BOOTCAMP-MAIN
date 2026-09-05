//Exercise 1: Sum elements

const numbers = [10, 20, 30, 40];

const sum = numbers.reduce((acc, current) => acc + current, 0);
console.log(sum); // 100
//Exercise 2: Remove Duplicates

//JavaScript
const numbersWithDuplicates = [1, 2, 2, 3, 4, 4, 5];

// Using Set
const uniqueNumbers = [...new Set(numbersWithDuplicates)];
console.log(uniqueNumbers); // [1, 2, 3, 4, 5]

// Alternative using filter()
const uniqueWithFilter = numbersWithDuplicates.filter(
  (item, index) => numbersWithDuplicates.indexOf(item) === index
);
//Exercise 3: Remove certain values

//JavaScript
function cleanArray(arr) {
  // Boolean filters out all falsy values: null, 0, "", false, undefined, and NaN
  return arr.filter(Boolean);
}

const sampleArray = [NaN, 0, 15, false, -22, '', undefined, 47, null];
console.log(cleanArray(sampleArray)); // [15, -22, 47]
//Exercise 4: Repeat please !

//JavaScript
function repeat(str, n = 1) {
  return str.repeat(n);
}

console.log(repeat('Ha!', 3)); // "Ha!Ha!Ha!"
//Exercise 5: Turtle & Rabbit

//JavaScript
const startLine = '     ||<- Start line';
let turtle = '🐢';
let rabbit = '🐇';

// 1. Line up Turtle and Rabbit with the start line using padStart
turtle = turtle.padStart(8);
rabbit = rabbit.padStart(8);

console.log(startLine);
console.log(turtle);
console.log(rabbit);
//Part 2 Explanation:

//Running turtle = turtle.trim().padEnd(9, '='); will:

//Remove leading spaces around the emoji via .trim().

//Pad the end of the string with = characters until the total string length reaches 9.

// Output result: '🐢=======' (or similar depending on unicode string length rendering).