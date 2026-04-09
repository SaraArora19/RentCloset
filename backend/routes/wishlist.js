const express = require('express');
const db = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// All wishlist routes require authentication
router.use(authMiddleware);

// GET /api/wishlist — get user's wishlist with product details
router.get('/', (req, res) => {
  const items = db.wishlist
    .filter(w => w.userId === req.user.id)
    .map(w => db.products.find(p => p.id === w.productId))
    .filter(Boolean);

  res.json(items);
});

// POST /api/wishlist/:productId — add to wishlist
router.post('/:productId', (req, res) => {
  const productId = parseInt(req.params.productId);
  const product = db.products.find(p => p.id === productId);
  if (!product) return res.status(404).json({ error: 'Product not found.' });

  const exists = db.wishlist.find(w => w.userId === req.user.id && w.productId === productId);
  if (exists) return res.status(409).json({ error: 'Already in wishlist.' });

  db.wishlist.push({ userId: req.user.id, productId });
  res.status(201).json({ message: 'Added to wishlist.', product });
});

// DELETE /api/wishlist/:productId — remove from wishlist
router.delete('/:productId', (req, res) => {
  const productId = parseInt(req.params.productId);
  const idx = db.wishlist.findIndex(w => w.userId === req.user.id && w.productId === productId);
  if (idx === -1) return res.status(404).json({ error: 'Not in wishlist.' });

  db.wishlist.splice(idx, 1);
  res.json({ message: 'Removed from wishlist.' });
});

module.exports = router;
