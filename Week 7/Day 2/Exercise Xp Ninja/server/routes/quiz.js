const express = require('express');
const controller = require('../controllers/quiz');

const router = express.Router();

router.get('/questions', controller.getQuestions);
router.post('/answers', controller.submitAnswer);

module.exports = router;