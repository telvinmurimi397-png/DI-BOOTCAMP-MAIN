const { toCents, fromCents } = require('./money');

function calculateDeliveryFees(lines, subtotalCents, freeShippingThresholdCents) {
  const feesBySeller = new Map();
  for (const line of lines) {
    const sellerId = String(line.sellerId);
    if (!feesBySeller.has(sellerId)) {
      feesBySeller.set(sellerId, {
        sellerId: line.sellerId,
        shopName: line.shopName,
        cents: toCents(line.shopDeliveryFee)
      });
    }
  }

  const freeShipping = subtotalCents >= freeShippingThresholdCents;
  const deliveryFees = [...feesBySeller.values()].map(({ sellerId, shopName, cents }) => ({
    sellerId,
    shopName,
    shippingFee: fromCents(freeShipping ? 0 : cents)
  }));
  const totalCents = deliveryFees.reduce(
    (sum, fee) => sum + toCents(fee.shippingFee),
    0
  );
  return { deliveryFees, totalCents };
}

module.exports = { calculateDeliveryFees };
