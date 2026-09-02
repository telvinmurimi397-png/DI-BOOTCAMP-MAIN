// Exercise 1 : Merge Words

// Function Definition
const mergeWords = (string) => (nextString) =>
  nextString === undefined ? string : mergeWords(`${string} ${nextString}`);

// Test Cases
console.log(mergeWords('Hello')()); 
// Output: "Hello"

console.log(mergeWords('There')('is')('no')('spoon.')()); 
// Output: "There is no spoon."

console.log(mergeWords('Advanced')('Javascript')('Functions')()); 
// Output: "Advanced Javascript Functions"

//3. How It Works

//Currying Mechanism: mergeWords(string) receives the initial word and returns an inner arrow function expecting nextString.

//Base Case (nextString === undefined): If invoked with no arguments (), nextString is undefined, so it returns the accumulated string.

//Recursive Case: If a string is passed, it recursively calls mergeWords, concatenating the existing string with the new word (${string} ${nextString}), allowing an infinite chain of function calls.