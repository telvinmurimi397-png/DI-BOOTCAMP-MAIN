const bcrypt = require('bcryptjs');
const db = require('./connection');
const additionalProducts = require('./catalog-additions');
const productImageUrl = require('./product-image');

const retiredDuplicateProducts = [
  'Dough Scraper and Cutter',
  'Steak Knife Set (6 pcs)',
  'Heavy-Duty Garlic Press',
  'Angled Y-Style Vegetable Peeler',
  'Multi-Purpose Prep Grater',
];

const products = [
  ['Handcrafted Wooden Utensil Set (7 pcs)', 'A seven-piece set of wooden spoons and turners for stirring, flipping and serving.', 34.0, 18, 'Cooking Tools', '', '/images/products/wooden-utensil-set.jpg'],
  ['Balloon Whisk Set (3 pcs)', 'Three stainless steel balloon and spiral whisks for beating eggs, mixing batters and blending sauces.', 19.0, 22, 'Cooking Tools', '', '/images/products/whisks.jpg'],
  ['Stainless Steel Tongs Set (3 pcs)', 'Three long-handled steel tongs for turning food on the grill or serving hot dishes.', 16.0, 24, 'Cooking Tools', '', '/images/products/tongs.jpg'],
  ['Y-Style Vegetable Peeler', 'A compact handheld peeler for preparing potatoes, carrots and other firm produce.', 8.0, 35, 'Prep Tools', '', '/images/products/vegetable-peeler.jpg'],
  ['Wooden Rolling Pin Set (2 pcs)', 'A handled rolling pin and a straight pin for rolling pastry and dough.', 22.0, 12, 'Baking Tools', '', '/images/products/rolling-pin.jpg'],
  ["Chicago Cutlery Paring Knife", 'A compact kitchen knife suited to peeling and trimming fruit and vegetables.', 16.0, 10, 'Cutlery & Cutting', '', '/images/products/paring-knife.jpg'],
  ['Handheld Cheese Grater', 'A small handheld grater for cheese and vegetables. Wash and dry after use.', 11.0, 28, 'Prep Tools', '', '/images/products/cheese-graters.jpg'],
  ['Slotted Serving Spoon', 'A slotted spoon for lifting vegetables and other foods while leaving cooking liquid behind.', 9.0, 20, 'Cooking Tools', '', '/images/products/slotted-spoon.jpg'],
  ['Wooden Cooking Spoon', 'A sturdy wooden spoon for stirring soups, sauces and other dishes during cooking.', 6.0, 30, 'Cooking Tools', '', '/images/products/wooden-spoon.jpg'],
];

const seedAll = db.transaction(() => {
  const removeUnpurchasedProduct = db.prepare(`
    DELETE FROM products
    WHERE name = ?
      AND NOT EXISTS (
        SELECT 1 FROM order_items WHERE order_items.product_id = products.id
      )
  `);
  const findRetiredProduct = db.prepare('SELECT id FROM products WHERE name = ?');
  for (const name of retiredDuplicateProducts) {
    removeUnpurchasedProduct.run(name);
    if (findRetiredProduct.get(name)) {
      console.warn(`Keeping "${name}" because it is referenced by order history.`);
    }
  }

  const insertProduct = db.prepare(
    'INSERT INTO products (name, description, price, stock, category, emoji, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const updateProductImage = db.prepare('UPDATE products SET image_url = ? WHERE name = ?');
  const findProduct = db.prepare('SELECT id FROM products WHERE name = ?');
  for (const product of products) {
    const imageUrl = productImageUrl(product[0]);
    if (findProduct.get(product[0])) {
      updateProductImage.run(imageUrl, product[0]);
    } else {
      insertProduct.run(...product.slice(0, 6), imageUrl);
    }
  }
  const insertAdditionalProduct = db.prepare(
    'INSERT INTO products (name, description, price, stock, category, emoji, image_url) VALUES (@name, @description, @price, @stock, @category, @emoji, @image_url)'
  );
  for (const product of additionalProducts) {
    const imageUrl = productImageUrl(product.name);
    if (findProduct.get(product.name)) {
      updateProductImage.run(imageUrl, product.name);
    } else {
      insertAdditionalProduct.run({ ...product, image_url: imageUrl });
    }
  }

  const insertUser = db.prepare(
    'INSERT OR IGNORE INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
  );
  insertUser.run('Store Admin', 'admin@store.com', bcrypt.hashSync('admin123', 10), 'admin');
  insertUser.run('Demo Customer', 'customer@store.com', bcrypt.hashSync('customer123', 10), 'customer');

  const orderCount = db.prepare('SELECT COUNT(*) AS count FROM orders').get().count;
  if (orderCount === 0) {
    const customerId = db.prepare('SELECT id FROM users WHERE email = ?').get('customer@store.com').id;
    const utensilSet = db.prepare('SELECT * FROM products WHERE name = ?').get('Handcrafted Wooden Utensil Set (7 pcs)');
    const tongs = db.prepare('SELECT * FROM products WHERE name = ?').get('Stainless Steel Tongs Set (3 pcs)');
    const total = utensilSet.price * 2 + tongs.price;
    const orderId = db.prepare(`
      INSERT INTO orders (user_id, total, shipping_name, shipping_address, shipping_city, shipping_phone)
      VALUES (?, ?, 'Demo Customer', '18 Willow Lane, Apt 4B', 'Nairobi', '+254 712 345 678')
    `).run(customerId, total).lastInsertRowid;

    const insertItem = db.prepare(
      'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)'
    );
    insertItem.run(orderId, utensilSet.id, 2, utensilSet.price);
    insertItem.run(orderId, tongs.id, 1, tongs.price);
  }
});

seedAll();
const categoryCounts = db.prepare('SELECT category, COUNT(*) AS count FROM products GROUP BY category ORDER BY category').all();
console.log('Database seeded.');
console.log('   Admin:    admin@store.com / admin123');
console.log('   Customer: customer@store.com / customer123');
console.log(`   ${db.prepare('SELECT COUNT(*) AS count FROM products').get().count} products total`);
for (const category of categoryCounts) console.log(`   ${category.category}: ${category.count} products`);
