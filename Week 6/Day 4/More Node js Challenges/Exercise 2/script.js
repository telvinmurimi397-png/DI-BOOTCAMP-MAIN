const getMinutesLived = require('./date');

const birthdate = '1995-06-15';
console.log(`Minutes lived since ${birthdate}: ${getMinutesLived(birthdate)}`);