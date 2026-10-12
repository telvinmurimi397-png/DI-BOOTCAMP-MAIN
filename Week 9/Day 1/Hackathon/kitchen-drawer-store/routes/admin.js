const express = require('express');
const db = require('../db/connection');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAdmin);

const CATEGORIES = ['Cooking Tools', 'Cutlery & Cutting', 'Measuring & Prep', 'Storage & Serving'];

/* ---------- Dashboard ---------- */

router.get('/', (req, res) => {
  const stats = {
    products: db.prepare('SELECT COUNT(*) AS c FROM products').get().c,
    orders: db.prepare('SELECT COUNT(*) AS c FROM orders').get().c,
    revenue: db.prepare("SELECT COALESCE(SUM(total), 0) AS s FROM orders WHERE status != 'cancelled'").get().s,
    pending: db.prepare("SELECT COUNT(*) AS c FROM orders WHERE status = 'pending'").get().c,
  };
  const recent = db.prepare(`
    SELECT o.*, u.email FROM orders o
    JOIN users u ON u.id = o.user_id
    ORDER BY o.created_at DESC LIMIT 10
  `).all();
  res.render('admin/dashboard', { title: 'Admin Dashboard', stats, recent });
});

/* ---------- Product management ---------- */

router.get('/products', (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY category, name').all();
  res.render('admin/products', { title: 'Manage Products', products });
});

router.get('/products/new', (req, res) => {
  res.render('admin/product-form', { title: 'Add Product', product: null, categories: CATEGORIES, error: null });
});

router.post('/products', (req, res) => {
  const { name, category, price, stock, emoji, description } = req.body;
  const parsedPrice = Number(price);
  const parsedStock = Number(stock);
  if (!name || !category || isNaN(parsedPrice) || parsedPrice < 0 || isNaN(parsedStock) || parsedStock < 0) {
    return res.render('admin/product-form', {
      title: 'Add Product',
      product: req.body,
      categories: CATEGORIES,
      error: 'Please provide a valid name, category, price (>= 0) and stock (>= 0).',
    });
  }
  db.prepare(`
    INSERT INTO products (name, description, price, stock, category, emoji)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name.trim(), description || '', parsedPrice, parsedStock, category, emoji || '🍳');
  res.redirect('/admin/products');
});

router.get('/products/:id/edit', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.redirect('/admin/products');
  res.render('admin/product-form', { title: 'Edit Product', product, categories: CATEGORIES, error: null });
});

router.post('/products/:id', (req, res) => {
  const { name, category, price, stock, emoji, description } = req.body;
  const parsedPrice = Number(price);
  const parsedStock = Number(stock);
  if (!name || !category || isNaN(parsedPrice) || parsedPrice < 0 || isNaN(parsedStock) || parsedStock < 0) {
    return res.render('admin/product-form', {
      title: 'Edit Product',
      product: { ...req.body, id: req.params.id },
      categories: CATEGORIES,
      error: 'Please provide a valid name, category, price (>= 0) and stock (>= 0).',
    });
  }
  db.prepare(`
    UPDATE products SET name = ?, description = ?, price = ?, stock = ?, category = ?, emoji = ?
    WHERE id = ?
  `).run(name.trim(), description || '', parsedPrice, parsedStock, category, emoji || '🍳', req.params.id);
  res.redirect('/admin/products');
});

router.post('/products/:id/delete', (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.redirect('/admin/products');
});

/* ---------- Order management ---------- */

router.get('/orders', (req, res) => {
  const orders = db.prepare(`
    SELECT o.*, u.email FROM orders o
    JOIN users u ON u.id = o.user_id
    ORDER BY o.created_at DESC
  `).all();
  res.render('admin/orders', { title: 'Manage Orders', orders });
});

router.post('/orders/:id/status', (req, res) => {
  const allowed = ['pending', 'shipped', 'delivered', 'cancelled'];
  const { status } = req.body;
  if (allowed.includes(status)) {
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  }
  res.redirect('/admin/orders');
});

module.exports = router;
