function productImageUrl(name) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return `/images/products/${slug}.jpg`;
}

module.exports = productImageUrl;
