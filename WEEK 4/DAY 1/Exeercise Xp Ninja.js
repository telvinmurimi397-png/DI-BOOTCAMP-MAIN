//Exercise 1: Dog age to Human years

JavaScript
const data = [
  { name: 'Butters', age: 3, type: 'dog' },
  { name: 'Cuty', age: 5, type: 'rabbit' },
  { name: 'Lizzy', age: 6, type: 'dog' },
  { name: 'Red', age: 1, type: 'cat' },
  { name: 'Joey', age: 3, type: 'dog' },
  { name: 'Rex', age: 10, type: 'dog' }
];

// 1. Using a loop
let loopSum = 0;
for (const animal of data) {
  if (animal.type === 'dog') {
    loopSum += animal.age * 7;
  }
}
console.log("Loop sum:", loopSum); // 154

// 2. Using reduce()
const reduceSum = data.reduce((acc, animal) => {
  return animal.type === 'dog' ? acc + animal.age * 7 : acc;
}, 0);
console.log("Reduce sum:", reduceSum); // 154
//Exercise 2: Email

//JavaScript
const userEmail3 = ' cannotfillemailformcorrectly@gmail.com ';

// Single line clean-up removing all whitespaces
const cleanedEmail = userEmail3.trim(); // or userEmail3.replace(/\s+/g, '')
//Exercise 3: Employees #3

//JavaScript
const users = [
  { firstName: 'Bradley', lastName: 'Bouley', role: 'Full Stack Resident' },
  { firstName: 'Chloe', lastName: 'Alnaji', role: 'Full Stack Resident' },
  { firstName: 'Jonathan', lastName: 'Baughn', role: 'Enterprise Instructor' },
  { firstName: 'Michael', lastName: 'Herman', role: 'Lead Instructor' },
  { firstName: 'Robert', lastName: 'Hajek', role: 'Full Stack Resident' },
  { firstName: 'Wes', lastName: 'Reid', role: 'Instructor' },
  { firstName: 'Zach', lastName: 'Klabunde', role: 'Instructor' }
];

const userObject = {};
users.forEach(user => {
  const fullName = `${user.firstName} ${user.lastName}`;
  userObject[fullName] = user.role;
});

console.log(userObject);
//Exercise 4: Array to Object

//JavaScript
const letters = ['x', 'y', 'z', 'z'];

// 1. Using a for loop
const countObjLoop = {};
for (const letter of letters) {
  countObjLoop[letter] = (countObjLoop[letter] || 0) + 1;
}
console.log("Loop result:", countObjLoop); // { x: 1, y: 1, z: 2 }

// 2. Using reduce()
const countObjReduce = letters.reduce((acc, letter) => {
  acc[letter] = (acc[letter] || 0) + 1;
  return acc;
}, {});
console.log("Reduce result:", countObjReduce); // { x: 1, y: 1, z: 2 }