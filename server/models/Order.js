const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Snapshot of each product at purchase time so later edits don't change history
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        name: String,
        image: String,
        price: Number,
        qty: Number,
      },
    ],
    shippingAddress: {
      fullName: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    paymentMethod: { type: String, enum: ['razorpay', 'demo'], default: 'demo' },
    // Card numbers are never stored: demo orders keep the last 4 digits only,
    // Razorpay orders keep Razorpay's order and payment ids.
    paymentResult: {
      status: String,
      last4: String,
      razorpayOrderId: String,
      razorpayPaymentId: String,
      paidAt: Date,
    },
    itemsPrice: Number,
    shippingPrice: Number,
    taxPrice: Number,
    totalPrice: Number,
    status: {
      type: String,
      enum: ['processing', 'shipped', 'delivered', 'cancelled'],
      default: 'processing',
    },
  },
  { timestamps: true }
);

// One Razorpay payment can only ever back one order (blocks replayed requests)
orderSchema.index(
  { 'paymentResult.razorpayPaymentId': 1 },
  { unique: true, sparse: true }
);

module.exports = mongoose.model('Order', orderSchema);
