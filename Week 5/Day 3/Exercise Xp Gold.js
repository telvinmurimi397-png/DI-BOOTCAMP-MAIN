// Exercise 1: Class Inheritance with protected-like access

class Employee {
  constructor(name, salary) {
    this.name = name;
    this.salary = salary;
  }

  getDetails() {
    return `Name: ${this.name}, Salary: $${this.salary}`;
  }
}

class Manager extends Employee {
  constructor(name, salary, department) {
    super(name, salary);g
    this.department = department;
  }

  getDetails() {
    return `Name: ${this.name}, Salary: $${this.salary}, Department: ${this.department}`;
  }
}

// Testing Exercise 1
const manager = new Manager("Alice Smith", 95000, "Engineering");
console.log(manager.getDetails());
// Output: Name: Alice Smith, Salary: $95000, Department: Engineering


// Exercise 2: Readonly-like behavior

class Car {
  constructor(make, model, year) {
    this.make = make;
    this.model = model;
    this.year = year;
  }

  getCarDetails() {
    return `Car: ${this.year} ${this.make} ${this.model}`;
  }
}

// Testing Exercise 2
const myCar = new Car("Toyota", "Camry", 2022);
console.log(myCar.getCarDetails()); // Output: Car: 2022 Toyota Camry

// Attempting to modify properties:
// myCar.make = "Honda";
// In JavaScript, this would not throw an error. In TypeScript, readonly would prevent it.

// myCar.model = "Civic";
// In JavaScript, this would be allowed. In TypeScript, private would restrict it.


// Exercise 3: Static Properties and Methods in Classes

class MathUtils {
  static PI = 3.14159;

  static circumference(radius) {
    return 2 * MathUtils.PI * radius;
  }
}

// Testing Exercise 3 (Called directly on the class without instantiation)
console.log(MathUtils.circumference(5)); // Output: 31.4159


// Exercise 4: Function type contracts simulated in JavaScript

const add = (a, b) => a + b;
const multiply = (a, b) => a * b;

class Addition {
  execute = (a, b) => a + b;
}

class Multiplication {
  execute = (a, b) => a * b;
}

// Testing Exercise 4
const adder = new Addition();
const multiplier = new Multiplication();

console.log(adder.execute(10, 5));      // Output: 15
console.log(multiplier.execute(10, 5)); // Output: 5


// Exercise 5: Interface-like object contracts in JavaScript

class RectangleImpl {
  constructor(color, width, height) {
    this.color = color;
    this.width = width;
    this.height = height;
  }

  getArea() {
    return this.width * this.height;
  }

  getPerimeter() {
    return 2 * (this.width + this.height);
  }
}

// Testing Exercise 5
const myRect = new RectangleImpl("blue", 10, 5);
console.log(`Color: ${myRect.color}`);          // Output: Color: blue
console.log(`Area: ${myRect.getArea()}`);        // Output: Area: 50
console.log(`Perimeter: ${myRect.getPerimeter()}`); // Output: Perimeter: 30