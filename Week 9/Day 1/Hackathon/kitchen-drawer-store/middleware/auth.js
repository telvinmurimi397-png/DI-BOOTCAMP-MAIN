function requireAuth(req, res, next) {
  if (!req.session.user) {
    const returnTo = req.method === 'GET' ? req.originalUrl : '/shop';
    return res.redirect(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user) return requireAuth(req, res, next);
  if (req.session.user.role !== 'admin') {
    return res.status(403).render('403', { title: 'Access Denied' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
