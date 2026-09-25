const fetchAndDisplayPostTitles = require('./fetch-data');

fetchAndDisplayPostTitles().catch((error) => {
  console.error(`Unable to fetch posts: ${error.message}`);
  process.exitCode = 1;
});
