//Exercise 1: Location

Output:

Plaintext
//I am John Doe from Vancouver, Canada. Latitude(49.2827), Longitude(-123.1207)
//Exercise 2: Display Student Info

JavaScript
function displayStudentInfo(objUser){
    const { first, last } = objUser;
    return `Your full name is ${first} ${last}`;
}

displayStudentInfo({first: 'Elie', last:'Schoppik'});
// Exercise 3: User & id

// Output:

// JavaScript
const users = { user1: 18273, user2: 92833, user3: 90315 };
// JavaScript
console.log(usersArray);
// Output: [ [ 'user1', 18273 ], [ 'user2', 92833 ], [ 'user3', 90315 ] ]
// Part 2:

// JavaScript
// JavaScript
console.log(updatedUsers);
// Output: [ [ 'user1', 36546 ], [ 'user2', 185666 ], [ 'user3', 180630 ] ]
//Exercise 4: Person class

//Output:

//Plaintext
//object
//(In JavaScript, instances of custom classes are of type 'object'.)
//

//Exercise 5: Dog class

//Option 2 is correct:

// JavaScript
class Labrador extends Dog {
  constructor(name, size) {
    super(name);
    this.size = size;
  }
};
// When extending a class, super() must be called before accessing this.

//Exercise 6: Challenges
// JavaScript
//Evaluations:

// [2] === [2] -> false

// {} -> false
// Arrays and objects in JavaScript are evaluated by reference, not by value. Two distinct references are never equal.
// When extending a class, super() must be called before accessing this.
//Property Values:

//object2.number → 4 (Referencing the same object in memory as object1)

//object3.number → 4 (Points to object2, which references object1)
// [2] === [2] -> false
//object4.number → 5 (Separate object instance created independently)

// {} -> false
//Classes Implementation:

// Arrays and objects in JavaScript are evaluated by reference, not by value. Two distinct references are never equal.
// JavaScript
class Animal {
  constructor(name, type, color) {
    this.name = name;
    this.type = type;
    this.color = color;
  }
}

class Mammal extends Animal {
  constructor(name, type, color) {
    super(name, type, color);
  }

  sound(animalSound) {
    return `${animalSound} I'm a ${this.type}, named ${this.name} and I'm ${this.color}`;
  }
}

const farmerCow = new Mammal('Lily', 'cow', 'brown and white');
console.log(farmerCow.sound('Moooo'));
// Output: Moooo I'm a cow, named Lily and I'm brown and white