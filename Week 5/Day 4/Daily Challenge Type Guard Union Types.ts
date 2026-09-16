// 1. Type Definitions
type User = {
  type: 'user';
  name: string;
  age: number;
};

type Product = {
  type: 'product';
  id: number;
  price: number;
};

type Order = {
  type: 'order';
  orderId: string;
  amount: number;
};

type DataItem = User | Product | Order;

// Custom Type Guards
function isUser(item: DataItem): item is User {
  return item.type === 'user';
}

function isProduct(item: DataItem): item is Product {
  return item.type === 'product';
}

function isOrder(item: DataItem): item is Order {
  return item.type === 'order';
}

// 2 & 3. Main Function handling mixed types and unexpected cases gracefully
function handleData(items: DataItem[]): string[] {
  return items.map((item) => {
    if (isUser(item)) {
      return `Hello, ${item.name}! You are ${item.age} years old.`;
    } else if (isProduct(item)) {
      return `Product ID ${item.id} costs $${item.price}.`;
    } else if (isOrder(item)) {
      return `Order ${item.orderId} total amount is $${item.amount}.`;
    } else {
      // Gracefully handle unexpected object types or invalid data
      return "Unknown data type encountered.";
    }
  });
}

// Example Usage & Testing:
const testData: DataItem[] = [
  { type: 'user', name: 'Alice', age: 28 },
  { type: 'product', id: 101, price: 49.99 },
  { type: 'order', orderId: 'ORD-9876', amount: 150.00 },
];

console.log(handleData(testData));
/*
Output:
[
  "Hello, Alice! You are 28 years old.",
  "Product ID 101 costs $49.99.",
  "Order ORD-9876 total amount is $150."
]
*/