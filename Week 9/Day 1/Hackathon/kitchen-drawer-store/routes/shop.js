const express = require('express');
const db = require('../db/connection');
const categories = require('../db/categories');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function getCartItems(req) {
  return (req.session.cart || [])
    .map((item) => {
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.id);
      return product ? { ...product, qty: item.qty } : null;
    })
    .filter(Boolean);
}

/* ---------- Storefront ---------- */

router.get('/', (req, res) => {
  const categoryCards = categories.map((name) => ({
    name,
    count: db.prepare('SELECT COUNT(*) AS count FROM products WHERE category = ?').get(name).count,
    description: {
      'Baking Tools': 'Reliable essentials for mixing, shaping and baking.',
      'Cooking Tools': 'Everyday helpers for stirring, flipping and serving.',
      'Cutlery & Cutting': 'Sharp, practical tools for confident prep.',
      'Prep Tools': 'Make chopping, measuring and prep feel easier.',
    }[name],
  }));
  const featuredProducts = categories
    .map((category) => db.prepare(
      'SELECT * FROM products WHERE category = ? AND stock > 0 ORDER BY id LIMIT 1'
    ).get(category))
    .filter(Boolean);

  res.render('home', { title: 'Home', categoryCards, featuredProducts });
});

router.get('/shop', (req, res) => {
  const { category, q } = req.query;
  let sql = 'SELECT * FROM products WHERE 1=1';
  const params = [];
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  if (q) {
    sql += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }
  sql += ' ORDER BY category, name';

  const products = db.prepare(sql).all(...params);
  const categoryGroups = !category && !q
    ? categories
      .map((name) => ({ name, products: products.filter((product) => product.category === name) }))
      .filter((group) => group.products.length > 0)
    : [];

  res.render('index', {
    title: 'Shop',
    products,
    categories,
    categoryGroups,
    activeCategory: category || '',
    q: q || '',
  });
});

router.get('/product/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).render('404', { title: 'Product Not Found' });
  res.render('product', { title: product.name, product });
});

/* ---------- Cart ---------- */

router.get('/cart', (req, res) => {
  const cart = getCartItems(req);
  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  res.render('cart', { title: 'Your Cart', cart, total });
});

router.post('/cart/add', (req, res) => {
  const id = Number(req.body.id);
  const qty = Math.max(1, Number(req.body.qty) || 1);
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);

  if (!product) return res.redirect('/shop');
  if (product.stock < 1) {
    req.session.message = `"${product.name}" is out of stock.`;
    return res.redirect(`/product/${id}`);
  }

  const cart = req.session.cart || [];
  const existing = cart.find((i) => i.id === id);
  const newQty = (existing ? existing.qty : 0) + qty;

  if (newQty > product.stock) {
    req.session.message = `Only ${product.stock} × "${product.name}" left in stock.`;
  } else if (existing) {
    existing.qty = newQty;
  } else {
    cart.push({ id, qty });
  }
  req.session.cart = cart;
  res.redirect('/cart');
});

router.post('/cart/remove', (req, res) => {
  req.session.cart = (req.session.cart || []).filter((i) => i.id !== Number(req.body.id));
  res.redirect('/cart');
});

/* ---------- Checkout ---------- */

router.get('/checkout', requireAuth, (req, res) => {
  const cart = getCartItems(req);
  if (!cart.length) return res.redirect('/cart');
  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  res.render('checkout', { title: 'Checkout', cart, total, error: null });
});

router.post('/checkout', requireAuth, (req, res) => {
  const { name, address, city, phone } = req.body;
  const cart = getCartItems(req);
  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  if (!cart.length) return res.redirect('/cart');
  if (!name || !address || !city || !phone) {
    return res.render('checkout', { title: 'Checkout', cart, total, error: 'Please fill in all shipping fields.' });
  }

  // Re-validate stock against the database at the last moment
  for (const item of cart) {
    if (item.qty > item.stock) {
      return res.render('checkout', {
        title: 'Checkout',
        cart,
        total,
        error: `"${item.name}" only has ${item.stock} left. Please update your cart.`,
      });
    }
  }

  const placeOrder = db.transaction(() => {
    const result = db.prepare(`
      INSERT INTO orders (user_id, total, shipping_name, shipping_address, shipping_city, shipping_phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.session.user.id, total, name.trim(), address.trim(), city.trim(), phone.trim());
    const orderId = result.lastInsertRowid;

    const insertItem = db.prepare(
      'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)'
    );
    const decreaseStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
    for (const item of cart) {
      insertItem.run(orderId, item.id, item.qty, item.price);
      decreaseStock.run(item.qty, item.id);
    }
    return orderId;
  });

  const orderId = placeOrder();
  req.session.cart = [];
  res.redirect(`/order/${orderId}`);
});

router.get('/order/:id', requireAuth, (req, res) => {
  const order = db
    .prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.session.user.id);
  if (!order) return res.status(404).render('404', { title: 'Order Not Found' });

  const items = db.prepare(`
    SELECT oi.*, p.name, p.emoji
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = ?
  `).all(order.id);

  res.render('order-confirmation', { title: 'Order Confirmed', order, items });
});

module.exports = router;
