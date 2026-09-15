//Exercise 1: Union Types

function processValue(value: string | number): string {
  if (typeof value === "number") {
    return `$${value.toFixed(2)}`;
  } else {
    return value.split("").reverse().join("");
  }
}

// Test cases
console.log(processValue(100));     // Output: $100.00
console.log(processValue(49.9));    // Output: $49.90
console.log(processValue("hello")); // Output: olleh


//Exercise 2: Array Type Annotations
function sumNumbersInArray(arr: (number | string)[]): number {
  let total = 0;
  for (const item of arr) {
    if (typeof item === "number") {
      total += item;
    }
  }
  return total;
}

// Test cases
console.log(sumNumbersInArray([10, "apple", 20, "orange", 5])); // Output: 35
console.log(sumNumbersInArray(["a", "b", "c"]));               // Output: 0


//Exercise 3: Type Aliases
type AdvancedUser = {
  name: string;
  age: number;
  address?: string;
};

function introduceAdvancedUser(user: AdvancedUser): string {
  if (user.address) {
    return `Hello, my name is ${user.name}, I am ${user.age} years old and I live at ${user.address}.`;
  }
  return `Hello, my name is ${user.name} and I am ${user.age} years old.`;
}

// Test cases
const user1: AdvancedUser = { name: "Alice", age: 28, address: "123 Main St" };
const user2: AdvancedUser = { name: "Bob", age: 34 };

console.log(introduceAdvancedUser(user1)); 
// Output: Hello, my name is Alice, I am 28 years old and I live at 123 Main St.

console.log(introduceAdvancedUser(user2)); 
// Output: Hello, my name is Bob and I am 34 years old.


//Exercise 4: Optional Parameters
function welcomeUser(name: string, greeting?: string): string {
  const actualGreeting = greeting || "Hello";
  return `${actualGreeting}, ${name}!`;
}

// Test cases
console.log(welcomeUser("Sarah"));           // Output: Hello, Sarah!
console.log(welcomeUser("David", "Welcome")); // Output: Welcome, David!