function returnNumbers(value) {
  return value.match(/\d/g)?.join('') || '';
}

console.log(returnNumbers('k5k3q2g5z6x9bn'));

module.exports = returnNumbers;
