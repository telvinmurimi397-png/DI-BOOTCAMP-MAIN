export {};

//Exercise 1: Conditional Types
// 1. Define a Conditional Type
type MappedType<T> = T extends number ? number : T extends string ? number : never;

// 2. Implement the Function
function mapType<T extends number | string>(value: T): MappedType<T> {
  if (typeof value === "number") {
    return (value * value) as MappedType<T>;
  } else {
    return value.length as MappedType<T>;
  }
}

// 3. Test the Function
console.log(mapType(5));       // Output: 25 (5 squared)
console.log(mapType("hello")); // Output: 5 (length of "hello")


//Exercise 2: Keyof and Lookup Types
// 1 & 2. Define the Function with Type Safety using keyof and lookup types T[K]
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// 3. Test the Function
const personData = {
  name: "Alice",
  age: 30,
  isStudent: false
};

const nameValue = getProperty(personData, "name");      // Type: string
const ageValue = getProperty(personData, "age");        // Type: number
const isStudentValue = getProperty(personData, "isStudent"); // Type: boolean

console.log(nameValue);      // Output: Alice
console.log(ageValue);       // Output: 30
console.log(isStudentValue); // Output: false


//Exercise 3: Using Interfaces with Numeric Properties in TypeScript
// 1. Define an Interface with an index signature for numeric properties
interface HasNumericProperty {
  [key: string]: number;
}

// 2. Implement the Function
function multiplyProperty<T extends HasNumericProperty>(
  obj: T,
  key: keyof T & string,
  factor: number
): number {
  const value = obj[key] as number | undefined;

  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`Property ${key} is not numeric.`);
  }

  return value * factor;
}

// 3. Test the Function
const item = {
  price: 50,
  quantity: 3,
  rating: 4.5
};

console.log(multiplyProperty(item, "price", 2));    // Output: 100
console.log(multiplyProperty(item, "quantity", 5)); // Output: 15