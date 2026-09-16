// 🌟 Exercise 1: Intersection Types
type Person = {
  name: string;
  age: number;
};

type Address = {
  street: string;
  city: string;
};

type PersonWithAddress = Person & Address;

const person: PersonWithAddress = {
  name: "Alice",
  age: 30,
  street: "123 Main St",
  city: "Metropolis"
};

// 🌟 Exercise 2: Type Guards with Union Types
function describeValue(value: number | string): string {
  if (typeof value === "number") {
    return "This is a number";
  } else {
    return "This is a string";
  }
}

// 🌟 Exercise 3: Type Casting
let someValue: any = "Hello, TypeScript!";
let strValue: string = someValue as string; // or <string>someValue
console.log(strValue.toUpperCase());

// 🌟 Exercise 4: Type Assertions with Union Types
function getFirstElement(arr: (number | string)[]): string {
  return arr[0] as string;
}

console.log(getFirstElement(["hello", 42])); // "hello"

// 🌟 Exercise 5: Generic Constraints
interface HasLength {
  length: number;
}

function logLength<T extends HasLength>(item: T): void {
  console.log(item.length);
}

logLength("Hello World"); // Logs: 11
logLength([1, 2, 3]);    // Logs: 3

// 🌟 Exercise 6: Intersection Types and Type Guards
type Job = {
  position: string;
  department: string;
};

type Employee = Person & Job;

function describeEmployee(employee: Employee): string {
  if (employee.position.toLowerCase() === "manager") {
    return `${employee.name} manages the ${employee.department} department.`;
  } else if (employee.position.toLowerCase() === "developer") {
    return `${employee.name} develops software in the ${employee.department} department.`;
  }
  return `${employee.name} works as a ${employee.position} in ${employee.department}.`;
}

// 🌟 Exercise 7: Type Assertions and Generic Constraints
interface StringConvertible {
  toString(): string;
}

function formatInput<T extends StringConvertible>(input: T): string {
  const str = input.toString() as string;
  return `Formatted: ${str.toUpperCase()}`;
}