// 🌟 Exercise 1: TypeScript Generics and Intersection Types
type Identifiable = { id: number };
type Named = { name: string };

type Entity = Identifiable & Named;

class Container<T extends Identifiable> {
  private items: T[] = [];

  add(item: T): void {
    this.items.push(item);
  }

  remove(id: number): void {
    this.items = this.items.filter(item => item.id !== id);
  }

  list(): T[] {
    return this.items;
  }
}

// Example usage:
const container = new Container<Entity>();
container.add({ id: 1, name: "Item A" });
container.add({ id: 2, name: "Item B" });
container.remove(1);
console.log(container.list()); // [{ id: 2, name: "Item B" }]

// 🌟 Exercise 2: Generic Interfaces and Type Casting
interface ResponseData<T> {
  status: number;
  data: any;
}

function parseResponse<T>(response: ResponseData<T>): T {
  return response.data as T;
}

// Example usage:
interface UserProfile {
  username: string;
  email: string;
}

const apiResponse: ResponseData<UserProfile> = {
  status: 200,
  data: { username: "johndoe", email: "john@example.com" }
};

const user = parseResponse<UserProfile>(apiResponse);
console.log(user.username); // "johndoe"

// 🌟 Exercise 3: Generic Classes and Type Assertions
class Repository<T> {
  private items: any[] = [];

  add(item: T): void {
    this.items.push(item);
  }

  retrieve(index: number): T {
    return this.items[index] as T;
  }

  list(): T[] {
    return this.items as T[];
  }
}

// Example usage:
const repo = new Repository<string>();
repo.add("First Entry");
repo.add("Second Entry");
console.log(repo.retrieve(0)); // "First Entry"
console.log(repo.list());     // ["First Entry", "Second Entry"]