const readline = require('readline');

function isValidFullName(fullName) {
  return /^[A-Z][a-z]+ [A-Z][a-z]+$/.test(fullName);
}

function askForFullName() {
  const interface = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  interface.question('Enter your full name: ', (fullName) => {
    console.log(isValidFullName(fullName) ? 'Valid full name.' : 'Invalid full name.');
    interface.close();
  });
}

if (require.main === module) {
  askForFullName();
}

module.exports = { isValidFullName, askForFullName };
