const axios = require('axios');

async function fetchPosts(limit = 5) {
  const response = await axios.get('https://jsonplaceholder.typicode.com/posts');
  const posts = response.data.slice(0, Number(limit));

  posts.forEach((post) => {
    console.log(`#${post.id}: ${post.title}`);
  });

  return posts;
}

module.exports = fetchPosts;
