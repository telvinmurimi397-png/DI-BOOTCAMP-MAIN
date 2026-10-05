const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const Parser = require('rss-parser');
const path = require('path');

const app = express();
const parser = new Parser();
const feedUrl = 'https://thefactfile.org/feed/';
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public', 'pages'));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

function getCategories(items) {
  return [...new Set(items.flatMap((item) => {
    const categories = item.categories || item.category || [];
    return (Array.isArray(categories) ? categories : [categories])
      .filter(Boolean)
      .map((category) => String(category).trim());
  }))].sort((first, second) => first.localeCompare(second));
}

async function loadFeed() {
  return parser.parseURL(feedUrl);
}

function renderData(feed, posts = feed.items) {
  return {
    posts,
    categories: getCategories(feed.items),
    feedTitle: feed.title || 'Facts RSS Feed',
    error: null,
  };
}

function renderFeedError(response, page, error, extra = {}) {
  console.error('Unable to load the facts RSS feed:', error.message);
  return response.status(502).render(page, {
    posts: [],
    categories: [],
    feedTitle: 'Facts RSS Feed',
    error: 'The facts feed is temporarily unavailable. Please try again shortly.',
    ...extra,
  });
}

app.get('/', async (request, response) => {
  try {
    const feed = await loadFeed();
    response.render('index', renderData(feed));
  } catch (error) {
    renderFeedError(response, 'index', error);
  }
});

app.get('/search', async (request, response) => {
  try {
    const feed = await loadFeed();
    response.render('search', { ...renderData(feed, []), searchType: '', searchValue: '' });
  } catch (error) {
    renderFeedError(response, 'search', error, { searchType: '', searchValue: '' });
  }
});

app.post('/search/title', async (request, response) => {
  const title = String(request.body.title || '').trim();

  try {
    const feed = await loadFeed();
    const posts = title
      ? feed.items.filter((item) => (item.title || '').toLowerCase().includes(title.toLowerCase()))
      : [];
    response.render('search', { ...renderData(feed, posts), searchType: 'title', searchValue: title });
  } catch (error) {
    renderFeedError(response, 'search', error, { searchType: 'title', searchValue: title });
  }
});

app.post('/search/category', async (request, response) => {
  const category = String(request.body.category || '').trim();

  try {
    const feed = await loadFeed();
    const posts = category
      ? feed.items.filter((item) => {
        const itemCategories = item.categories || item.category || [];
        return (Array.isArray(itemCategories) ? itemCategories : [itemCategories])
          .some((itemCategory) => String(itemCategory).toLowerCase() === category.toLowerCase());
      })
      : [];
    response.render('search', { ...renderData(feed, posts), searchType: 'category', searchValue: category });
  } catch (error) {
    renderFeedError(response, 'search', error, { searchType: 'category', searchValue: category });
  }
});

app.listen(port, () => {
  console.log(`RSS Facts reader listening at http://localhost:${port}`);
});