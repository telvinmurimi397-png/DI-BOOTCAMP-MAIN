//Exercise 1: print Full Name

function printFullName({ first, last }) {
  return `Your full name is ${first} ${last}`;
}

printFullName({ first: 'Elie', last: 'Schoppik' });
// Output: 'Your full name is Elie Schoppik'
// Exercise 2: keys and values

function keysAndValues(obj) {
  const sortedKeys = Object.keys(obj).sort();
  const values = sortedKeys.map(key => obj[key]);
  
  return [sortedKeys, values];
}

// Examples:
console.log(keysAndValues({ a: 1, b: 2, c: 3 }));
// ➞ [["a", "b", "c"], [1, 2, 3]]

console.log(keysAndValues({ a: "Apple", b: "Microsoft", c: "Google" }));
// ➞ [["a", "b", "c"], ["Apple", "Microsoft", "Google"]]

console.log(keysAndValues({ key1: true, key2: false, key3: undefined }));
// ➞ [["key1", "key2", "key3"], [true, false, undefined]]
// Exercise 3: Counter class

// Output:

// Plaintext
// 3
// Explanation:

// counterTwo is assigned counterOne, which copies the object reference rather than creating a new instance. When counterTwo.increment() is called, it modifies the same count property in memory that counterOne references. Since increment() was called twice on counterOne and once on counterTwo, count increments three times in total.