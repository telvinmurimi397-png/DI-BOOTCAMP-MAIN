// Exercise 1: Union Types

function processValue(val) {
  if (typeof val === "number") {
    return `$${val.toFixed(2)}`;
  } else {
    return val.split("").reverse().join("");
  }
}

// Testing Exercise 1
console.log(processValue(100));     // Output: $100.00
console.log(processValue("hello")); // Output: olleh


// Exercise 2: Array Type Annotations

function sumNumbersInArray(arr) {
  let sum = 0;
  for (const item of arr) {
    if (typeof item === "number") {
      sum += item;
    }
  }
  return sum;
}

// Testing Exercise 2
console.log(sumNumbersInArray([10, "apple", 20, "banana", 30])); // Output: 60
console.log(sumNumbersInArray(["a", "b", "c"]));                 // Output: 0


// Exercise 3: Object examples

function introduceAdvancedUser(user) {
  let greeting = `Hello, I'm ${user.name} and I am ${user.age} years old.`;
  if (user.address) {
    greeting += ` I live at ${user.address}.`;
  }
  return greeting;
}

// Testing Exercise 3
const user1 = { name: "Alice", age: 28 };
const user2 = { name: "Bob", age: 34, address: "123 Main St" };

console.log(introduceAdvancedUser(user1));
// Output: Hello, I'm Alice and I am 28 years old.
console.log(introduceAdvancedUser(user2));
// Output: Hello, I'm Bob and I am 34 years old. I live at 123 Main St.


// Exercise 4: Optional Parameters

function welcomeUser(name, greeting = "Hello") {
  return `${greeting}, ${name}!`;
}

// Testing Exercise 4
console.log(welcomeUser("Charlie"));         // Output: Hello, Charlie!
console.log(welcomeUser("Dana", "Welcome")); // Output: Welcome, Dana!