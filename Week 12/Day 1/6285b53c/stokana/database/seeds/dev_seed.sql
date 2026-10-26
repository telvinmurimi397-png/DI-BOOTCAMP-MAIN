-- ============================================================
-- STOKANA development seed
-- Run after schema.sql against a fresh database.
-- Demo passwords:
--   admin@stokana.co.ke      Admin@2026
--   nairobitech@stokana.co.ke Seller@2026   (approved)
--   zuribeauty@stokana.co.ke  Seller@2026   (approved)
--   savannahome@stokana.co.ke Seller@2026   (approved)
--   mavuno@stokana.co.ke      Seller@2026   (approved)
--   sanaa@stokana.co.ke       Seller@2026   (approved)
--   alpine@stokana.co.ke      Seller@2026   (pending)
--   buyer@stokana.co.ke       Buyer@2026
--   wanjiru@example.com       Buyer@2026
-- ============================================================

BEGIN;

INSERT INTO users (full_name, email, phone, password_hash, role) VALUES
  ('Stokana Admin',      'admin@stokana.co.ke',      '+254700000001', crypt('Admin@2026', gen_salt('bf', 11)),  'admin'),
  ('Brian Mwangi',       'nairobitech@stokana.co.ke','+254700000002', crypt('Seller@2026', gen_salt('bf', 11)), 'seller'),
  ('Amina Yusuf',        'zuribeauty@stokana.co.ke', '+254700000003', crypt('Seller@2026', gen_salt('bf', 11)), 'seller'),
  ('Grace Kimani',       'savannahome@stokana.co.ke','+254700000004', crypt('Seller@2026', gen_salt('bf', 11)), 'seller'),
  ('Peter Kariuki',      'mavuno@stokana.co.ke',     '+254700000005', crypt('Seller@2026', gen_salt('bf', 11)), 'seller'),
  ('Zawadi Otieno',      'sanaa@stokana.co.ke',      '+254700000006', crypt('Seller@2026', gen_salt('bf', 11)), 'seller'),
  ('Kevin Njoroge',      'alpine@stokana.co.ke',     '+254700000007', crypt('Seller@2026', gen_salt('bf', 11)), 'seller'),
  ('Faith Wambui',       'buyer@stokana.co.ke',      '+254700000008', crypt('Buyer@2026', gen_salt('bf', 11)), 'buyer'),
  ('Wanjiru Kamau',      'wanjiru@example.com',      '+254700000009', crypt('Buyer@2026', gen_salt('bf', 11)), 'buyer')
ON CONFLICT (email) DO NOTHING;

INSERT INTO seller_profiles
  (user_id, shop_name, shop_slug, description, banner_url, county, town, phone, status, approved_at, approved_by)
SELECT u.id, v.shop_name, v.shop_slug, v.description, v.banner_url, v.county, v.town, v.phone, v.status,
       CASE WHEN v.status = 'approved' THEN now() - interval '90 days' END,
       CASE WHEN v.status = 'approved' THEN a.id END
