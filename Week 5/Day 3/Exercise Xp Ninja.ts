//Exercise 1: Advanced Access Modifiers and Inheritance
class Employee {
  public name: string;
  private age: number;
  protected salary: number;

  constructor(name: string, age: number, salary: number) {
    this.name = name;
    this.age = age;
    this.salary = salary;
  }

  protected calculateBonus(): number {
    return this.salary * 0.1; // 10% bonus
  }

  public getSalaryDetails(): string {
    return `Employee ${this.name} salary: $${this.salary}`;
  }
}

class Manager extends Employee {
  constructor(name: string, age: number, salary: number) {
    super(name, age, salary);
  }

  // Override getSalaryDetails to include bonus calculation
  public override getSalaryDetails(): string {
    const bonus = this.calculateBonus();
    const total = this.salary + bonus;
    return `Manager ${this.name} base salary: $${this.salary}, bonus: $${bonus}, total: $${total}`;
  }
}

class ExecutiveManager extends Manager {
  constructor(name: string, age: number, salary: number) {
    super(name, age, salary);
  }

  public approveBudget(amount: number): void {
    console.log(`Executive Manager ${this.name} approved a budget of $${amount}`);
  }
}

// Test case & Encapsulation Verification
const exec = new ExecutiveManager("Alice", 45, 120000);

console.log(exec.name); // ✅ Public property: "Alice"
console.log(exec.getSalaryDetails()); // ✅ Manager salary details with bonus
exec.approveBudget(50000); // ✅ "Executive Manager Alice approved a budget of $50000"

// Encapsulation Checks (TypeScript compiler errors):
// exec.age;             // ❌ Error: Property 'age' is private and only accessible within class 'Employee'.
// exec.salary;          // ❌ Error: Property 'salary' is protected and only accessible within class 'Employee' and its subclasses.
// exec.calculateBonus();// ❌ Error: Property 'calculateBonus' is protected.


//Exercise 2: Advanced Static Methods and Properties
class Shape {
  public static totalShapes: number = 0;

  constructor() {
    Shape.totalShapes++;
  }

  public static getType(): string {
    return "Generic Shape";
  }
}

class Circle extends Shape {
  public radius: number;

  constructor(radius: number) {
    super();
    this.radius = radius;
  }

  public getArea(): number {
    return Math.PI * this.radius * this.radius;
  }

  public static override getType(): string {
    return "Circle";
  }
}

class Square extends Shape {
  public side: number;

  constructor(side: number) {
    super();
    this.side = side;
  }

  public getArea(): number {
    return this.side * this.side;
  }

  public static override getType(): string {
    return "Square";
  }
}

// Test cases
const c1 = new Circle(5);
const s1 = new Square(4);
const c2 = new Circle(3);

console.log(`Circle Area: ${c1.getArea().toFixed(2)}`); // Output: 78.54
console.log(`Square Area: ${s1.getArea()}`);            // Output: 16

console.log(Shape.getType());  // Output: Generic Shape
console.log(Circle.getType()); // Output: Circle
console.log(Square.getType()); // Output: Square

console.log(`Total Shapes Created: ${Shape.totalShapes}`); // Output: 3


//Exercise 3: Complex Interfaces with Function Types
// Define interface with function type parameter
interface Calculator {
  a: number;
  b: number;
  operate(operation: (a: number, b: number) => number): number;
}

class AdvancedCalculator implements Calculator {
  public a: number;
  public b: number;

  constructor(a: number, b: number) {
    this.a = a;
    this.b = b;
  }

  public operate(operation: (a: number, b: number) => number): number {
    return operation(this.a, this.b);
  }

  // Operation helper methods
  public add(a: number, b: number): number {
    return a + b;
  }

  public subtract(a: number, b: number): number {
    return a - b;
  }

  public multiply(a: number, b: number): number {
    return a * b;
  }
}

// Test case
const calc = new AdvancedCalculator(20, 5);

console.log(calc.operate(calc.add));      // Output: 25
console.log(calc.operate(calc.subtract)); // Output: 15
console.log(calc.operate(calc.multiply)); // Output: 100

// Using an inline lambda operation
console.log(calc.operate((x, y) => x / y)); // Output: 4


//Exercise 4: Readonly Properties in Complex Inheritance
class Device {
  public readonly serialNumber: string;

  constructor(serialNumber: string) {
    this.serialNumber = serialNumber;
  }

  public getDeviceInfo(): string {
    return `Serial Number: ${this.serialNumber}`;
  }
}

class Laptop extends Device {
  public model: string;
  public price: number;

  constructor(serialNumber: string, model: string, price: number) {
    super(serialNumber);
    this.model = model;
    this.price = price;
  }

  public override getDeviceInfo(): string {
    return `Laptop [${this.model}] - Serial: ${this.serialNumber}, Price: $${this.price}`;
  }
}

// Test case
const myLaptop = new Laptop("SN-987654", "MacBook Pro", 2000);
console.log(myLaptop.getDeviceInfo()); // Output: Laptop [MacBook Pro] - Serial: SN-987654, Price: $2000

// Modifying allowable fields
myLaptop.model = "MacBook Pro M3";
myLaptop.price = 2200;
console.log(myLaptop.getDeviceInfo()); // Updated details

// Attempting to modify readonly property:
// myLaptop.serialNumber = "SN-000000"; 
// ❌ Error: Cannot assign to 'serialNumber' because it is a read-only property.


//Exercise 5: Extending Multiple Interfaces with Optional and Readonly Properties
interface Product {
  readonly name: string;
  price: number;
  discount?: number; // Optional percentage (e.g. 10 for 10%)
}

interface Electronics extends Product {
  warrantyPeriod: number; // in months
}

class Smartphone implements Electronics {
  public readonly name: string;
  public price: number;
  public discount?: number;
  public warrantyPeriod: number;

  constructor(name: string, price: number, warrantyPeriod: number, discount?: number) {
    this.name = name;
    this.price = price;
    this.warrantyPeriod = warrantyPeriod;

    if (discount !== undefined) {
      this.discount = discount;
    }
  }

  public getFinalPrice(): number {
    if (this.discount) {
      return this.price - (this.price * (this.discount / 100));
    }
    return this.price;
  }
}

// Test cases
const phone1 = new Smartphone("iPhone 15", 999, 24, 10);
const phone2 = new Smartphone("Pixel 8", 699, 12);

console.log(`${phone1.name} Final Price: $${phone1.getFinalPrice()}`); // Output: $899.1
console.log(`${phone2.name} Final Price: $${phone2.getFinalPrice()}`); // Output: $699

// Immutability Check:
// phone1.name = "iPhone 16"; 
// ❌ Error: Cannot assign to 'name' because it is a read-only property.