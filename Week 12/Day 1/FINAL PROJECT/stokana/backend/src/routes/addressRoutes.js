const express = require('express');
const accountController = require('../controllers/accountController');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { requireBuyer } = require('../middleware/auth');
const { addressSchema, addressIdSchema } = require('../validators/addressValidators');

const router = express.Router();
router.use(requireBuyer);
router.get('/', asyncHandler(accountController.listAddresses));
router.post('/', validate(addressSchema), asyncHandler(accountController.createAddress));
router.patch('/:addressId', validate(addressIdSchema, 'params'), validate(addressSchema), asyncHandler(accountController.updateAddress));
router.delete('/:addressId', validate(addressIdSchema, 'params'), asyncHandler(accountController.deleteAddress));

module.exports = router;
