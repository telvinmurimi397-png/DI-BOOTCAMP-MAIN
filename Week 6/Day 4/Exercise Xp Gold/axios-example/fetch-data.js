const axios = require('axios');

async function fetchAndDisplayPostTitles() {
  const response = await axios.get('https://jsonplaceholder.typicode.com/posts');

  response.data.forEach((post) => {
    console.log(post.title);
  });
}

module.exports = fetchAndDisplayPostTitles;
