const fs = require('fs');

function readFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    console.log(`Read from ${filePath}:\n${data}`);
    return data;
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
  }
}

function writeFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Successfully wrote to ${filePath}`);
  } catch (err) {
    console.error(`Error writing to ${filePath}:`, err.message);
  }
}

module.exports = { readFile, writeFile };