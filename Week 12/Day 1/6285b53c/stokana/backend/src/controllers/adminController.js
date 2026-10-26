const adminService = require('../services/adminService');

async function overview(req, res) {
  const data = await adminService.getOverview();
  res.json(data);
}

async function users(req, res) {
  const data = await adminService.listUsers(req.query);
  res.json(data);
}

async function setUserStatus(req, res) {
  const user = await adminService.setUserActive(req.user.id, req.params.userId, req.body.isActive);
  res.json({
    message: req.body.isActive ? 'Account reactivated.' : 'Account deactivated.',
    user
  });
}

async function sellers(req, res) {
  const data = await adminService.listSellers(req.query);
  res.json(data);
}

async function reviewSeller(req, res) {
  const seller = await adminService.reviewSeller(req.user.id, req.params.sellerId, req.body);
  const messages = {
    approve: 'Seller approved. They can now publish products.',
    reject: 'Seller application rejected.',
    suspend: 'Seller shop suspended and hidden from the marketplace.'
  };
  res.json({ message: messages[req.body.action], seller });
}

async function products(req, res) {
  const data = await adminService.listProducts(req.query);
  res.json(data);
}

async function reviewProduct(req, res) {
  const product = await adminService.reviewProduct(req.user.id, req.params.productId, req.body);
  const messages = {
    approve: 'Product approved and published.',
    reject: 'Product rejected. The seller can revise and resubmit it.',
    archive: 'Product removed from the marketplace.'
  };
  res.json({ message: messages[req.body.action], product });
}

async function categories(req, res) {
  const categories = await adminService.listCategories();
  res.json({ categories });
}

async function createCategory(req, res) {
  const category = await adminService.createCategory(req.body);
  res.status(201).json({ message: 'Category created.', category });
}

async function updateCategory(req, res) {
  const category = await adminService.updateCategory(req.params.categoryId, req.body);
  res.json({ message: 'Category updated.', category });
}

async function deleteCategory(req, res) {
  const category = await adminService.deactivateCategory(req.params.categoryId);
  res.json({
    message: 'Category deactivated. Its products are hidden until it is reactivated.',
    category
  });
}

async function orders(req, res) {
  const data = await adminService.listOrders(req.query);
  res.json(data);
}

async function updateOrderStatus(req, res) {
  const order = await adminService.updateOrderStatus(req.params.orderId, req.body.status);
  res.json({ message: 'Order status updated.', order });
}

async function reports(req, res) {
  const data = await adminService.getReports(req.query);
  res.json(data);
}

async function commissions(req, res) {
  const data = await adminService.getCommissions(req.query.status);
  res.json(data);
}

async function paySeller(req, res) {
  const result = await adminService.paySeller(req.body.sellerId, req.body.reference);
  res.json({
    message: `Payout recorded for KES ${Number(result.amount).toLocaleString('en-KE', {
      minimumFractionDigits: 2
    })} across ${result.count} sale${result.count === 1 ? '' : 's'}.`,
    ...result
  });
}

async function settings(req, res) {
  const data = await adminService.getSettings();
  res.json(data);
}

async function updateSettings(req, res) {
  const data = await adminService.updateSettings(req.body);
  res.json({
    message: 'Platform settings updated. Changes apply to future orders.',
    ...data
  });
}

module.exports = {
  overview,
  users,
  setUserStatus,
  sellers,
  reviewSeller,
  products,
  reviewProduct,
  categories,
  createCategory,
  updateCategory,
  deleteCategory,
  orders,
  updateOrderStatus,
  reports,
  commissions,
  paySeller,
  settings,
  updateSettings
};
