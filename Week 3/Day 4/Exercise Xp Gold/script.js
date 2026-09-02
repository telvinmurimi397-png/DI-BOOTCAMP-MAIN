// Exercise 1 : Nested functions

const landscape = () => {
  let result = "";

  const flat = (x) => {
    for (let count = 0; count < x; count++) {
      result += "_";
    }
  };

  const mountain = (x) => {
    result += "/";
    for (let counter = 0; counter < x; counter++) {
      result += "'";
    }
    result += "\\";
  };

  flat(4);
  mountain(4);
  flat(4);

  return result;
};

console.log(landscape());
// Output: ____/''''\____

//Outcome: "____/''''\\____"

//Explanation:

//flat(4) appends 4 underscores (____) to result.

//mountain(4) appends a forward slash (/), 4 single quotes (''''), and a backslash (\) to result.

//The second flat(4) appends 4 more underscores (____) to result.

//landscape() returns the accumulated string "____/''''\\____".

//Refactored with Arrow Functions:


// Exercise 2 : Closure
const addTo = (x) => (y) => x + y;
const addToTen = addTo(10);
console.log(addToTen(3));
//Outcome: 13
//Explanation: addTo(10) creates a function where x = 10 is remembered in its scope. Calling addToTen(3) passes y = 3, returning 10 + 3 = 13.


// Exercise 3 : Currying
const curriedSum = (a) => (b) => a + b;
console.log(curriedSum(30)(1));
// Output: 31
//Explanation: curriedSum(30) assigns a = 30 and immediately returns the second function, which is then called with (1) assigning b = 1, returning 30 + 1 = 31.


// Exercise 4 : Currying
const add5 = curriedSum(5);
console.log(add5(12));
// Output: 17
//Explanation: curriedSum(5) returns a function stored in add5 with a = 5 preserved. Calling add5(12) sets b = 12, returning 5 + 12 = 17.


// Exercise 5 : Composing
const compose = (f, g) => (a) => f(g(a));
const add1 = (num) => num + 1;
const add5Value = (num) => num + 5;
console.log(compose(add1, add5Value)(10));
// Output: 16
//Explanation:
//compose(add1, add5)(10) evaluates the innermost function first: g(a) runs add5(10), returning 15.
//Then f(15) runs add1(15), returning 16.