const express = require('express');
const catalogueController = require('../controllers/catalogueController');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { shopParamsSchema, shopsQuerySchema } = require('../validators/catalogueValidators');

const router = express.Router();

router.get('/', validate(shopsQuerySchema, 'query'), asyncHandler(catalogueController.listShops));
router.get('/:slug', validate(shopParamsSchema, 'params'), asyncHandler(catalogueController.getShop));

module.exports = router;
