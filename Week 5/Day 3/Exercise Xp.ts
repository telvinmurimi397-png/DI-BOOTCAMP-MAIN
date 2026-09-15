//Exercise 1: Class with Access Modifiers
class Employee {
  private name: string;
  private salary: number;
  public position: string;
  protected department: string;

  constructor(name: string, salary: number, position: string, department: string) {
    this.name = name;
    this.salary = salary;
    this.position = position;
    this.department = department;
  }

  public getEmployeeInfo(): string {
    return `Employee: ${this.name}, Position: ${this.position}`;
  }
}

// Test case
const emp = new Employee("Alice", 75000, "Developer", "Engineering");
console.log(emp.getEmployeeInfo()); // Output: Employee: Alice, Position: Developer


//Exercise 2: Readonly Properties in a Class
class Product {
  readonly id: number;
  public name: string;
  public price: number;

  constructor(id: number, name: string, price: number) {
    this.id = id;
    this.name = name;
    this.price = price;
  }

  public getProductInfo(): string {
    return `Product: ${this.name}, Price: $${this.price}`;
  }
}

// Test case
const item = new Product(101, "Laptop", 1200);
console.log(item.getProductInfo()); // Output: Product: Laptop, Price: $1200

// Attempting to modify the readonly property (Will cause a TypeScript compilation error)
// item.id = 202; 
// Error: Cannot assign to 'id' because it is a read-only property.


// Exercise 3: Class Inheritance
class Animal {
  public name: string;

  constructor(name: string) {
    this.name = name;
  }

  public makeSound(): string {
    return "Some generic animal sound";
  }
}

class Dog extends Animal {
  constructor(name: string) {
    super(name);
  }

  // Override the makeSound method
  public makeSound(): string {
    return "bark";
  }
}

// Test case
const myDog = new Dog("Buddy");
console.log(myDog.makeSound()); // Output: bark


// Exercise 4: Static Properties and Methods
class Calculator {
  public static add(a: number, b: number): number {
    return a + b;
  }

  public static subtract(a: number, b: number): number {
    return a - b;
  }
}

// Test cases (Calling methods directly on the class without instantiation)
console.log(Calculator.add(15, 5));      // Output: 20
console.log(Calculator.subtract(15, 5)); // Output: 10


// Exercise 5: Extending Interfaces with Optional and Readonly Properties
interface User {
  readonly id: number;
  name: string;
  email: string;
}

interface PremiumUser extends User {
  membershipLevel?: string;
}

function printUserDetails(user: PremiumUser): void {
  console.log(`ID: ${user.id}`);
  console.log(`Name: ${user.name}`);
  console.log(`Email: ${user.email}`);
  if (user.membershipLevel) {
    console.log(`Membership Level: ${user.membershipLevel}`);
  } else {
    console.log(`Membership Level: Standard`);
  }
}

// Test cases
const premiumUser1: PremiumUser = {
  id: 1,
  name: "Charlie",
  email: "charlie@example.com",
  membershipLevel: "Gold"
};

const premiumUser2: PremiumUser = {
  id: 2,
  name: "Diana",
  email: "diana@example.com"
};

printUserDetails(premiumUser1);
printUserDetails(premiumUser2);