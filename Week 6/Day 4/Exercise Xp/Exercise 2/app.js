import { people } from './data.js';

function calculateAverageAge(persons) {
  if (persons.length === 0) return 0;
  const totalAge = persons.reduce((sum, person) => sum + person.age, 0);
  const average = totalAge / persons.length;
  console.log(`Average Age: ${average.toFixed(2)}`);
  return average;
}

calculateAverageAge(people);