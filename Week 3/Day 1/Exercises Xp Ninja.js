// Exercise 1: Checking the BMI

// Person 1 object
const person1 = {
  fullName: "John Doe",
  mass: 80, // weight in kg
  height: 1.8, // height in meters
  calculateBMI: function () {
    this.bmi = this.mass / (this.height * this.height);
    return this.bmi;
  },
};

// Person 2 object
const person2 = {
  fullName: "Jane Smith",
  mass: 65, // weight in kg
  height: 1.65, // height in meters
  calculateBMI: function () {
    this.bmi = this.mass / (this.height * this.height);
    return this.bmi;
  },
};

// Function to compare BMIs
function compareBMI(obj1, obj2) {
  const bmi1 = obj1.calculateBMI();
  const bmi2 = obj2.calculateBMI();

  if (bmi1 > bmi2) {
    console.log(`${obj1.fullName} has the largest BMI (${bmi1.toFixed(2)}).`);
  } else if (bmi2 > bmi1) {
    console.log(`${obj2.fullName} has the largest BMI (${bmi2.toFixed(2)}).`);
  } else {
    console.log(
      `Both ${obj1.fullName} and ${obj2.fullName} have the same BMI (${bmi1.toFixed(2)}).`
    );
  }
}

// Call the function
compareBMI(person1, person2);

// Exercise 2: Grade Average

// Standard Implementation
function findAvg(gradesList) {
  let sum = 0;
  for (let i = 0; i < gradesList.length; i++) {
    sum += gradesList[i];
  }

  const average = sum / gradesList.length;
  console.log(`Average: ${average.toFixed(2)}`);

  if (average > 65) {
    console.log("You passed!");
  } else {
    console.log("You failed and must repeat the course.");
  }
}

// Test call:
findAvg([70, 85, 60, 90]);

// Bonus Implementation (Separated Functions)

// Function 1: Calculates the average
function calculateAverage(grades) {
  let sum = 0;
  for (let i = 0; i < grades.length; i++) {
    sum += grades[i];
  }
  return sum / grades.length;
}

// Function 2: Displays result and calls calculateAverage
function findAvgBonus(gradesList) {
  const average = calculateAverage(gradesList);
  console.log(`Average: ${average.toFixed(2)}`);

  if (average > 65) {
    console.log("You passed!");
  } else {
    console.log("You failed and must repeat the course.");
  }
}

// Test call:
findAvgBonus([50, 60, 65, 40]);