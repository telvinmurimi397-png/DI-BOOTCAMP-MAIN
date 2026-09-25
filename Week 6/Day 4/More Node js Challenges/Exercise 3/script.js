const getNextHoliday = require('./date');

const nextHoliday = getNextHoliday();

console.log(`Today: ${nextHoliday.today}`);
console.log(`The next holiday is ${nextHoliday.holidayName} on ${nextHoliday.holidayDate}.`);
console.log(`Time remaining: ${nextHoliday.timeRemaining}`);