const bcrypt = require('bcryptjs');
const db = require('./connection');

const products = [
  ['Beechwood Spatula Set (3 pcs)', 'Hand-finished beechwood spatulas in three shapes. Gentle on non-stick surfaces, built to last for years.', 18.0, 25, 'Cooking Tools', '🍴'],
  ['Stainless Steel Tongs, 12"', 'Locking kitchen tongs with scalloped grips and a hanging loop. Heat-resistant up to 230°C.', 12.0, 40, 'Cooking Tools', '🥢'],
  ['Silicone Whisk Set (2 pcs)', 'Two whisks with food-grade silicone heads — perfect for eggs, sauces and batters without scratching bowls.', 10.0, 35, 'Cooking Tools', '🌀'],
  ['Cast Iron Skillet, 10 inch', 'Pre-seasoned cast iron skillet. Superb heat retention for searing, frying and baking. Oven safe.', 45.0, 8, 'Cooking Tools', '🍳'],
  ["Chef's Knife, 8 inch", 'High-carbon stainless steel blade with a full-tang, ergonomic handle. Sharp, balanced, and easy to hone.', 58.0, 10, 'Cutlery & Cutting', '🔪'],
  ['Bamboo Cutting Board, Medium', 'Sustainably sourced bamboo board with juice groove and handle. Kind to your knife edges.', 22.0, 15, 'Cutlery & Cutting', '🪵'],
  ['Kitchen Scissors with Sheath', 'Heavy-duty multipurpose shears for herbs, poultry and packaging. Comes with a protective sheath.', 9.0, 30, 'Cutlery & Cutting', '✂️'],
  ['Measuring Cups & Spoons (8 pcs)', 'Complete nesting set of stainless measuring cups and spoons with engraved markings that never fade.', 14.0, 28, 'Measuring & Prep', '🥄'],
  ['Stainless Mixing Bowls (set of 3)', 'Three graduated mixing bowls with non-slip bases and pour spouts. Dishwasher safe.', 34.0, 12, 'Measuring & Prep', '🥣'],
  ['Vegetable Peeler, Dual Blade', 'Sharp swivel blade with a comfortable grip. Also great for shaving cheese and chocolate.', 6.0, 50, 'Measuring & Prep', '🥔'],
  ['Glass Storage Jars w/ Bamboo Lids (3)', 'Airtight borosilicate jars with bamboo lids — ideal for spices, grains and coffee. Set of three.', 27.0, 16, 'Storage & Serving', '🫙'],
  ['Ceramic Serving Bowl, Speckled', 'Hand-glazed speckled stoneware bowl. Generous 2-litre capacity for salads, pasta and sharing dishes.', 24.0, 0, 'Storage & Serving', '🍲'],
];

const seedAll = db.transaction(() => {
  db.exec('DELETE FROM order_items; DELETE FROM orders; DELETE FROM products; DELETE FROM users;');

  const insertProduct = db.prepare(
    'INSERT INTO products (name, description, price, stock, category, emoji) VALUES (?, ?, ?, ?, ?, ?)'
  );
  for (const p of products) insertProduct.run(...p);

  const insertUser = db.prepare(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
  );
  const adminId = insertUser.run('Store Admin', 'admin@store.com', bcrypt.hashSync('admin123', 10), 'admin').lastInsertRowid;
  const customerId = insertUser.run('Demo Customer', 'customer@store.com', bcrypt.hashSync('customer123', 10), 'customer').lastInsertRowid;

  // One sample order so the admin dashboard isn't empty on first run
  const spatula = db.prepare('SELECT * FROM products WHERE name LIKE ?').get('Beechwood%');
  const tongs = db.prepare('SELECT * FROM products WHERE name LIKE ?').get('Stainless Steel Tongs%');
  const total = spatula.price * 2 + tongs.price;
  const orderId = db.prepare(`
    INSERT INTO orders (user_id, total, shipping_name, shipping_address, shipping_city, shipping_phone)
    VALUES (?, ?, 'Demo Customer', '12 Olive Street, Apt 4', 'Amman', '+962 7 0000 0000')
  `).run(customerId, total).lastInsertRowid;

  const insertItem = db.prepare(
    'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)'
  );
  insertItem.run(orderId, spatula.id, 2, spatula.price);
  insertItem.run(orderId, tongs.id, 1, tongs.price);

  return adminId;
});

seedAll();
console.log('✅ Database seeded.');
console.log('   Admin:    admin@store.com / admin123');
console.log('   Customer: customer@store.com / customer123');
console.log('   (12 products, 1 sample order)');
