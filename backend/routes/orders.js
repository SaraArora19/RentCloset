const express = require('express');
const db = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// All order routes require authentication
router.use(authMiddleware);

// GET /api/orders — current user's orders
router.get('/', (req, res) => {
  const { filter } = req.query;
  let orders = db.orders.filter(o => o.userId === req.user.id);
  if (filter === 'active') orders = orders.filter(o => ['pending','confirmed','shipped','out_for_delivery'].includes(o.status));
  if (filter === 'past')   orders = orders.filter(o => ['returned','completed','cancelled'].includes(o.status));
  const enriched = orders.map(o => ({ ...o, product: db.products.find(p => p.id === o.productId) || null }));
  res.json(enriched);
});

// GET /api/orders/all  — ADMIN: all orders
router.get('/all', (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin only.' });
  const enriched = db.orders.map(o => {
    const user = db.users.find(u => u.id === o.userId);
    return { ...o, product: db.products.find(p => p.id === o.productId) || null, userName: user?.name || 'Unknown', userEmail: user?.email || '' };
  });
  res.json(enriched);
});

// POST /api/orders — place order
router.post('/', (req, res) => {
  const { productId, startDate, endDate, address, paymentMethod } = req.body;
  if (!productId || !startDate || !endDate || !address || !paymentMethod)
    return res.status(400).json({ error: 'All fields are required.' });

  const product = db.products.find(p => p.id === parseInt(productId));
  if (!product) return res.status(404).json({ error: 'Product not found.' });

  const days = Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000);
  if (days <= 0) return res.status(400).json({ error: 'End date must be after start date.' });

  const orderId = 'ORD' + String(Date.now()).slice(-5);
  const tracking = buildTracking('confirmed', startDate, endDate);

  const order = {
    id: orderId, userId: req.user.id,
    productId: product.id, productName: product.name,
    startDate, endDate, days,
    pricePerDay: product.pricePerDay,
    totalCost: days * product.pricePerDay,
    address, paymentMethod,
    status: 'confirmed',
    tracking,
    createdAt: new Date().toISOString(),
  };
  db.orders.push(order);
  res.status(201).json({ message: 'Order placed successfully.', order: { ...order, product } });
});

// GET /api/orders/:id/track
router.get('/:id/track', (req, res) => {
  const order = db.orders.find(o => o.id === req.params.id && (o.userId === req.user.id || req.user.isAdmin));
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  res.json({ orderId: order.id, status: order.status, tracking: order.tracking, productName: order.productName, startDate: order.startDate, endDate: order.endDate, address: order.address });
});

// PATCH /api/orders/:id/status — update status (admin or for cancel by user)
router.patch('/:id/status', (req, res) => {
  const order = db.orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  // Only admin can set any status; user can only cancel their own confirmed order
  if (!req.user.isAdmin) {
    if (order.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden.' });
    if (req.body.status !== 'cancelled') return res.status(403).json({ error: 'You can only cancel orders.' });
    if (order.status !== 'confirmed') return res.status(400).json({ error: 'Only confirmed orders can be cancelled.' });
  }

  const validStatuses = ['pending','confirmed','shipped','out_for_delivery','returned','completed','cancelled'];
  const { status } = req.body;
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status.' });

  order.status = status;
  order.tracking = buildTracking(status, order.startDate, order.endDate);
  res.json({ message: 'Status updated.', order });
});

// DELETE /api/orders/:id — user cancel
router.delete('/:id', (req, res) => {
  const idx = db.orders.findIndex(o => o.id === req.params.id && o.userId === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'Order not found.' });
  if (db.orders[idx].status !== 'confirmed') return res.status(400).json({ error: 'Only confirmed orders can be cancelled.' });
  db.orders.splice(idx, 1);
  res.json({ message: 'Order cancelled.' });
});

// ── helper: build tracking timeline based on status ──
function buildTracking(status, startDate, endDate) {
  const statuses = ['confirmed','shipped','out_for_delivery','returned'];
  const idx = statuses.indexOf(status);
  const now = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  const steps = [
    { key: 'confirmed',        label: 'Order Confirmed',     desc: 'Your order has been placed and confirmed.' },
    { key: 'shipped',          label: 'Shipped',             desc: 'Your item is on its way to you.' },
    { key: 'out_for_delivery', label: 'Out for Delivery',    desc: 'Our delivery partner is on the way.' },
    { key: 'returned',         label: 'Delivered & Returned',desc: 'Item was delivered and return completed.' },
  ];

  return steps.map((s, i) => ({
    ...s,
    done:   idx > i || (status === s.key),
    active: status === s.key,
    time:   i <= idx ? now : null,
  }));
}

module.exports = router;
