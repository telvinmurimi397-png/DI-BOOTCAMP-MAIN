const sellerService = require('../services/sellerService');
const reviewService = require('../services/reviewService');
const imageService = require('../services/imageService');
const { badRequest } = require('../utils/errors');

async function overview(req, res) {
  const data = await sellerService.getOverview(req.user.id);
  res.json({ ...data, sellerProfile: req.user.sellerProfile });
}

async function listProducts(req, res) {
  const result = await sellerService.listProducts(req.user.id, req.query);
  res.json(result);
}

async function getProduct(req, res) {
  const product = await sellerService.getProduct(req.user.id, req.params.productId);
  res.json({ product });
}

async function createProduct(req, res) {
  const product = await sellerService.createProduct(req.user, req.body);
  res.status(201).json({
    message: 'Product submitted for review. It will appear in the catalogue once approved.',
    product
  });
}

async function updateProduct(req, res) {
  const product = await sellerService.updateProduct(req.user.id, req.params.productId, req.body);
  res.json({ message: 'Product updated.', product });
}

async function updateStock(req, res) {
  const product = await sellerService.updateStock(req.user.id, req.params.productId, req.body.stock);
  res.json({
    message: product.stock === 0
      ? `${product.name} is now sold out and hidden from checkout.`
      : 'Stock updated.',
    product
  });
}

async function archiveProduct(req, res) {
  const product = await sellerService.archiveProduct(req.user.id, req.params.productId);
  res.json({ message: `${product.name} has been archived.`, product });
}

async function addImageByUrl(req, res) {
  const image = await sellerService.addImage(req.user.id, req.params.productId, req.body);
  res.status(201).json({ message: 'Image added.', image });
}

async function uploadSellerImage(req, res) {
  if (!req.file) throw badRequest('Choose an image to upload.');
  const uploaded = await imageService.uploadProductImage(req.file);
  res.status(201).json({ message: 'Image uploaded.', ...uploaded });
}

async function uploadProductImage(req, res) {
  if (!req.file) throw badRequest('Choose an image to upload.');
  if (req.body.altText) req.body.altText = String(req.body.altText).slice(0, 200);
  const uploaded = await imageService.uploadProductImage(req.file);
  const image = await sellerService.addImage(req.user.id, req.params.productId, {
    url: uploaded.url,
    altText: req.body.altText || undefined,
    isPrimary: req.body.isPrimary === 'true'
  });
  res.status(201).json({ message: 'Image uploaded.', image, storage: uploaded.storage });
}

async function setPrimaryImage(req, res) {
  const product = await sellerService.setPrimaryImage(
    req.user.id,
    req.params.productId,
    req.params.imageId
  );
  res.json({ message: 'Primary image updated.', product });
}

async function deleteImage(req, res) {
  const product = await sellerService.deleteImage(
    req.user.id,
    req.params.productId,
    req.params.imageId
  );
  res.json({ message: 'Image removed.', product });
}

async function orders(req, res) {
  const result = await sellerService.getOrders(req.user.id, req.query.page, req.query.limit);
  res.json(result);
}

async function updateShipment(req, res) {
  const result = await sellerService.updateShipment(req.user.id, req.params.shipmentId, req.body);
  res.json({ message: 'Shipment updated.', ...result });
}

async function sales(req, res) {
  const data = await sellerService.getSales(req.user.id);
  res.json(data);
}

async function shop(req, res) {
  const data = await sellerService.getShopProfile(req.user.id);
  res.json({ shop: data });
}

async function updateShop(req, res) {
  const shop = await sellerService.updateShopProfile(req.user.id, req.body);
  res.json({ message: 'Shop profile updated.', shop });
}

async function reviews(req, res) {
  const data = await reviewService.getSellerReviews(req.user.id, 10);
  res.json({ reviews: data });
}

module.exports = {
  overview,
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  updateStock,
  archiveProduct,
  addImageByUrl,
  uploadSellerImage,
  uploadProductImage,
  setPrimaryImage,
  deleteImage,
  orders,
  updateShipment,
  sales,
  shop,
  updateShop,
  reviews
};
