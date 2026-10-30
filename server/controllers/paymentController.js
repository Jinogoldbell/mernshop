const Cart = require('../models/Cart');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const { calculatePrices } = require('../utils/pricing');
const rz = require('../utils/razorpay');

// GET /api/payments/config  (public)
// Tells the client which payment options exist. Only the public key id is exposed.
exports.getConfig = (_req, res) =>
  res.json({
    razorpay: rz.isConfigured(),
    keyId: rz.isConfigured() ? process.env.RAZORPAY_KEY_ID : null,
    currency: rz.currency(),
  });

// POST /api/payments/razorpay/order  (auth)
// Creates a Razorpay order for the logged-in user's cart. The amount is computed
// here from database prices, so the browser cannot choose what it pays.
exports.createRazorpayOrder = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  const lines = (cart?.items || []).filter((i) => i.product);
  if (!lines.length) throw httpError(400, 'Your cart is empty');

  for (const { product, qty } of lines)
    if (qty > product.countInStock)
      throw httpError(400, `Only ${product.countInStock} of "${product.name}" in stock`);

  const { totalPrice } = calculatePrices(
    lines.map((l) => ({ price: l.product.price, qty: l.qty }))
  );
  const amount = rz.toSubunits(totalPrice);
  if (amount < 100) throw httpError(400, 'Order total is too low to pay online');

  const order = await rz.getClient().orders.create({
    amount,
    currency: rz.currency(),
    receipt: `rcpt_${Date.now()}`,
    notes: { userId: String(req.user._id) }, // checked again when the order is placed
  });

  res.json({
    id: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
});
