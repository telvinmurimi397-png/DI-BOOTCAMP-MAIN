// 🌟 Exercise 1: Combining Intersection Types with Type Guards
interface User {
  name: string;
  email: string;
}

interface Admin {
  adminLevel: number;
}

type AdminUser = User & Admin;

function getProperty(obj: AdminUser, prop: string): any {
  if (prop in obj) {
    return obj[prop as keyof AdminUser];
  }
  return undefined;
}

// 🌟 Exercise 2: Type Casting with Generics
function castToType<T>(value: any, constructorFunc: new (...args: any[]) => T): T {
  return new constructorFunc(value) as T;
}

const num = castToType("123", Number);
const bool = castToType("true", Boolean);

console.log(typeof num, num);   // number 123
console.log(typeof bool, bool); // boolean true

// 🌟 Exercise 3: Type Assertions with Generic Constraints
function getArrayLength<T extends number | string>(arr: T[]): number {
  return (arr as T[]).length;
}

console.log(getArrayLength([1, 2, 3, 4]));         // 4
console.log(getArrayLength(["apple", "banana"]));  // 2

// 🌟 Exercise 4: Generic Interfaces with Class Implementation
interface DataStorage<T> {
  add(item: T): void;
  get(index: number): T | undefined;
}

class Box<T> implements DataStorage<T> {
  private items: T[] = [];

  add(item: T): void {
    this.items.push(item);
  }

  get(index: number): T | undefined {
    return this.items[index];
  }
}

const numberBox = new Box<number>();
numberBox.add(100);
console.log(numberBox.get(0)); // 100

const stringBox = new Box<string>();
stringBox.add("TypeScript");
console.log(stringBox.get(0)); // "TypeScript"

// 🌟 Exercise 5: Combining Generic Classes with Constraints
interface Item<T> {
  value: T;
}

class Queue<T> {
  private items: Item<T>[] = [];

  add(item: Item<T>): void {
    this.items.push(item);
  }

  remove(): Item<T> | undefined {
    return this.items.shift();
  }
}

const numberQueue = new Queue<number>();
numberQueue.add({ value: 42 });
console.log(numberQueue.remove()); // { value: 42 }

const stringQueue = new Queue<string>();
stringQueue.add({ value: "Generics" });
console.log(stringQueue.remove()); // { value: "Generics" }