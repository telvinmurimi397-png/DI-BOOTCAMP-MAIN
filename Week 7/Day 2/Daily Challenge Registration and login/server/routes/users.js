const express = require('express');
const controller = require('../controllers/users');

const router = express.Router();

router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/users', controller.getAll);
router.get('/users/:id', controller.getById);
router.put('/users/:id', controller.update);

module.exports = router;