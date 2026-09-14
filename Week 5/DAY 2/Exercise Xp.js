// Exercise 1: Hello, World! Program
console.log("Hello, World!");

// Exercise 2: Variables
let age = 25;
let name = "Alice";

console.log(age);
console.log(name);

// Exercise 3: Union Types (simulated in JavaScript)
let id;

id = "ABC-123";
id = 101;
console.log(id);

// Exercise 4: Control Flow with if...else
function checkNumber(num) {
    if (num > 0) {
        return "Positive";
    } else if (num < 0) {
        return "Negative";
    } else {
        return "Zero";
    }
}

console.log(checkNumber(5));
console.log(checkNumber(-2));
console.log(checkNumber(0));

// Exercise 5: Tuple Types (simulated as an array)
function getDetails(name, age) {
    const greeting = `Hello, ${name}! You are ${age} years old.`;
    return [name, age, greeting];
}

const details = getDetails("Alice", 25);
console.log(details);

// Exercise 6: Object literals
const person = {
    name: "Bob",
    age: 30,
};

console.log(person);

// Exercise 7: Type Assertions are not needed in JavaScript
const inputElement = document.getElementById("username");

if (inputElement) {
    inputElement.value = "JohnDoe";
}

// Exercise 8: switch Statement with Complex Conditions
function getAction(role) {
    switch (role) {
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

console.log(getAction("admin"));
console.log(getAction("editor"));
console.log(getAction("viewer"));
console.log(getAction("guest"));
console.log(getAction("unknown"));

// Exercise 9: Default parameters
function greet(name = "Guest") {
    return `Hello, ${name}!`;
}

console.log(greet());
console.log(greet("Alice"));