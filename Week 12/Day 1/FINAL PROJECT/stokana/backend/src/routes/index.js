const express = require('express');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./authRoutes');
const productRoutes = require('./productRoutes');
const categoryRoutes = require('./categoryRoutes');
const shopRoutes = require('./shopRoutes');
const cartRoutes = require('./cartRoutes');
const orderRoutes = require('./orderRoutes');
const messageRoutes = require('./messageRoutes');
const sellerRoutes = require('./sellerRoutes');
const adminRoutes = require('./adminRoutes');
const reviewRoutes = require('./reviewRoutes');
const paymentRoutes = require('./paymentRoutes');
const catalogueController = require('../controllers/catalogueController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please wait a few minutes.' }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many failed sign-in attempts. Please wait 15 minutes.' }
});

const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 15,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many accounts created from this network. Please try again later.' }
});

const recoveryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 8,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many password reset requests. Please try again later.' }
});

function onlyFor(path, limiter) {
  return (req, res, next) => (req.path === path ? limiter(req, res, next) : next());
}

router.use('/auth', authLimiter);
router.use('/auth', onlyFor('/login', loginLimiter));
router.use('/auth', onlyFor('/register', registrationLimiter));
router.use('/auth', onlyFor('/forgot-password', recoveryLimiter));
router.use('/auth', onlyFor('/reset-password', recoveryLimiter));
router.use('/auth', authRoutes);

router.get('/stats', asyncHandler(catalogueController.stats));
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/shops', shopRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/messages', messageRoutes);
router.use('/seller', sellerRoutes);
router.use('/admin', adminRoutes);
router.use('/reviews', reviewRoutes);
router.use('/payments', paymentRoutes);

module.exports = router;
