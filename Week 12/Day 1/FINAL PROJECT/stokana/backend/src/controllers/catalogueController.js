const catalogueService = require('../services/catalogueService');
const { notFound } = require('../utils/errors');

async function listProducts(req, res) {
  const result = await catalogueService.listProducts(req.query);
  res.json(result);
}

async function getProduct(req, res) {
  const result = await catalogueService.getProductBySlug(req.params.slug);
  if (!result) throw notFound('That product could not be found.');
  res.json(result);
}

async function listProductReviews(req, res) {
  const product = await catalogueService.getProductSummaryBySlug(req.params.slug);
  if (!product) throw notFound('That product could not be found.');
  const result = await catalogueService.getProductReviews(product.id, req.query.page, req.query.limit);
  res.json(result);
}

async function listCategories(req, res) {
  const categories = await catalogueService.listCategories();
  res.json({ categories });
}

async function listShops(req, res) {
  const shops = await catalogueService.listShops(req.query);
  res.json({ shops });
}

async function getShop(req, res) {
  const shop = await catalogueService.getShopBySlug(req.params.slug);
  if (!shop) throw notFound('That shop could not be found.');
  res.json({ shop });
}

async function stats(req, res) {
  const data = await catalogueService.getCatalogueStats();
  res.json(data);
}

module.exports = { listProducts, getProduct, listProductReviews, listCategories, listShops, getShop, stats };
