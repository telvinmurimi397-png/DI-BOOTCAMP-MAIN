const products = require('./products');

function findProduct(productName) {
  const product = products.find(
    p => p.name.toLowerCase() === productName.toLowerCase()
  );

  if (product) {
    console.log(`Found product:`, product);
  } else {
    console.log(`Product "${productName}" not found.`);
  }
}

findProduct('Laptop');
findProduct('Book');
findProduct('Tablet');