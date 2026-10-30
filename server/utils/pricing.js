const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Compute order totals from item prices. Always run on the server using
 * database prices, never trust totals sent by the client.
 */
exports.calculatePrices = (items) => {
  const itemsPrice = round2(items.reduce((sum, i) => sum + i.price * i.qty, 0));
  const freeOver = Number(process.env.FREE_SHIPPING_OVER ?? 2000);
  const flat = Number(process.env.SHIPPING_FLAT ?? 99);
  const shippingPrice = itemsPrice === 0 || itemsPrice >= freeOver ? 0 : flat;
  const taxPrice = round2(itemsPrice * Number(process.env.TAX_RATE ?? 0.18));
  const totalPrice = round2(itemsPrice + shippingPrice + taxPrice);
  return { itemsPrice, shippingPrice, taxPrice, totalPrice };
};
