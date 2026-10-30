const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    description: { type: String, required: [true, 'Description is required'] },
    price: { type: Number, required: [true, 'Price is required'], min: 0 },
    images: { type: [String], default: [] },
    category: { type: String, required: [true, 'Category is required'], trim: true },
    countInStock: { type: Number, required: true, min: 0, default: 0 },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
