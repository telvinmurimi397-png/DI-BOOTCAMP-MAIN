// Exercise 1: Advanced Access Modifiers and Inheritance

class Employee {
  constructor(name, age, salary) {
    this.name = name;
    this.age = age;
    this.salary = salary;
  }

  calculateBonus(percent = 0.1) {
    return this.salary * percent;
  }

  getSalaryDetails() {
    return `Salary: $${this.salary}`;
  }
}

class Manager extends Employee {
  getSalaryDetails() {
    const bonus = this.calculateBonus(0.15);
    return `Manager Salary: $${this.salary}, Bonus: $${bonus}`;
  }
}

class ExecutiveManager extends Manager {
  approveBudget(amount) {
    return `Executive ${this.name} approved budget of $${amount}`;
  }
}

// Testing Exercise 1
const exec = new ExecutiveManager("Sarah", 45, 120000);
console.log(exec.name);
console.log(exec.getSalaryDetails());
console.log(exec.approveBudget(50000));

// Encapsulation checks are conceptual only in JavaScript
// console.log(exec.age);
// console.log(exec.salary);


// Exercise 2: Advanced Static Methods and Properties

class Shape {
  static totalShapes = 0;

  constructor() {
    Shape.totalShapes++;
  }

  static getType() {
    return "Generic Shape";
  }
}

class Circle extends Shape {
  constructor(radius) {
    super();
    this.radius = radius;
  }

  static getType() {
    return "Circle";
  }

  getArea() {
    return Math.PI * this.radius ** 2;
  }
}

class Square extends Shape {
  constructor(sideLength) {
    super();
    this.sideLength = sideLength;
  }

  static getType() {
    return "Square";
  }

  getArea() {
    return this.sideLength ** 2;
  }
}

// Testing Exercise 2
console.log(Shape.getType());
console.log(Circle.getType());
console.log(Square.getType());

const c1 = new Circle(5);
const s1 = new Square(4);
const c2 = new Circle(2);

console.log(`Total shapes created: ${Shape.totalShapes}`);


// Exercise 3: Complex Interfaces with Function Types

class AdvancedCalculator {
  constructor(a, b) {
    this.a = a;
    this.b = b;
  }

  operate(operation) {
    return operation(this.a, this.b);
  }

  add = (x, y) => x + y;
  subtract = (x, y) => x - y;
  multiply = (x, y) => x * y;
}

// Testing Exercise 3
const calc = new AdvancedCalculator(12, 4);

console.log(calc.operate(calc.add));
console.log(calc.operate(calc.subtract));
console.log(calc.operate(calc.multiply));
console.log(calc.operate((x, y) => x / y));


// Exercise 4: Readonly Properties in Complex Inheritance

class Device {
  constructor(serialNumber) {
    this.serialNumber = serialNumber;
  }

  getDeviceInfo() {
    return `SN: ${this.serialNumber}`;
  }
}

class Laptop extends Device {
  constructor(serialNumber, model, price) {
    super(serialNumber);
    this.model = model;
    this.price = price;
  }

  getDeviceInfo() {
    return `Model: ${this.model}, Price: $${this.price}, SN: ${this.serialNumber}`;
  }
}

// Testing Exercise 4
const myLaptop = new Laptop("SN-987654", "MacBook Pro", 2000);
console.log(myLaptop.getDeviceInfo());

// Updating price and model:
myLaptop.price = 1800;
myLaptop.model = "MacBook Pro M3";
console.log(myLaptop.getDeviceInfo());

// Attempting to edit serial number would be allowed in JavaScript, but would be blocked in TypeScript readonly mode.


// Exercise 5: Object contracts in JavaScript

class Smartphone {
  constructor(name, price, warrantyPeriod, discount) {
    this.name = name;
    this.price = price;
    this.warrantyPeriod = warrantyPeriod;
    this.discount = discount;
  }

  calculateDiscountedPrice() {
    if (this.discount) {
      return this.price * (1 - this.discount);
    }
    return this.price;
  }
}

// Testing Exercise 5
const phoneWithoutDiscount = new Smartphone("Galaxy S23", 800, 12);
const phoneWithDiscount = new Smartphone("iPhone 15", 1000, 24, 0.15);

console.log(phoneWithoutDiscount.calculateDiscountedPrice());
console.log(phoneWithDiscount.calculateDiscountedPrice());

// Changing name would be allowed in JavaScript, but read-only would block it in TypeScript.