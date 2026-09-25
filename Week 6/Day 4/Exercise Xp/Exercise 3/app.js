const { readFile, writeFile } = require('./fileManager');

// Read content from "Hello World.txt"
const content = readFile('Hello World.txt');

// Write content to "Bye World.txt"
writeFile('Bye World.txt', 'Writing to the file');