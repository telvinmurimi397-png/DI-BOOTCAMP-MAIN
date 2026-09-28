const express = require('express');

const router = express.Router();

// Exercise 1: basic homepage and About Us routes.
router.get('/', (req, res) => {
  res.send('Welcome to the homepage!');
});

router.get('/about', (req, res) => {
  res.send('About Us: a simple Express.js application using express.Router.');
});

module.exports = router;