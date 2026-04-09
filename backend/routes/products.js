const express = require('express');
const db = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/products
router.get('/', (req, res) => {
  let products = db.products;
  const { category, search } = req.query;
  if (category && category !== 'All') products = products.filter(p => p.category === category);
  if (search) {
    const q = search.toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
  }
  res.json(products);
});

// GET /api/products/categories
router.get('/categories', (req, res) => {
  const categories = ['All', ...new Set(db.products.map(p => p.category))];
  res.json(categories);
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  const product = db.products.find(p => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  res.json(product);
});

// POST /api/products  — ADMIN only (add new product)
router.post('/', authMiddleware, (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin only.' });
  const { name, category, pricePerDay, description, image, sizes } = req.body;
  if (!name || !category || !pricePerDay) return res.status(400).json({ error: 'name, category and pricePerDay are required.' });
  const product = {
    id: db.nextProductId++,
    name, category,
    pricePerDay: parseInt(pricePerDay),
    description: description || '',
    image: image || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
    sizes: sizes || ['S','M','L','XL'],
    available: true,
  };
  db.products.push(product);
  res.status(201).json(product);
});

// PUT /api/products/:id  — ADMIN only (edit product)
router.put('/:id', authMiddleware, (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin only.' });
  const idx = db.products.findIndex(p => p.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Product not found.' });
  const { name, category, pricePerDay, description, image, sizes, available } = req.body;
  if (name !== undefined)        db.products[idx].name = name;
  if (category !== undefined)    db.products[idx].category = category;
  if (pricePerDay !== undefined) db.products[idx].pricePerDay = parseInt(pricePerDay);
  if (description !== undefined) db.products[idx].description = description;
  if (image !== undefined)       db.products[idx].image = image;
  if (sizes !== undefined)       db.products[idx].sizes = sizes;
  if (available !== undefined)   db.products[idx].available = available;
  res.json(db.products[idx]);
});

// DELETE /api/products/:id  — ADMIN only
router.delete('/:id', authMiddleware, (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin only.' });
  const idx = db.products.findIndex(p => p.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Product not found.' });
  db.products.splice(idx, 1);
  res.json({ message: 'Product deleted.' });
});

module.exports = router;