FROM (VALUES
  ('nairobitech@stokana.co.ke', 'Nairobi Tech Hub', 'nairobi-tech-hub',
   'Genuine laptops, audio and everyday tech from Nairobi CBD. Every device is tested before dispatch, with a 7-day return window.',
   '/assets/products/laptop.jpg', 'Nairobi', 'Nairobi CBD', '+254700000002', 'approved'),
  ('zuribeauty@stokana.co.ke', 'Zuri Beauty & Care', 'zuri-beauty',
   'Dermatologist-loved skincare and body care, curated for Kenyan skin and climate. 100% authentic products only.',
   '/assets/products/serum.jpg', 'Nairobi', 'Westlands', '+254700000003', 'approved'),
  ('savannahome@stokana.co.ke', 'Savanna Home', 'savanna-home',
   'Warm, handcrafted pieces for the Kenyan home. We work with artisans in Nakuru and ship countrywide.',
   '/assets/products/basket.jpg', 'Nakuru', 'Nakuru Town', '+254700000004', 'approved'),
  ('mavuno@stokana.co.ke', 'Mavuno Grocers', 'mavuno-grocers',
   'Fresh farm produce and pantry staples delivered from Kiambu to your door.',
   '/assets/products/coffee-beans.jpg', 'Kiambu', 'Ruiru', '+254700000005', 'approved'),
  ('sanaa@stokana.co.ke', 'Sanaa Studio', 'sanaa-studio',
   'Contemporary Kenyan fashion and accessories made in small batches by local designers.',
   '/assets/products/tote.jpg', 'Nairobi', 'Kilimani', '+254700000006', 'approved'),
  ('alpine@stokana.co.ke', 'Alpine Outdoor KE', 'alpine-outdoor',
   'Camping, hiking and outdoor gear for every Kenyan adventure. Awaiting marketplace approval.',
   NULL, 'Nyeri', 'Nanyuki', '+254700000007', 'pending')
) AS v(seller_email, shop_name, shop_slug, description, banner_url, county, town, phone, status)
JOIN users u ON u.email = v.seller_email
LEFT JOIN users a ON a.role = 'admin'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO categories (name, slug, description, icon, sort_order) VALUES
  ('Electronics',        'electronics',       'Laptops, audio, cameras and smart devices',       'devices', 1),
  ('Phones & Accessories','phones-accessories','Smartphones, chargers, cases and power banks',    'phone', 2),
  ('Fashion',            'fashion',           'Clothing, shoes and accessories for every style',  'shirt', 3),
  ('Home & Living',      'home-living',       'Furniture, decor, bedding and kitchenware',        'home', 4),
  ('Beauty & Health',    'beauty-health',     'Skincare, haircare and personal wellness',         'sparkles', 5),
  ('Groceries',          'groceries',         'Fresh produce, pantry staples and drinks',         'basket', 6),
  ('Sports & Outdoor',   'sports-outdoor',    'Fitness, camping and outdoor equipment',           'activity', 7),
  ('Baby & Kids',        'baby-kids',         'Clothing, toys and essentials for little ones',    'baby', 8),
  ('Books & Stationery', 'books-stationery',  'Books, office supplies and creative tools',        'book', 9),
  ('Automotive',         'automotive',        'Car care, tools and accessories',                  'car', 10)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products
  (seller_id, category_id, name, slug, description, price, compare_at_price, stock,
   condition, location, status, is_featured, views_count, approved_at, approved_by)
SELECT u.id, c.id, v.name, v.slug, v.description, v.price, v.compare_at_price::numeric, v.stock,
       v.condition, v.location, v.status, v.is_featured, v.views_count,
       CASE WHEN v.status = 'approved' THEN now() - (v.days_old || ' days')::interval END,
       CASE WHEN v.status = 'approved' THEN a.id END
