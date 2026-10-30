require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/error');

if (!process.env.JWT_SECRET || !process.env.MONGO_URI) {
  console.error('Missing JWT_SECRET or MONGO_URI. Copy .env.example to .env first.');
  process.exit(1);
}

const app = express();

app.use(helmet()); // secure HTTP headers
app.use(
  cors({
    origin: (process.env.CLIENT_URL || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  })
);
app.use(express.json({ limit: '100kb' }));

// Slow down brute-force login attempts
app.use(
  '/api/auth',
  rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: true })
);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/users', require('./routes/users'));
app.use('/api/payments', require('./routes/payments'));

app.use(notFound);
app.use(errorHandler);

connectDB().then(() => {
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`API listening on port ${port}`));
});
