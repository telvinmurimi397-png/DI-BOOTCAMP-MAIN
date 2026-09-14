// Exercise 1: Class with access-like concepts

class Employee {
  constructor(name, salary, position, department) {
    this._name = name;
    this._salary = salary;
    this.position = position;
    this.department = department;
  }

  getEmployeeInfo() {
    return `Name: ${this._name}, Position: ${this.position}`;
  }
}

// Testing Exercise 1
const emp = new Employee("Alice", 75000, "Software Engineer", "Engineering");
console.log(emp.getEmployeeInfo()); // Output: Name: Alice, Position: Software Engineer


// Exercise 2: Readonly-like behavior

class Product {
  constructor(id, name, price) {
    this.id = id;
    this.name = name;
    this.price = price;
  }

  getProductInfo() {
    return `Product: ${this.name}, Price: $${this.price}`;
  }
}

// Testing Exercise 2
const item = new Product(101, "Laptop", 1200);
console.log(item.getProductInfo()); // Output: Product: Laptop, Price: $1200

// Attempting to modify readonly-like property:
// item.id = 202;
// This would normally be allowed in JavaScript, but in a real TypeScript version it would be blocked.


// Exercise 3: Class Inheritance

class Animal {
  constructor(name) {
    this.name = name;
  }

  makeSound() {
    return "Some generic animal sound";
  }
}

class Dog extends Animal {
  constructor(name) {
    super(name);
  }

  makeSound() {
    return "bark";
  }
}

// Testing Exercise 3
const myDog = new Dog("Buddy");
console.log(myDog.makeSound()); // Output: bark


// Exercise 4: Static Properties and Methods

class Calculator {
  static add(a, b) {
    return a + b;
  }

  static subtract(a, b) {
    return a - b;
  }
}

// Testing Exercise 4 (Called without instantiating the class)
console.log(Calculator.add(10, 5));      // Output: 15
console.log(Calculator.subtract(10, 5)); // Output: 5


// Exercise 5: Object shapes with optional properties

function printUserDetails(user) {
  console.log(`User ID: ${user.id}`);
  console.log(`Name: ${user.name}`);
  console.log(`Email: ${user.email}`);
  if (user.membershipLevel) {
    console.log(`Membership Level: ${user.membershipLevel}`);
  }
}

// Testing Exercise 5
const standardUser = {
  id: 1,
  name: "Charlie",
  email: "charlie@example.com",
};

const vipUser = {
  id: 2,
  name: "Diana",
  email: "diana@example.com",
  membershipLevel: "Gold",
};

printUserDetails(standardUser);
printUserDetails(vipUser);