FROM (VALUES
  ('nairobitech@stokana.co.ke', 'electronics', 'Sony WH-CH720N Noise Cancelling Headphones',
   'sony-wh-ch720n-headphones',
   'Lightweight wireless headphones with industry-leading noise cancellation, up to 35 hours of battery life and a comfortable over-ear fit. Includes USB-C charging cable and carries a 1-year local warranty.',
   12500, 14900, 18, 'new', 'Nairobi CBD', 'approved', true, 412, 62),
  ('nairobitech@stokana.co.ke', 'phones-accessories', 'Anker PowerCore 20,000mAh Power Bank',
   'anker-20000mah-power-bank',
   'High-capacity power bank with 20W USB-C fast charging. Charges a modern phone more than four times and supports two devices at once. Genuine Anker unit with 18-month warranty.',
   4800, 5500, 32, 'new', 'Nairobi CBD', 'approved', true, 287, 58),
  ('nairobitech@stokana.co.ke', 'electronics', 'JBL Flip 6 Portable Bluetooth Speaker',
   'jbl-flip-6-speaker',
   'Bold JBL Original Pro Sound in a rugged, waterproof package. IP67 rated, 12 hours of playtime and PartyBoost for pairing with other JBL speakers.',
   9200, NULL, 9, 'new', 'Nairobi CBD', 'approved', true, 198, 45),
  ('nairobitech@stokana.co.ke', 'electronics', 'HP EliteBook 840 G8 Refurbished Laptop',
   'hp-elitebook-840-g8',
   'Certified refurbished business laptop in excellent condition. Intel Core i5 11th gen, 16GB RAM, 512GB NVMe SSD and a 14-inch Full HD display. Windows 11 Pro installed; 3-month shop warranty.',
   62000, 78000, 4, 'refurbished', 'Nairobi CBD', 'approved', true, 341, 39),
  ('nairobitech@stokana.co.ke', 'electronics', 'Logitech MX Master 3S Wireless Mouse',
   'logitech-mx-master-3s',
   'Quiet-click wireless mouse with an 8,000 DPI sensor, MagSpeed scrolling and multi-device flow. Works across Windows, macOS and Linux. Sold out — restocking soon.',
   11300, NULL, 0, 'new', 'Nairobi CBD', 'approved', false, 156, 33),
  ('zuribeauty@stokana.co.ke', 'beauty-health', 'CeraVe Hydrating Facial Cleanser 236ml',
   'cerave-hydrating-cleanser',
   'Gentle, non-foaming cleanser with ceramides and hyaluronic acid. Removes dirt and makeup without stripping the skin barrier. Suitable for normal to dry skin.',
   1850, 2100, 25, 'new', 'Westlands', 'approved', true, 521, 74),
  ('zuribeauty@stokana.co.ke', 'beauty-health', 'The Ordinary Niacinamide 10% + Zinc 1%',
   'ordinary-niacinamide-serum',
   'High-strength vitamin and mineral serum that visibly reduces blemishes, balances sebum and improves skin texture. 30ml. Authentic Deciem stock.',
   1600, NULL, 40, 'new', 'Westlands', 'approved', false, 634, 70),
  ('zuribeauty@stokana.co.ke', 'beauty-health', 'Nivea Shea Smooth Body Lotion 400ml',
   'nivea-shea-body-lotion',
   'Deep moisture lotion enriched with shea butter and vitamin E for smooth, soft skin. Fast-absorbing formula for daily use.',
   950, 1100, 30, 'new', 'Westlands', 'approved', false, 173, 51),
  ('savannahome@stokana.co.ke', 'home-living', 'Handwoven Sisal Storage Basket',
   'sisal-storage-basket',
   'Handwoven by artisan women in Nakuru from sustainably harvested sisal. A generous 35cm basket for throws, toys or laundry. Each piece is unique, with natural colour variation.',
   2300, 2800, 15, 'new', 'Nakuru', 'approved', true, 246, 48),
  ('savannahome@stokana.co.ke', 'home-living', 'Ceramic Pour-Over Coffee Set',
   'ceramic-pour-over-set',
   'Matte ceramic dripper and matching 600ml carafe for a slow, clean cup. Dishwasher safe and compatible with standard filter papers.',
   3400, NULL, 7, 'new', 'Nakuru', 'approved', false, 112, 28),
  ('savannahome@stokana.co.ke', 'home-living', 'Woven Cotton Throw Blanket',
   'cotton-throw-blanket',
   'Soft, breathable throw woven from 100% cotton. Measures 130 x 170cm — perfect for cool evenings and styling a sofa or bed.',
   2900, 3500, 11, 'new', 'Nakuru', 'approved', true, 187, 21),
  ('mavuno@stokana.co.ke', 'groceries', 'Kenyan AA Coffee Beans 500g',
   'kenyan-aa-coffee-beans',
   'Single-origin AA beans from Nyeri, roasted medium for a bright, fruity cup with notes of blackcurrant and citrus. Whole beans, roasted to order.',
   1250, NULL, 50, 'new', 'Ruiru', 'approved', false, 333, 18),
  ('sanaa@stokana.co.ke', 'fashion', 'Ankara Print Tote Bag',
   'ankara-print-tote-bag',
   'Sturdy cotton-canvas tote finished with a vibrant Ankara panel. Fits a 15-inch laptop and daily essentials. Made in Nairobi by Sanaa Studio.',
   1900, NULL, 14, 'new', 'Kilimani', 'approved', true, 265, 26),
  ('sanaa@stokana.co.ke', 'fashion', 'Linen Blend Oversized Shirt',
   'linen-blend-shirt',
   'Relaxed linen-cotton shirt with a soft hand-feel and mother-of-pearl buttons. Cut for an easy, oversized fit. Available in natural sand.',
   3200, 3900, 6, 'new', 'Kilimani', 'approved', false, 154, 14),
  ('nairobitech@stokana.co.ke', 'electronics', 'Solar Floodlight 100W with Remote',
   'solar-floodlight-100w',
   'Weatherproof solar floodlight with motion sensor, remote control and 100W equivalent output. New stock awaiting marketplace review.',
   6500, NULL, 25, 'new', 'Nairobi CBD', 'pending', false, 12, 2),
  ('sanaa@stokana.co.ke', 'fashion', 'Handmade Leather Sandals',
   'handmade-leather-sandals',
   'Hand-stitched leather sandals made by Maasai artisans. Durable, comfortable and made to order in sizes 37–45. Awaiting marketplace review.',
   2800, NULL, 20, 'new', 'Kilimani', 'pending', false, 8, 1)
) AS v(seller_email, category_slug, name, slug, description, price, compare_at_price, stock,
       condition, location, status, is_featured, views_count, days_old)
