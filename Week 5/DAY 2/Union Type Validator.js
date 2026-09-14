// Function definition
function validateUnionType(value, allowedTypes) {
  const valueType = typeof value;

  // Check if the runtime type of 'value' matches any type name in 'allowedTypes'
  return allowedTypes.includes(valueType);
}

// Demonstrating usage with various test cases

const allowedTypesList = ["string", "number", "boolean"];

// Test 1: Valid string input
const testString = "Hello, TypeScript!";
console.log(validateUnionType(testString, allowedTypesList));
// Output: true

// Test 2: Valid number input
const testNumber = 42;
console.log(validateUnionType(testNumber, allowedTypesList));
// Output: true

// Test 3: Valid boolean input
const testBoolean = true;
console.log(validateUnionType(testBoolean, allowedTypesList));
// Output: true

// Test 4: Invalid array/object input
const testArray = [1, 2, 3];
console.log(validateUnionType(testArray, allowedTypesList));
// Output: false (typeof testArray is 'object')

// Test 5: Invalid function input
const testFunction = () => {};
console.log(validateUnionType(testFunction, allowedTypesList));
// Output: false (typeof testFunction is 'function')