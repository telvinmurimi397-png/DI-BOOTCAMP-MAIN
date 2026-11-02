const test = require('node:test');
const assert = require('node:assert/strict');
const { parseCsv } = require('../src/services/bulkProductService');
const { createProductSchema } = require('../src/validators/sellerValidators');
const {
  productsQuerySchema,
  recentlyViewedQuerySchema
} = require('../src/validators/catalogueValidators');

test('CSV parser preserves quoted commas, newlines and escaped quotes', () => {
  assert.deepEqual(parseCsv('name,description\r\n"Tea, green","Line one\n""Line two"""'), [
    ['name', 'description'],
    ['Tea, green', 'Line one\n"Line two"']
  ]);
});

test('CSV parser reports an unclosed quoted field', () => {
  assert.throws(() => parseCsv('name,description\n"Product,unfinished'), /unclosed quoted field/i);
});

test('product validation accepts specifications and unique variant SKUs', () => {
  const result = createProductSchema.safeParse({
    name: 'Cotton shirt',
    categoryId: 2,
    description: 'A comfortable cotton shirt in multiple sizes.',
    price: 1200,
    stock: 10,
    condition: 'new',
    imageUrls: ['https://example.test/shirt.jpg'],
    specifications: { Material: 'Cotton' },
    variants: [
      { sku: 'SHIRT-M', attributes: { Size: 'M' }, stock: 6 },
      { sku: 'SHIRT-L', attributes: { Size: 'L' }, price: 1250, stock: 4 }
    ]
  });

  assert.equal(result.success, true);
  assert.deepEqual(result.data.specifications, { Material: 'Cotton' });
});

test('product validation rejects duplicate variant SKUs regardless of case', () => {
  const result = createProductSchema.safeParse({
    name: 'Cotton shirt',
    categoryId: 2,
    description: 'A comfortable cotton shirt in multiple sizes.',
    price: 1200,
    stock: 10,
    condition: 'new',
    imageUrls: ['https://example.test/shirt.jpg'],
    variants: [
      { sku: 'SHIRT-M', attributes: { Size: 'M' }, stock: 6 },
      { sku: 'shirt-m', attributes: { Size: 'L' }, stock: 4 }
    ]
  });

  assert.equal(result.success, false);
  assert.ok(result.error.issues.some((issue) => issue.message === 'Variant SKUs must be unique.'));
});

test('catalogue query accepts seller and location filters alongside category and price', () => {
  const result = productsQuerySchema.safeParse({
    category: 'home-living',
    seller: 'Kili',
    location: 'Nairobi',
    minPrice: '500',
    maxPrice: '2500',
    sort: 'popular'
  });

  assert.equal(result.success, true);
  assert.equal(result.data.seller, 'Kili');
  assert.equal(result.data.location, 'Nairobi');
});

test('recently viewed lookup accepts at most eight product slugs', () => {
  assert.deepEqual(recentlyViewedQuerySchema.parse({
    slugs: 'first-product,second-item'
  }).slugs, ['first-product', 'second-item']);
  assert.equal(recentlyViewedQuerySchema.safeParse({
    slugs: Array.from({ length: 9 }, (_, index) => `product-${index}`).join(',')
  }).success, false);
});
