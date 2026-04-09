const express = require('express');
const db = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/delivery/partners  — ADMIN only
router.get('/partners', authMiddleware, (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin only.' });
  res.json(db.deliveryPartners);
});

// POST /api/delivery/partners  — ADMIN only (add partner)
router.post('/partners', authMiddleware, (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin only.' });
  const { name, phone, area } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'name and phone required.' });
  const partner = { id: db.nextDeliveryPartnerId++, name, phone, area: area || 'General', active: true, assignedOrders: 0 };
  db.deliveryPartners.push(partner);
  res.status(201).json(partner);
});

// DELETE /api/delivery/partners/:id  — ADMIN only
router.delete('/partners/:id', authMiddleware, (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin only.' });
  const idx = db.deliveryPartners.findIndex(p => p.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Partner not found.' });
  db.deliveryPartners.splice(idx, 1);
  res.json({ message: 'Partner removed.' });
});

// POST /api/delivery/assign  — ADMIN only (assign partner to order)
router.post('/assign', authMiddleware, (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin only.' });
  const { orderId, partnerId } = req.body;
  const order = db.orders.find(o => o.id === parseInt(orderId));
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  const partner = db.deliveryPartners.find(p => p.id === parseInt(partnerId));
  if (!partner) return res.status(404).json({ error: 'Partner not found.' });

  // Unassign from old partner if any
  if (order.deliveryPartnerId) {
    const old = db.deliveryPartners.find(p => p.id === order.deliveryPartnerId);
    if (old && old.assignedOrders > 0) old.assignedOrders--;
  }

  order.deliveryPartnerId = partner.id;
  order.deliveryPartnerName = partner.name;
  order.deliveryPartnerPhone = partner.phone;
  partner.assignedOrders++;
  res.json({ message: 'Partner assigned.', order, partner });
});

module.exports = router;
