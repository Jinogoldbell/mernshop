const crypto = require('crypto');
const Razorpay = require('razorpay');
const httpError = require('./httpError');

let client;

exports.isConfigured = () =>
  Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

exports.currency = () => process.env.RAZORPAY_CURRENCY || 'INR';

/** Razorpay amounts are integers in the smallest unit (paise for INR). */
exports.toSubunits = (amount) => Math.round(amount * 100);

exports.getClient = () => {
  if (!exports.isConfigured())
    throw httpError(503, 'Razorpay is not configured on the server');
  client ||= new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  return client;
};

/**
 * Check the signature Razorpay returns to the browser after a successful payment:
 * HMAC-SHA256 of "order_id|payment_id" using the key secret.
 */
exports.verifySignature = (orderId, paymentId, signature) => {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
