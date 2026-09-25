const axios = require('axios');
const chalk = require('chalk');

async function displayWeather(city) {
  const response = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
  const current = response.data.current_condition[0];
  const temperature = current.temp_C;
  const description = current.weatherDesc[0].value;

  console.log(chalk.yellow(`\nWeather for ${city}`));
  console.log(chalk.cyan(`Temperature: ${temperature} C`));
  console.log(chalk.green(`Conditions: ${description}`));

  return { city, temperature, description };
}

module.exports = displayWeather;
