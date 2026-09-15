function validateUnionType(value: any, allowedTypes: string[]): boolean {
  const valueType = typeof value;
  
  // Iterate through the array of allowed types using a loop
  for (const type of allowedTypes) {
    if (valueType === type) {
      return true;
    }
  }
  
  return false;
}

// Alternative concise version using Array.prototype.includes
// function validateUnionType(value: any, allowedTypes: string[]): boolean {
//   return allowedTypes.includes(typeof value);
// }

// --- Demonstration and Testing ---

const allowedTypes = ["string", "number", "boolean"];

// Valid cases
console.log(validateUnionType("Hello", allowedTypes)); // Output: true (type is 'string')
console.log(validateUnionType(42, allowedTypes));      // Output: true (type is 'number')
console.log(validateUnionType(true, allowedTypes));    // Output: true (type is 'boolean')

// Invalid cases
console.log(validateUnionType([1, 2, 3], allowedTypes)); // Output: false (type is 'object')
console.log(validateUnionType({ key: "val" }, allowedTypes)); // Output: false (type is 'object')
console.log(validateUnionType(() => {}, allowedTypes));  // Output: false (type is 'function')
console.log(validateUnionType(undefined, allowedTypes)); // Output: false (type is 'undefined')