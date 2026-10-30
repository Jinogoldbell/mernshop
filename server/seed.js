/**
 * Populate the database with an admin, a demo customer and sample products.
 * Usage: npm run seed   (WARNING: wipes users, products, carts and orders)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
const Cart = require('./models/Cart');
const Order = require('./models/Order');

const img = (seed) => `https://picsum.photos/seed/${seed}/800/800`;
const p = (name, category, price, stock, description, featured = false) => ({
  name,
  category,
  price,
  countInStock: stock,
  description,
  featured,
  images: [img(name.replace(/\W/g, '')), img(`${name.replace(/\W/g, '')}2`)],
});

const products = [
  p(
    'Stoneware Pour-Over Set',
    'Kitchen',
    2499,
    25,
    'Hand-glazed dripper and carafe that brews a clean, bright cup.',
    true
  ),
  p(
    'Linen Apron',
    'Kitchen',
    1299,
    40,
    'Stonewashed European linen with deep pockets and adjustable straps.'
  ),
  p(
    'Walnut Serving Board',
    'Kitchen',
    2199,
    18,
    'Oiled walnut board, 45 cm, with a juice groove and leather loop.',
    true
  ),
  p(
    'Beeswax Taper Candles',
    'Home',
    799,
    60,
    'Set of six dripless tapers that burn for about eight hours each.'
  ),
  p(
    'Wool Throw Blanket',
    'Home',
    4999,
    12,
    'Heavyweight merino throw woven in a herringbone pattern.',
    true
  ),
  p(
    'Brass Desk Lamp',
    'Home',
    3999,
    15,
    'Adjustable arm lamp with a warm, dimmable LED bulb included.'
  ),
  p(
    'Canvas Weekender Bag',
    'Travel',
    5499,
    10,
    'Waxed canvas carry-on with a padded shoulder strap and shoe pocket.',
    true
  ),
  p(
    'Packing Cube Trio',
    'Travel',
    999,
    55,
    'Three ripstop cubes in graduated sizes with mesh windows.'
  ),
  p(
    'Insulated Steel Bottle',
    'Travel',
    1199,
    80,
    'Keeps drinks cold for 24 hours or hot for 12. 750 ml.'
  ),
  p(
    'Merino Crew Socks',
    'Apparel',
    599,
    100,
    'Cushioned, odour-resistant socks in a pack of two.'
  ),
  p(
    'Organic Cotton Tee',
    'Apparel',
    1099,
    70,
    'Mid-weight tee with a relaxed fit, pre-washed to avoid shrinking.',
    true
  ),
  p(
    'Rain Shell Jacket',
    'Apparel',
    6999,
    14,
    'Packable, taped-seam shell that handles a proper downpour.'
  ),
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Promise.all([
      User.deleteMany(),
      Product.deleteMany(),
      Cart.deleteMany(),
      Order.deleteMany(),
    ]);

    await User.create({
      name: 'Admin',
      email: process.env.SEED_ADMIN_EMAIL || 'admin@example.com',
      password: process.env.SEED_ADMIN_PASSWORD || 'Admin123!',
      isAdmin: true,
    });
    await User.create({
      name: 'Demo Customer',
      email: 'customer@example.com',
      password: 'Customer123!',
    });
    await Product.insertMany(products);

    console.log(`Seeded ${products.length} products and 2 users.`);
    console.log(
      `Admin: ${process.env.SEED_ADMIN_EMAIL || 'admin@example.com'} / ${process.env.SEED_ADMIN_PASSWORD || 'Admin123!'}`
    );
    console.log('Customer: customer@example.com / Customer123!');
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
