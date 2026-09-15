//Exercise 1: Class Inheritance with Protected Access Modifiers
class Employee {
  protected name: string;
  protected salary: number;

  constructor(name: string, salary: number) {
    this.name = name;
    this.salary = salary;
  }

  public getDetails(): string {
    return `Name: ${this.name}, Salary: $${this.salary}`;
  }
}

class Manager extends Employee {
  public department: string;

  constructor(name: string, salary: number, department: string) {
    super(name, salary);
    this.department = department;
  }

  // Override getDetails to include department info
  public override getDetails(): string {
    return `Name: ${this.name}, Salary: $${this.salary}, Department: ${this.department}`;
  }
}

// Test case
const manager = new Manager("Sarah", 95000, "Engineering");
console.log(manager.getDetails()); 
// Output: Name: Sarah, Salary: $95000, Department: Engineering


//Exercise 2: Using Readonly with Access Modifiers
class Car {
  public readonly make: string;
  private readonly model: string;
  public year: number;

  constructor(make: string, model: string, year: number) {
    this.make = make;
    this.model = model;
    this.year = year;
  }

  public getCarDetails(): string {
    return `Car: ${this.year} ${this.make} ${this.model}`;
  }
}

// Test case
const myCar = new Car("Toyota", "Corolla", 2022);
console.log(myCar.getCarDetails()); // Output: Car: 2022 Toyota Corolla

// Attempting to modify properties:
// myCar.make = "Honda"; 
// ❌ Error: Cannot assign to 'make' because it is a read-only property.

// myCar.model = "Camry"; 
// ❌ Error: Property 'model' is private and only accessible within class 'Car'.
// ❌ Error: Cannot assign to 'model' because it is a read-only property.

myCar.year = 2024; // ✅ Allowed (year is public and not readonly)


//Exercise 3: Static Properties and Methods in Classes
class MathUtils {
  public static PI: number = 3.14159;

  public static circumference(radius: number): number {
    return 2 * MathUtils.PI * radius;
  }
}

// Test case (Called directly on the class without creating an instance)
console.log(`PI Value: ${MathUtils.PI}`); // Output: PI Value: 3.14159
console.log(`Circumference: ${MathUtils.circumference(5)}`); // Output: Circumference: 31.4159


// Exercise 4: Interface with Function Types
// Define interface representing a function signature
interface Operation {
  (a: number, b: number): number;
}

// Classes implementing/using the Operation interface signature
class Addition {
  public execute: Operation = (a, b) => a + b;
}

class Multiplication {
  public execute: Operation = (a, b) => a * b;
}

// Test cases
const addOp = new Addition();
const multiplyOp = new Multiplication();

console.log(addOp.execute(10, 5));      // Output: 15
console.log(multiplyOp.execute(10, 5)); // Output: 50


//Exercise 5: Extending Interfaces with Optional and Readonly Properties
interface Shape {
  color: string;
  getArea(): number;
}

interface Rectangle extends Shape {
  readonly width: number;
  readonly height: number;
  getPerimeter(): number;
}

class BasicRectangle implements Rectangle {
  public color: string;
  public readonly width: number;
  public readonly height: number;

  constructor(color: string, width: number, height: number) {
    this.color = color;
    this.width = width;
    this.height = height;
  }

  public getArea(): number {
    return this.width * this.height;
  }

  public getPerimeter(): number {
    return 2 * (this.width + this.height);
  }
}

// Test case
const rect = new BasicRectangle("Blue", 10, 5);
console.log(`Color: ${rect.color}`);           // Output: Color: Blue
console.log(`Area: ${rect.getArea()}`);         // Output: Area: 50
console.log(`Perimeter: ${rect.getPerimeter()}`);// Output: Perimeter: 30