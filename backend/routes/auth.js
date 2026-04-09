const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../db/database');
const { JWT_SECRET, authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Seed admin password on first load (hash 'admin123')
(async () => {
  const admin = db.users.find(u => u.isAdmin);
  if (admin && !admin._pwdReady) {
    admin.password = await bcrypt.hash('admin123', 10);
    admin._pwdReady = true;
  }
})();

// POST /api/auth/register-admin  — open registration, anyone can create an admin account
router.post('/register-admin', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required.' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    if (db.users.find(u => u.email === email))
      return res.status(409).json({ error: 'Email already registered.' });

    const hashed = await bcrypt.hash(password, 10);
    const user = {
      id: db.nextUserId++, name, email, phone: '', password: hashed,
      isAdmin: true, createdAt: new Date().toISOString(), _pwdReady: true,
    };
    db.users.push(user);

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, isAdmin: true }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ message: 'Admin account created.', token, user: { id: user.id, name: user.name, email: user.email, phone: '', isAdmin: true } });
  } catch (e) { res.status(500).json({ error: 'Server error.' }); }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required.' });
    if (password.length < 6)          return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    if (db.users.find(u => u.email === email)) return res.status(409).json({ error: 'Email already registered.' });

    const hashed = await bcrypt.hash(password, 10);
    const user = { id: db.nextUserId++, name, email, phone: phone||'', password: hashed, isAdmin: false, createdAt: new Date().toISOString() };
    db.users.push(user);

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, isAdmin: false }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ message: 'Account created.', token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, isAdmin: false } });
  } catch (e) { res.status(500).json({ error: 'Server error.' }); }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

    const user = db.users.find(u => u.email === email);
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password.' });

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Login successful.', token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, isAdmin: user.isAdmin } });
  } catch (e) { res.status(500).json({ error: 'Server error.' }); }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ id: user.id, name: user.name, email: user.email, phone: user.phone, isAdmin: user.isAdmin });
});

// GET /api/auth/users  — ADMIN only
router.get('/users', authMiddleware, (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin only.' });
  const safe = db.users.filter(u => !u.isAdmin).map(u => ({
    id: u.id, name: u.name, email: u.email, phone: u.phone, createdAt: u.createdAt,
    orderCount: db.orders.filter(o => o.userId === u.id).length,
  }));
  res.json(safe);
});

module.exports = router;
