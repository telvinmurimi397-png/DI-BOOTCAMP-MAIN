const { addDays, format } = require('date-fns');

function displayDateAfterFiveDays() {
  const currentDate = new Date();
  const futureDate = addDays(currentDate, 5);
  const formattedDate = format(futureDate, 'yyyy-MM-dd HH:mm:ss');

  console.log(`Date in 5 days: ${formattedDate}`);
  return formattedDate;
}

module.exports = displayDateAfterFiveDays;
