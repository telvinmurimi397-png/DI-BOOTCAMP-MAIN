//Exercise 1 : Divisible by three

JavaScript
let numbers = [123, 8409, 100053, 333333333, 7];

for (let number of numbers) {
  console.log(number % 3 === 0);
}
//Exercise 2 : Attendance

JavaScript
let guestList = {
  randy: "Germany",
  karla: "France",
  wendy: "Japan",
  norman: "England",
  sam: "Argentina"
};

const studentName = prompt("What is your name?")?.toLowerCase();

if (studentName in guestList) {
  console.log(`Hi! I'm ${studentName}, and I'm from ${guestList[studentName]}.`);
} else {
  console.log("Hi! I'm a guest.");
}
//Exercise 3 : Playing with numbers

JavaScript
let age = [20, 5, 12, 43, 98, 55];

// 1. Sum of all numbers
let sum = 0;
for (let i = 0; i < age.length; i++) {
  sum += age[i];
}
console.log("Sum:", sum);

// 2. Highest age in the array
let highest = age[0];
for (let i = 1; i < age.length; i++) {
  if (age[i] > highest) {
    highest = age[i];
  }
}
console.log("Highest age:", highest);