// Exercise 1: Conditional Types (simulated in JavaScript)

function mapType(val) {
  if (typeof val === "number") {
    return val * val;
  } else {
    return val.length;
  }
}

// Testing Exercise 1
console.log(mapType(5));       // Output: 25
console.log(mapType("hello")); // Output: 5


// Exercise 2: Keyof and Lookup Types (simulated in JavaScript)

function getProperty(obj, key) {
  return obj[key];
}

// Testing Exercise 2
const car = {
  make: "Toyota",
  model: "Corolla",
  year: 2020,
};

const make = getProperty(car, "make");
const year = getProperty(car, "year");

console.log(make); // Output: Toyota
console.log(year); // Output: 2020


// Exercise 3: Using Interfaces with Numeric Properties in TypeScript (simulated in JavaScript)

function multiplyProperty(obj, key, factor) {
  return obj[key] * factor;
}

// Testing Exercise 3
const inventory = {
  apples: 10,
  oranges: 5,
};

console.log(multiplyProperty(inventory, "apples", 3));  // Output: 30
console.log(multiplyProperty(inventory, "oranges", 2)); // Output: 10