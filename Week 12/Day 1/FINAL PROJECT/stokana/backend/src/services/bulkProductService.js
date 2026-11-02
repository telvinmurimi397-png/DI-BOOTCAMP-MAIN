const { ApiError, badRequest } = require('../utils/errors');
const sellerService = require('./sellerService');
const { createProductSchema } = require('../validators/sellerValidators');

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"' && field.length === 0) {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field);
      if (row.some((cell) => cell.trim() !== '')) rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (quoted) throw badRequest('The CSV file contains an unclosed quoted field.');
  row.push(field);
  if (row.some((cell) => cell.trim() !== '')) rows.push(row);
  return rows;
}

function parseJsonCell(value, fallback, label) {
  if (!value.trim()) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`${label} must contain valid JSON.`);
  }
}

async function importProducts(seller, csv) {
  const rows = parseCsv(csv.replace(/^\uFEFF/, ''));
  const headers = rows.shift()?.map((header) => header.trim());
  const required = ['name', 'categoryId', 'description', 'price', 'stock', 'condition', 'imageUrls'];
  if (!headers || required.some((header) => !headers.includes(header)) || new Set(headers).size !== headers.length) {
    throw badRequest(`CSV headers must include: ${required.join(', ')}. Optional columns: location, specifications, variants, compareAtPrice.`);
  }
  if (!rows.length) throw badRequest('The CSV file has no product rows.');
  if (rows.length > 100) throw badRequest('Upload no more than 100 products at a time.');
  if (rows.some((row) => row.length !== headers.length)) {
    throw badRequest('Every CSV row must have the same number of columns as the header.');
  }

  const created = [];
  const errors = [];
  for (const [index, cells] of rows.entries()) {
    const rowNumber = index + 2;
    const input = Object.fromEntries(headers.map((header, cellIndex) => [header, cells[cellIndex].trim()]));
    let record;
    try {
      record = {
        name: input.name,
        categoryId: input.categoryId,
        description: input.description,
        price: input.price,
        compareAtPrice: input.compareAtPrice ? input.compareAtPrice : null,
        stock: input.stock,
        condition: input.condition || 'new',
        location: input.location || undefined,
        imageUrls: input.imageUrls.split('|').map((url) => url.trim()).filter(Boolean),
        specifications: parseJsonCell(input.specifications || '', {}, 'Specifications'),
        variants: parseJsonCell(input.variants || '', undefined, 'Variants')
      };
    } catch (error) {
      errors.push({ row: rowNumber, message: error.message });
      continue;
    }

    const parsed = createProductSchema.safeParse(record);
    if (!parsed.success) {
      errors.push({
        row: rowNumber,
        message: parsed.error.issues.map((issue) => issue.message).join(' ')
      });
      continue;
    }

    try {
      const product = await sellerService.createProduct(seller, parsed.data);
      created.push({ row: rowNumber, id: product.id, name: product.name });
    } catch (error) {
      if (!(error instanceof ApiError) || error.status >= 500) throw error;
      errors.push({ row: rowNumber, message: error.message });
    }
  }

  return { created, errors, submitted: rows.length };
}

module.exports = { importProducts, parseCsv };
