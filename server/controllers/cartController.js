const Cart = require('../models/Cart');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const { calculatePrices } = require('../utils/pricing');

/** Load (or create) the user's cart and respond with populated items + price summary. */
const sendCart = async (userId, res) => {
  const cart = await Cart.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId } },
    { new: true, upsert: true }
  ).populate('items.product');

  // Drop items whose product was deleted since being added
  const items = cart.items.filter((i) => i.product);
  const summary = calculatePrices(
    items.map((i) => ({ price: i.product.price, qty: i.qty }))
  );
  res.json({ items: items.map((i) => ({ product: i.product, qty: i.qty })), summary });
};

/** Validate a quantity against stock. */
const checkQty = (product, qty) => {
  if (!Number.isInteger(qty) || qty < 1)
    throw httpError(400, 'Quantity must be a whole number of at least 1');
  if (qty > product.countInStock)
    throw httpError(400, `Only ${product.countInStock} of "${product.name}" in stock`);
};

// GET /api/cart
exports.getCart = asyncHandler((req, res) => sendCart(req.user._id, res));

// POST /api/cart  { productId, qty }  adds to existing quantity
exports.addItem = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const qty = Number(req.body.qty ?? 1);
  const product = await Product.findById(productId);
  if (!product) throw httpError(404, 'Product not found');

  const cart =
    (await Cart.findOne({ user: req.user._id })) ||
    new Cart({ user: req.user._id, items: [] });
  const existing = cart.items.find((i) => i.product.equals(product._id));
  const newQty = (existing?.qty || 0) + qty;
  checkQty(product, newQty);

  if (existing) existing.qty = newQty;
  else cart.items.push({ product: product._id, qty });
  await cart.save();
  await sendCart(req.user._id, res);
});

// PUT /api/cart/:productId  { qty }  sets an exact quantity
exports.updateItem = asyncHandler(async (req, res) => {
  const qty = Number(req.body.qty);
  const product = await Product.findById(req.params.productId);
  if (!product) throw httpError(404, 'Product not found');
  checkQty(product, qty);

  const cart = await Cart.findOne({ user: req.user._id });
  const item = cart?.items.find((i) => i.product.equals(product._id));
  if (!item) throw httpError(404, 'Item not in cart');
  item.qty = qty;
  await cart.save();
  await sendCart(req.user._id, res);
});

// DELETE /api/cart/:productId
exports.removeItem = asyncHandler(async (req, res) => {
  await Cart.updateOne(
    { user: req.user._id },
    { $pull: { items: { product: req.params.productId } } }
  );
  await sendCart(req.user._id, res);
});

// DELETE /api/cart
exports.clearCart = asyncHandler(async (req, res) => {
  await Cart.updateOne({ user: req.user._id }, { $set: { items: [] } });
  await sendCart(req.user._id, res);
});
