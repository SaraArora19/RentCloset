const express = require('express');
const cors = require('cors');
const authRoutes     = require('./routes/auth');
const productRoutes  = require('./routes/products');
const orderRoutes    = require('./routes/orders');
const wishlistRoutes = require('./routes/wishlist');
const deliveryRoutes = require('./routes/delivery');

const app = express();
const PORT = 5000;

app.use(cors({ origin: '*' }));
app.use(express.json());

app.use('/api/auth',     authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/delivery', deliveryRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'LoueStyle API running', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`\n🧥 LoueStyle API running at http://localhost:${PORT}\n`);
});
