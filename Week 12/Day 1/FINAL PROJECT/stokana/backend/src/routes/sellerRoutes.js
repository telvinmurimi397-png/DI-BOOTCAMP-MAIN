const express = require('express');
const multer = require('multer');
const { badRequest } = require('../utils/errors');
const sellerController = require('../controllers/sellerController');
const promotionController = require('../controllers/promotionController');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const { requireSeller, requireApprovedSeller } = require('../middleware/auth');
const {
  createPromotionSchema,
  promotionParamsSchema,
  promotionActiveSchema
} = require('../validators/promotionValidators');
const {
  createProductSchema,
  updateProductSchema,
  stockSchema,
  addImageSchema,
  imageIdParamsSchema,
  productIdParamsSchema,
  shipmentParamsSchema,
  shipmentUpdateSchema,
  pickupLocationParamsSchema,
  createPickupLocationSchema,
  updatePickupLocationSchema,
  sellerOrdersQuerySchema,
  sellerProductsQuerySchema,
  updateShopSchema
} = require('../validators/sellerValidators');

const router = express.Router();
const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter(req, file, callback) {
    const acceptedTypes = ['text/csv', 'application/csv', 'application/vnd.ms-excel', 'text/plain'];
    if (!file.originalname.toLowerCase().endsWith('.csv') ||
        (file.mimetype !== '' && !acceptedTypes.includes(file.mimetype))) {
      return callback(badRequest('Upload a CSV file.'));
    }
    callback(null, true);
  }
});

router.use(requireSeller);

router.get('/overview', asyncHandler(sellerController.overview));
router.get('/shop', asyncHandler(sellerController.shop));
router.patch('/shop', validate(updateShopSchema), asyncHandler(sellerController.updateShop));
router.get('/pickup-locations', asyncHandler(sellerController.pickupLocations));
router.get('/promotions', asyncHandler(promotionController.listSeller));
router.post(
  '/promotions',
  validate(createPromotionSchema),
  asyncHandler(promotionController.createSeller)
);
router.patch(
  '/promotions/:promotionId',
  validate(promotionParamsSchema, 'params'),
  validate(promotionActiveSchema),
  asyncHandler(promotionController.setSellerActive)
);
router.post(
  '/pickup-locations',
  validate(createPickupLocationSchema),
  asyncHandler(sellerController.savePickupLocation)
);
router.patch(
  '/pickup-locations/:pickupLocationId',
  validate(pickupLocationParamsSchema, 'params'),
  validate(updatePickupLocationSchema),
  asyncHandler(sellerController.savePickupLocation)
);
router.delete(
  '/pickup-locations/:pickupLocationId',
  validate(pickupLocationParamsSchema, 'params'),
  asyncHandler(sellerController.deletePickupLocation)
);
router.get('/products', validate(sellerProductsQuerySchema, 'query'), asyncHandler(sellerController.listProducts));
router.post(
  '/products/import',
  requireApprovedSeller,
  csvUpload.single('file'),
  asyncHandler(sellerController.importProducts)
);
router.get(
  '/products/:productId',
  validate(productIdParamsSchema, 'params'),
  asyncHandler(sellerController.getProduct)
);
router.post(
  '/products',
  requireApprovedSeller,
  validate(createProductSchema),
  asyncHandler(sellerController.createProduct)
);
router.patch(
  '/products/:productId',
  requireApprovedSeller,
  validate(productIdParamsSchema, 'params'),
  validate(updateProductSchema),
  asyncHandler(sellerController.updateProduct)
);
router.patch(
  '/products/:productId/stock',
  requireApprovedSeller,
  validate(productIdParamsSchema, 'params'),
  validate(stockSchema),
  asyncHandler(sellerController.updateStock)
);
router.delete(
  '/products/:productId',
  requireApprovedSeller,
  validate(productIdParamsSchema, 'params'),
  asyncHandler(sellerController.archiveProduct)
);

router.post(
  '/uploads',
  requireApprovedSeller,
  upload.single('image'),
  asyncHandler(sellerController.uploadSellerImage)
);
router.post(
  '/products/:productId/images/upload',
  requireApprovedSeller,
  upload.single('image'),
  validate(productIdParamsSchema, 'params'),
  asyncHandler(sellerController.uploadProductImage)
);
router.post(
  '/products/:productId/images',
  requireApprovedSeller,
  validate(productIdParamsSchema, 'params'),
  validate(addImageSchema),
  asyncHandler(sellerController.addImageByUrl)
);
router.patch(
  '/products/:productId/images/:imageId/primary',
  requireApprovedSeller,
  validate(imageIdParamsSchema, 'params'),
  asyncHandler(sellerController.setPrimaryImage)
);
router.delete(
  '/products/:productId/images/:imageId',
  requireApprovedSeller,
  validate(imageIdParamsSchema, 'params'),
  asyncHandler(sellerController.deleteImage)
);

router.get('/orders', validate(sellerOrdersQuerySchema, 'query'), asyncHandler(sellerController.orders));
router.patch(
  '/shipments/:shipmentId',
  validate(shipmentParamsSchema, 'params'),
  validate(shipmentUpdateSchema),
  asyncHandler(sellerController.updateShipment)
);

router.get('/sales', asyncHandler(sellerController.sales));
router.get('/reviews', asyncHandler(sellerController.reviews));

module.exports = router;
