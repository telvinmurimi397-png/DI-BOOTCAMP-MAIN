const express = require('express');
const catalogueController = require('../controllers/catalogueController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(catalogueController.listCategories));

module.exports = router;
