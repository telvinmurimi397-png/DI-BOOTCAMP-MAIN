// Exercise 1: List of People

// Part I - Review about arrays

const people = ["Greg", "Mary", "Devon", "James"];

// 1. Remove "Greg"
people.shift();

// 2. Replace "James" with "Jason"
people[people.indexOf("James")] = "Jason";

// 3. Add your name to the end
people.push("Alex");

// 4. Console.log Mary's index
console.log(people.indexOf("Mary"));

// 5. Copy using slice (excluding "Mary" and your name)
// Array at this point: ["Mary", "Devon", "Jason", "Alex"]
const peopleCopy = people.slice(1, 3);
console.log(peopleCopy); // ["Devon", "Jason"]

// 6. Index of "Foo"
console.log(people.indexOf("Foo"));
// It returns -1 because "Foo" is not present in the array.

// 7. Get the last element dynamically
const last = people[people.length - 1];
console.log(last);

// Part II - Loops

// 1. Iterate through array
for (let person of people) {
  console.log(person);
}

// 2. Iterate and exit after "Devon"
for (let person of people) {
  console.log(person);
  if (person === "Devon") {
    break;
  }
}

// Exercise 2: Your Favorite Colors

const colors = ["blue", "red", "green", "purple", "yellow"];

// Standard requirement
for (let i = 0; i < colors.length; i++) {
  console.log(`My #${i + 1} choice is ${colors[i]}`);
}

// Bonus requirement
const suffixes = ["st", "nd", "rd", "th", "th"];
for (let i = 0; i < colors.length; i++) {
  console.log(`My ${i + 1}${suffixes[i]} choice is ${colors[i]}`);
}

// Exercise 3: Repeat the Question

const askForNumber = () => {
  if (typeof prompt === "function") {
    return Number(prompt("Please enter a number:"));
  }

  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question("Please enter a number: ", (answer) => {
      rl.close();
      resolve(Number(answer));
    });
  });
};

(async () => {
  // A do...while loop is best here because it runs at least once before checking the condition.
  let number;
  do {
    number = await askForNumber();
  } while (Number.isNaN(number) || number < 10);
})();

// Exercise 4: Building Management

const building = {
  numberOfFloors: 4,
  numberOfAptByFloor: {
    firstFloor: 3,
    secondFloor: 4,
    thirdFloor: 9,
    fourthFloor: 2,
  },
  nameOfTenants: ["Sarah", "Dan", "David"],
  numberOfRoomsAndRent: {
    sarah: [3, 990],
    dan: [4, 1000],
    david: [1, 500],
  },
};

// 2. Number of floors
console.log(building.numberOfFloors);

// 3. Apartments on floors 1 and 3
console.log(building.numberOfAptByFloor.firstFloor + building.numberOfAptByFloor.thirdFloor);

// 4. Second tenant name and room count
const secondTenant = building.nameOfTenants[1];
const rooms = building.numberOfRoomsAndRent[secondTenant.toLowerCase()][0];
console.log(`${secondTenant} has ${rooms} rooms.`);

// 5. Compare rent and conditionally update Dan's rent
const sarahRent = building.numberOfRoomsAndRent.sarah[1];
const davidRent = building.numberOfRoomsAndRent.david[1];
const danRent = building.numberOfRoomsAndRent.dan[1];

if (sarahRent + davidRent > danRent) {
  building.numberOfRoomsAndRent.dan[1] = 1200;
}

// Exercise 5: Family

const family = {
  father: "John",
  mother: "Jane",
  son: "Mark",
  daughter: "Emily",
};

// Log keys
for (let key in family) {
  console.log(key);
}

// Log values
for (let key in family) {
  console.log(family[key]);
}

// Exercise 6: Rudolf

const details = {
  my: "name",
  is: "Rudolf",
  the: "reindeer",
};

let sentence = "";
for (let key in details) {
  sentence += `${key} ${details[key]} `;
}
console.log(sentence.trim());

// Exercise 7: Secret Group

const names = ["Jack", "Philip", "Sarah", "Amanda", "Bernard", "Kyle"];

const secretSociety = names
  .map((name) => name[0])
  .sort()
  .join("");

console.log(secretSociety); // "ABJKPS"