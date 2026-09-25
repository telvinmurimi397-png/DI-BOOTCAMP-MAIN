const fs = require('fs');

fs.readFile('source.txt', 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading source file:', err.message);
    return;
  }

  fs.writeFile('destination.txt', data, 'utf8', (err) => {
    if (err) {
      console.error('Error writing destination file:', err.message);
      return;
    }
    console.log('Successfully copied contents from source.txt to destination.txt');
  });
});