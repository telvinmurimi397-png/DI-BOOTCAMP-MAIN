const lodash = require('lodash');
const math = require('./math');

const sum = math.add(10, 5);
const product = math.multiply(4, 3);

console.log(`Sum: ${sum}`);
console.log(`Product: ${product}`);

const numbers = [10, 20, 30, 40];
console.log('Lodash Mean:', lodash.mean(numbers));