const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const SORTS = {
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  name: { name: 1 },
};
// Only these fields can be written from a request body
const pickFields = (b) => {
  const out = {};
  [
    'name',
    'description',
    'price',
    'images',
    'category',
    'countInStock',
    'featured',
  ].forEach((k) => b[k] !== undefined && (out[k] = b[k]));
  return out;
};

// GET /api/products?search=&category=&minPrice=&maxPrice=&sort=&page=&limit=
exports.getProducts = asyncHandler(async (req, res) => {
  const { search, category, minPrice, maxPrice, sort = 'newest' } = req.query;
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 50);

  const query = {};
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    query.$or = [{ name: rx }, { description: rx }];
  }
  if (category) query.category = category;
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  const total = await Product.countDocuments(query);
  const products = await Product.find(query)
    .sort(SORTS[sort] || SORTS.newest)
    .skip((page - 1) * limit)
    .limit(limit);
  res.json({ products, page, pages: Math.ceil(total / limit), total });
});

// GET /api/products/featured
exports.getFeatured = asyncHandler(async (_req, res) => {
  res.json(await Product.find({ featured: true }).limit(8));
});

// GET /api/products/categories
exports.getCategories = asyncHandler(async (_req, res) => {
  res.json((await Product.distinct('category')).sort());
});

// GET /api/products/:id
exports.getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw httpError(404, 'Product not found');
  res.json(product);
});

// POST /api/products  (admin)
exports.createProduct = asyncHandler(async (req, res) => {
  res.status(201).json(await Product.create(pickFields(req.body)));
});

// PUT /api/products/:id  (admin)
exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, pickFields(req.body), {
    new: true,
    runValidators: true,
  });
  if (!product) throw httpError(404, 'Product not found');
  res.json(product);
});

// DELETE /api/products/:id  (admin)
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw httpError(404, 'Product not found');
  res.json({ message: 'Product deleted' });
});
