const wishlistService = require('../services/wishlistService');

async function list(req, res) {
  const products = await wishlistService.getWishlist(req.user.id);
  res.json({ products });
}

async function listIds(req, res) {
  const productIds = await wishlistService.getWishlistIds(req.user.id);
  res.json({ productIds });
}

async function add(req, res) {
  await wishlistService.addItem(req.user.id, req.body.productId);
  res.status(201).json({ message: 'Product saved to your wishlist.' });
}

async function remove(req, res) {
  await wishlistService.removeItem(req.user.id, req.params.productId);
  res.json({ message: 'Product removed from your wishlist.' });
}

module.exports = { list, listIds, add, remove };
