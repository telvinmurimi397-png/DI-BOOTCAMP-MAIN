//Exercise 1: Hello, World! Program


console.log("Hello, World!");


//Exercise 2: Type Annotations


let age: number = 25;
let userName: string = "Alice";

console.log(`Name: ${userName}, Age: ${age}`);


//Exercise 3: Union Types


let id: string | number;

id = "12345"; // Valid
console.log(`ID (string): ${id}`);

id = 101;     // Valid
console.log(`ID (number): ${id}`);


//Exercise 4: Control Flow with if...else

function checkNumber(num: number): string {
  if (num > 0) {
    return "Positive";
  } else if (num < 0) {
    return "Negative";
  } else {
    return "Zero";
  }
}

// Test cases
console.log(checkNumber(10));  // Output: Positive
console.log(checkNumber(-5));  // Output: Negative
console.log(checkNumber(0));   // Output: Zero


//Exercise 5: Tuple Types

function getDetails(name: string, age: number): [string, number, string] {
  const greeting = `Hello, ${name}! You are ${age} years old.`;
  return [name, age, greeting];
}

const details = getDetails("Alice", 25);
console.log(details); // Output: ['Alice', 25, 'Hello, Alice! You are 25 years old.']


//Exercise 6: Object Type Annotations

// Define object structure using type alias
type Person = {
  name: string;
  age: number;
};

function createPerson(name: string, age: number): Person {
  return { name, age };
}

const person = createPerson("Bob", 30);
console.log(person); // Output: { name: 'Bob', age: 30 }


//Exercise 7: Type Assertions

if (typeof document !== "undefined") {
  // Assuming <input id="username" type="text" /> exists in your HTML
  const inputElement = document.getElementById("username") as HTMLInputElement | null;

  if (inputElement) {
    inputElement.value = "John Doe";
    console.log(`Updated input value: ${inputElement.value}`);
  }
} else {
  console.log("Browser DOM not available; skipping DOM example.");
}

//Exercise 8: switch Statement with Complex Conditions

function getAction(role: string): string {
  switch (role.toLowerCase()) {
    case "admin":
      return "Manage users and settings";
    case "editor":
      return "Edit content";
    case "viewer":
      return "View content";
    case "guest":
      return "Limited access";
    default:
      return "Invalid role";
  }
}

console.log(getAction("admin"));   // Output: Manage users and settings
console.log(getAction("editor"));  // Output: Edit content
console.log(getAction("viewer"));  // Output: View content
console.log(getAction("guest"));   // Output: Limited access
console.log(getAction("unknown")); // Output: Invalid role


//Exercise 9: Function Overloading with Default Parameters

// Overload Signatures
function greet(): string;
function greet(name: string): string;

// Implementation Signature
function greet(name: string = "Guest"): string {
  return `Hello, ${name}!`;
}

console.log(greet());        // Output: Hello, Guest!
console.log(greet("Sarah")); // Output: Hello, Sarah!