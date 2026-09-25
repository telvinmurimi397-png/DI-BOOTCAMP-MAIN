const readline = require('readline');
const displayWeather = require('./weather');

function startDashboard() {
  const interface = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  interface.question('Enter a city name: ', async (city) => {
    try {
      await displayWeather(city.trim());
    } catch (error) {
      console.error(`Unable to fetch weather: ${error.message}`);
      process.exitCode = 1;
    } finally {
      interface.close();
    }
  });
}

module.exports = startDashboard;
