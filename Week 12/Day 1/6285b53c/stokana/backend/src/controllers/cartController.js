const cartService = require('../services/cartService');
const catalogueService = require('../services/catalogueService');

async function getCart(req, res) {
  const cart = await cartService.getCart(req.user.id);
  res.json(cart);
}

async function addItem(req, res) {
  await cartService.addItem(req.user.id, req.body.productId, req.body.quantity);
  const cart = await cartService.getCart(req.user.id);
  res.status(201).json({ message: 'Added to your cart.', ...cart });
}

async function updateItem(req, res) {
  await cartService.updateItem(req.user.id, req.params.itemId, req.body.quantity);
  const cart = await cartService.getCart(req.user.id);
  res.json({ message: 'Cart updated.', ...cart });
}

async function removeItem(req, res) {
  await cartService.removeItem(req.user.id, req.params.itemId);
  const cart = await cartService.getCart(req.user.id);
  res.json({ message: 'Item removed from your cart.', ...cart });
}

async function clearCart(req, res) {
  await cartService.clearCart(req.user.id);
  const cart = await cartService.getCart(req.user.id);
  res.json({ message: 'Cart cleared.', ...cart });
}

async function getCartSuggestions(req, res) {
  const result = await catalogueService.listProducts({
    page: 1,
    limit: 4,
    sort: 'popular'
  });
  res.json({ products: result.products });
}

module.exports = { getCart, addItem, updateItem, removeItem, clearCart, getCartSuggestions };
