const userService = require('../services/userService');
const { toPublicUser } = require('../utils/toPublicUser');
const { unauthorized, forbidden } = require('../utils/errors');
const env = require('../config/env');

async function attachUser(req, res, next) {
  if (!req.session || !req.session.userId) return next();
  try {
    const row = await userService.findById(req.session.userId);
    if (!row || !row.isActive) {
      req.session.destroy(() => {});
      res.clearCookie(env.session.name, { path: '/' });
      return next();
    }
    req.user = toPublicUser(row);
    next();
  } catch (error) {
    next(error);
  }
}

function requireAuth(req, res, next) {
  if (!req.user) return next(unauthorized());
  next();
}

function requireRole(...roles) {
  return function roleGuard(req, res, next) {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(forbidden('Your account does not have permission to perform this action.'));
    }
    next();
  };
}

function requireApprovedSeller(req, res, next) {
  if (!req.user) return next(unauthorized());
  if (req.user.role !== 'seller') {
    return next(forbidden('Only seller accounts can perform this action.'));
  }
  if (req.user.sellerProfile?.status !== 'approved') {
    return next(
      forbidden('Your shop must be approved before you can publish products.', {
        code: 'SELLER_NOT_APPROVED'
      })
    );
  }
  next();
}

const requireBuyer = requireRole('buyer');
const requireSeller = requireRole('seller');
const requireAdmin = requireRole('admin');

module.exports = {
  attachUser,
  requireAuth,
  requireRole,
  requireBuyer,
  requireSeller,
  requireAdmin,
  requireApprovedSeller
};