JOIN users u ON u.email = v.seller_email
JOIN categories c ON c.slug = v.category_slug
LEFT JOIN users a ON a.role = 'admin'
ON CONFLICT (slug) DO NOTHING;

-- Remove rows left by earlier experimental seeds.
DELETE FROM products WHERE slug = 'placeholder-slug';

INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary)
SELECT p.id, v.url, v.alt_text, 0, TRUE
FROM (VALUES
  ('sony-wh-ch720n-headphones', '/assets/products/headphones.jpg', 'Sony WH-CH720N headphones'),
  ('anker-20000mah-power-bank', '/assets/products/powerbank.jpg',  'Anker 20,000mAh power bank'),
  ('jbl-flip-6-speaker',        '/assets/products/speaker.jpg',    'JBL Flip 6 speaker'),
  ('hp-elitebook-840-g8',       '/assets/products/laptop.jpg',     'HP EliteBook laptop'),
  ('logitech-mx-master-3s',     '/assets/products/mouse.jpg',      'Logitech MX Master mouse'),
  ('cerave-hydrating-cleanser', '/assets/products/cleanser.jpg',   'CeraVe hydrating cleanser'),
  ('ordinary-niacinamide-serum','/assets/products/serum.jpg',      'The Ordinary niacinamide serum'),
  ('nivea-shea-body-lotion',    '/assets/products/lotion.jpg',     'Nivea Shea Smooth body lotion'),
  ('sisal-storage-basket',      '/assets/products/basket.jpg',     'Handwoven sisal basket'),
  ('ceramic-pour-over-set',     '/assets/products/coffee-set.jpg', 'Ceramic pour-over coffee set'),
  ('cotton-throw-blanket',      '/assets/products/blanket.jpg',    'Woven cotton throw blanket'),
  ('kenyan-aa-coffee-beans',    '/assets/products/coffee-beans.jpg','Kenyan AA coffee beans'),
  ('ankara-print-tote-bag',     '/assets/products/tote.jpg',       'Ankara print tote bag'),
  ('linen-blend-shirt',         '/assets/products/shirt.jpg',      'Linen blend shirt'),
  ('solar-floodlight-100w',     '/assets/products/solar-light.jpg','Solar floodlight'),
  ('handmade-leather-sandals',  '/assets/products/sandals.jpg',    'Handmade leather sandals')
) AS v(slug, url, alt_text)
JOIN products p ON p.slug = v.slug
ON CONFLICT (product_id, url) DO NOTHING;

-- ------------------------------------------------------------
-- Demo orders (delivered and processing) for dashboards/reviews
-- ------------------------------------------------------------
INSERT INTO orders
  (order_number, buyer_id, status, payment_status, subtotal, shipping_fee, total,
   commission_total, seller_earnings_total, shipping_name, shipping_phone, shipping_email,
   shipping_county, shipping_town, shipping_address, paid_at, created_at)
SELECT v.order_number, u.id, v.status, 'paid', v.subtotal, v.shipping_fee, v.total,
       v.commission_total, v.seller_earnings_total, v.shipping_name, v.shipping_phone,
       u.email, v.county, v.town, v.address, now() - (v.days_old || ' days')::interval,
       now() - (v.days_old || ' days')::interval
FROM (VALUES
  ('STK-DEMO-1001', 'buyer@stokana.co.ke', 'delivered', 15400, 0, 15400, 1540, 13860,
   'Faith Wambui', '+254700000008', 'Nairobi', 'Lavington', 'Kipi Court, House 12', 12),
  ('STK-DEMO-1002', 'buyer@stokana.co.ke', 'delivered', 3450, 250, 3700, 345, 3105,
   'Faith Wambui', '+254700000008', 'Nairobi', 'Lavington', 'Kipi Court, House 12', 20),
  ('STK-DEMO-1003', 'wanjiru@example.com', 'processing', 3150, 250, 3400, 315, 2835,
   'Wanjiru Kamau', '+254700000009', 'Kiambu', 'Ruiru', 'Membley Estate, Block C', 2)
) AS v(order_number, buyer_email, status, subtotal, shipping_fee, total, commission_total,
       seller_earnings_total, shipping_name, shipping_phone, county, town, address, days_old)
JOIN users u ON u.email = v.buyer_email
ON CONFLICT (order_number) DO NOTHING;

INSERT INTO order_items
  (order_id, seller_id, product_id, product_name, product_image_url, unit_price, quantity,
   line_total, commission_rate, commission_amount, seller_earnings)
