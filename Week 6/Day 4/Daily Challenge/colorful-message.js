const chalk = require('chalk');

function displayColorfulMessage() {
  console.log(chalk.green.bold('Node.js modules make coding colorful!'));
}

module.exports = displayColorfulMessage;