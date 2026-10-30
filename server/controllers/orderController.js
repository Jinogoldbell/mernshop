const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const { calculatePrices } = require('../utils/pricing');
const rz = require('../utils/razorpay');

const ADDRESS_FIELDS = ['fullName', 'address', 'city', 'postalCode', 'country'];

/** Take stock for every cart line atomically. Rolls back and throws if any line is short. */
const reserveStock = async (lines) => {
  const reserved = [];
  try {
    for (const { product, qty } of lines) {
      const result = await Product.updateOne(
        { _id: product._id, countInStock: { $gte: qty } },
        { $inc: { countInStock: -qty } }
      );
      if (!result.modifiedCount)
        throw httpError(400, `"${product.name}" no longer has enough stock`);
      reserved.push({ id: product._id, qty });
    }
  } catch (err) {
    await releaseStock(reserved);
    throw err;
  }
  return reserved;
};

const releaseStock = (reserved) =>
  Promise.all(
    reserved.map((r) =>
      Product.updateOne({ _id: r.id }, { $inc: { countInStock: r.qty } })
    )
  );

/**
 * Ask Razorpay whether the payment really happened and matches this cart.
 * Never trust the browser's word that a payment succeeded.
 */
const confirmRazorpayPayment = async ({ orderId, paymentId }, userId, amount) => {
  const client = rz.getClient();
  const [rzOrder, payment] = await Promise.all([
    client.orders.fetch(orderId),
    client.payments.fetch(paymentId),
  ]);
  if (payment.order_id !== orderId)
    throw httpError(400, 'Payment does not belong to this order');
  // The Razorpay order was created from this user's cart; both must still match
  if (rzOrder.amount !== amount || rzOrder.notes?.userId !== String(userId))
    throw httpError(400, 'Payment does not match your current cart. Please try again.');

  let status = payment.status;
  if (status === 'authorized') {
    // Accounts set to manual capture need an explicit capture call
    await client.payments.capture(paymentId, amount, rzOrder.currency);
    status = 'captured';
  }
  if (status !== 'captured')
    throw httpError(402, `Payment was not completed (${status})`);
  return {
    status: 'paid',
    razorpayOrderId: orderId,
    razorpayPaymentId: paymentId,
    paidAt: new Date(),
  };
};

/** Best-effort refund when a payment succeeded but the order could not be saved. */
const refundQuietly = async (paymentId, amount) => {
  try {
    await rz.getClient().payments.refund(paymentId, { amount });
  } catch (err) {
    console.error(`REFUND NEEDED for Razorpay payment ${paymentId}: ${err.message}`);
  }
};

// POST /api/orders
// body: { shippingAddress, paymentMethod: 'razorpay' | 'demo', razorpay?: {orderId, paymentId, signature}, cardNumber? }
// The order is built from the SERVER-SIDE cart and database prices.
exports.createOrder = asyncHandler(async (req, res) => {
  const {
    shippingAddress = {},
    paymentMethod = 'demo',
    razorpay: rzp = {},
    cardNumber = '',
  } = req.body;
  const missing = ADDRESS_FIELDS.filter((f) => !String(shippingAddress[f] || '').trim());
  if (missing.length)
    throw httpError(400, `Missing shipping fields: ${missing.join(', ')}`);

  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  const lines = (cart?.items || []).filter((i) => i.product);
  if (!lines.length) throw httpError(400, 'Your cart is empty');

  const items = lines.map(({ product, qty }) => ({
    product: product._id,
    name: product.name,
    image: product.images[0],
    price: product.price,
    qty,
  }));
  const prices = calculatePrices(items);
  const amount = rz.toSubunits(prices.totalPrice);

  // --- Step 1: cheap checks before touching stock ---
  let paymentResult;
  if (paymentMethod === 'razorpay') {
    if (!rz.isConfigured()) throw httpError(400, 'Razorpay is not enabled on this store');
    if (!rz.verifySignature(rzp.orderId, rzp.paymentId, rzp.signature))
      throw httpError(400, 'Payment signature could not be verified');
    if (await Order.exists({ 'paymentResult.razorpayPaymentId': rzp.paymentId }))
      throw httpError(409, 'This payment has already been used for an order');
  } else if (paymentMethod === 'demo') {
    // Demo payments are switched off as soon as Razorpay keys exist, otherwise anyone could order for free
    if (rz.isConfigured()) throw httpError(400, 'Please pay with Razorpay');
    const digits = String(cardNumber).replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19)
      throw httpError(400, 'Enter a valid card number');
    paymentResult = { status: 'paid', last4: digits.slice(-4), paidAt: new Date() };
  } else {
    throw httpError(400, 'Unknown payment method');
  }

  // --- Step 2: reserve stock, confirm payment with Razorpay, save the order ---
  const reserved = await reserveStock(lines);
  try {
    if (paymentMethod === 'razorpay')
      paymentResult = await confirmRazorpayPayment(rzp, req.user._id, amount);

    const order = await Order.create({
      user: req.user._id,
      items,
      shippingAddress: Object.fromEntries(
        ADDRESS_FIELDS.map((f) => [f, String(shippingAddress[f]).trim()])
      ),
      paymentMethod,
      paymentResult,
      ...prices,
    });

    cart.items = [];
    await cart.save();
    res.status(201).json(order);
  } catch (err) {
    await releaseStock(reserved);
    // Refund only if the money was taken and the failure was ours (not a replayed payment id)
    if (
      paymentMethod === 'razorpay' &&
      err.code !== 11000 &&
      err.status !== 402 &&
      err.status !== 400
    )
      await refundQuietly(rzp.paymentId, amount);
    throw err;
  }
});

// GET /api/orders/mine
exports.getMyOrders = asyncHandler(async (req, res) => {
  res.json(await Order.find({ user: req.user._id }).sort({ createdAt: -1 }));
});

// GET /api/orders/:id  (owner or admin)
exports.getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) throw httpError(404, 'Order not found');
  if (!req.user.isAdmin && !order.user._id.equals(req.user._id))
    throw httpError(403, 'You can only view your own orders');
  res.json(order);
});

// GET /api/orders  (admin)
exports.getAllOrders = asyncHandler(async (_req, res) => {
  res.json(await Order.find().populate('user', 'name email').sort({ createdAt: -1 }));
});

// PUT /api/orders/:id/status  (admin)
exports.updateStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw httpError(404, 'Order not found');
  order.status = req.body.status;
  await order.save(); // schema enum rejects invalid statuses
  res.json(order);
});
