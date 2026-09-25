const fs = require('fs');

function readFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    console.log(content);
    return content;
  } catch (error) {
    console.error(`Unable to read ${filePath}: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = readFile;