SELECT o.id, p.seller_id, p.id, p.name, v.url, v.unit_price, v.quantity, v.line_total,
       0.10, ROUND(v.line_total * 0.10, 2), ROUND(v.line_total * 0.90, 2)
FROM (VALUES
  ('STK-DEMO-1001', 'sony-wh-ch720n-headphones', '/assets/products/headphones.jpg', 12500, 1, 12500),
  ('STK-DEMO-1001', 'cotton-throw-blanket',       '/assets/products/blanket.jpg',     2900, 1, 2900),
  ('STK-DEMO-1002', 'cerave-hydrating-cleanser',  '/assets/products/cleanser.jpg',    1850, 1, 1850),
  ('STK-DEMO-1002', 'ordinary-niacinamide-serum', '/assets/products/serum.jpg',       1600, 1, 1600),
  ('STK-DEMO-1003', 'kenyan-aa-coffee-beans',     '/assets/products/coffee-beans.jpg',1250, 1, 1250),
  ('STK-DEMO-1003', 'ankara-print-tote-bag',      '/assets/products/tote.jpg',        1900, 1, 1900)
) AS v(order_number, product_slug, url, unit_price, quantity, line_total)
JOIN orders o ON o.order_number = v.order_number
JOIN products p ON p.slug = v.product_slug
WHERE NOT EXISTS (
  SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.product_id = p.id
);

INSERT INTO commissions
  (order_id, order_item_id, seller_id, rate, gross_amount, commission_amount, seller_earnings)
SELECT oi.order_id, oi.id, oi.seller_id, oi.commission_rate, oi.line_total,
       oi.commission_amount, oi.seller_earnings
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
WHERE o.order_number LIKE 'STK-DEMO-%'
ON CONFLICT (order_item_id) DO NOTHING;

INSERT INTO payments (order_id, provider, provider_ref, amount, currency, phone, status, raw_payload, verified_at)
SELECT o.id, 'simulated', 'SIM-' || o.order_number, o.total, 'KES', o.shipping_phone, 'success',
       jsonb_build_object('source', 'seed', 'orderNumber', o.order_number), o.paid_at
FROM orders o
WHERE o.order_number LIKE 'STK-DEMO-%'
ON CONFLICT (provider, provider_ref) DO NOTHING;

INSERT INTO shipments (order_id, seller_id, status, carrier, tracking_number, shipped_at, delivered_at)
SELECT DISTINCT o.id, oi.seller_id,
       CASE WHEN o.status = 'delivered' THEN 'delivered' ELSE 'dispatched' END,
       'Stokana Logistics',
       'STK' || LPAD((o.id * 7 + oi.seller_id)::text, 8, '0'),
       o.paid_at + interval '6 hours',
       CASE WHEN o.status = 'delivered' THEN o.paid_at + interval '2 days' END
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
WHERE o.order_number LIKE 'STK-DEMO-%'
ON CONFLICT (order_id, seller_id) DO NOTHING;

INSERT INTO reviews (order_item_id, product_id, buyer_id, seller_id, rating, title, comment, created_at)
SELECT oi.id, oi.product_id, o.buyer_id, oi.seller_id, v.rating, v.title, v.comment,
       o.paid_at + interval '4 days'
FROM (VALUES
  ('STK-DEMO-1001', 'sony-wh-ch720n-headphones', 5, 'Excellent noise cancellation',
   'Pairing was instant and the noise cancellation works very well on matatus. Delivered a day earlier than promised.'),
  ('STK-DEMO-1001', 'cotton-throw-blanket', 4, 'Lovely texture',
   'The blanket is soft and the colour is exactly as photographed. A little lighter than I expected but still great value.'),
  ('STK-DEMO-1002', 'cerave-hydrating-cleanser', 5, 'My skin barrier thanks you',
   'Genuine product, sealed and fresh. It leaves my skin clean without that tight feeling.'),
  ('STK-DEMO-1002', 'ordinary-niacinamide-serum', 4, 'Works but be patient',
   'Took about three weeks to see a difference in my blemishes. Seller packed it carefully.')
) AS v(order_number, product_slug, rating, title, comment)
JOIN orders o ON o.order_number = v.order_number
JOIN products p ON p.slug = v.product_slug
JOIN order_items oi ON oi.order_id = o.id AND oi.product_id = p.id
ON CONFLICT (order_item_id) DO NOTHING;

-- Empty cart for the demo buyer (checkout demo starts clean).
INSERT INTO carts (buyer_id)
SELECT id FROM users WHERE email = 'buyer@stokana.co.ke'
ON CONFLICT (buyer_id) DO NOTHING;

COMMIT;
