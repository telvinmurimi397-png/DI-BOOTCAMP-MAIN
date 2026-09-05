//Exercise 1: Colors

const colors = ["Blue", "Green", "Red", "Orange", "Violet", "Indigo", "Yellow"];

// 1. Display choices
colors.forEach((color, index) => {
  console.log(`${index + 1}# choice is ${color}.`);
});

// 2. Check for "Violet"
const hasViolet = colors.includes("Violet");
console.log(hasViolet ? "Yeah" : "No...");


//Exercise 2: Colors #2

const colors2 = ["Blue", "Green", "Red", "Orange", "Violet", "Indigo", "Yellow"];
const ordinal = ["th", "st", "nd", "rd"];

colors2.forEach((color, index) => {
  const pos = index + 1;
  const suffix = pos === 1 ? ordinal[1] : pos === 2 ? ordinal[2] : pos === 3 ? ordinal[3] : ordinal[0];
  console.log(`${pos}${suffix} choice is ${color}.`);
});
//Exercise 3: Analyzing

//Code 1 Output: ['bread', 'carrot', 'potato', 'chicken', 'apple', 'orange']

//Explanation: The spread operator (...) expands vegetables and fruits elements inside the new array.

//Code 2 Output: ['U', 'S', 'A']

//Explanation: The spread operator on a string splits it into an array of individual characters.

//Bonus Output: [undefined, undefined]

//Explanation: [,,] creates a sparse array with 2 empty slots. Spreading it expands those empty slots into an array containing two undefined values.

//Exercise 4: Employees

const users = [
  { firstName: 'Bradley', lastName: 'Bouley', role: 'Full Stack Resident' },
  { firstName: 'Chloe', lastName: 'Alnaji', role: 'Full Stack Resident' },
  { firstName: 'Jonathan', lastName: 'Baughn', role: 'Enterprise Instructor' },
  { firstName: 'Michael', lastName: 'Herman', role: 'Lead Instructor' },
  { firstName: 'Robert', lastName: 'Hajek', role: 'Full Stack Resident' },
  { firstName: 'Wes', lastName: 'Reid', role: 'Instructor' },
  { firstName: 'Zach', lastName: 'Klabunde', role: 'Instructor' }
];

// 1. Welcome messages using map()
const welcomeStudents = users.map(user => `Hello ${user.firstName}`);

// 2. Filter Full Stack Residents
const fullStackResidents = users.filter(user => user.role === 'Full Stack Resident');

// 3. Bonus: Chained filter and map for lastNames of Full Stack Residents
const residentLastNames = users
  .filter(user => user.role === 'Full Stack Resident')
  .map(user => user.lastName);
//Exercise 5: Star Wars

const epic = ['a', 'long', 'time', 'ago', 'in a', 'galaxy', 'far far', 'away'];

const result = epic.reduce((acc, word) => `${acc} ${word}`);
console.log(result); // "a long time ago in a galaxy far far away"
//Exercise 6: Employees #2

const students = [
  { name: "Ray", course: "Computer Science", isPassed: true },
  { name: "Liam", course: "Computer Science", isPassed: false },
  { name: "Jenner", course: "Information Technology", isPassed: true },
  { name: "Marco", course: "Robotics", isPassed: true },
  { name: "Kimberly", course: "Artificial Intelligence", isPassed: false },
  { name: "Jamie", course: "Big Data", isPassed: false }
];

// 1. Filter passed students
const passedStudents = students.filter(student => student.isPassed);

// 2. Bonus: Chain filter with forEach to congratulate
students
  .filter(student => student.isPassed)
  .forEach(student => {
    console.log(`Good job ${student.name}, you passed the course in ${student.course}`);
  });