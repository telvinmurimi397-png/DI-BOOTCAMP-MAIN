BEGIN;

INSERT INTO categories (name, slug, description, icon, sort_order) VALUES
  ('Electronics',         'electronics',        'Laptops, audio, cameras and smart devices',       'devices', 1),
  ('Phones & Accessories','phones-accessories', 'Smartphones, chargers, cases and power banks',    'phone', 2),
  ('Fashion',             'fashion',            'Clothing, shoes and accessories for every style', 'shirt', 3),
  ('Home & Living',       'home-living',        'Furniture, decor, bedding and kitchenware',       'home', 4),
  ('Beauty & Health',     'beauty-health',      'Skincare, haircare and personal wellness',        'sparkles', 5),
  ('Groceries',           'groceries',          'Fresh produce, pantry staples and drinks',       'basket', 6),
  ('Sports & Outdoor',    'sports-outdoor',     'Fitness, camping and outdoor equipment',          'activity', 7),
  ('Baby & Kids',         'baby-kids',          'Clothing, toys and essentials for little ones',   'baby', 8),
  ('Books & Stationery',  'books-stationery',   'Books, office supplies and creative tools',       'book', 9),
  ('Automotive',          'automotive',         'Car care, tools and accessories',                 'car', 10)
ON CONFLICT (slug) DO NOTHING;

COMMIT;
