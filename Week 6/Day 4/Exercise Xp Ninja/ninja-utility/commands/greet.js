const chalk = require('chalk');

function greet(name = 'there') {
  console.log(chalk.cyan.bold(`Hello, ${name}! Welcome to Ninja Utility.`));
}

module.exports = greet;
