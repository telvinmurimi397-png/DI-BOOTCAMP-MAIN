const promotionService = require('../services/promotionService');

async function quote(req, res) {
  res.json(await promotionService.quote(req.user.id, req.body));
}

async function listAdmin(req, res) {
  res.json({ promotions: await promotionService.list(null, true) });
}

async function listSeller(req, res) {
  res.json({ promotions: await promotionService.list(req.user.id, false) });
}

async function createAdmin(req, res) {
  const promotion = await promotionService.create(null, req.body);
  res.status(201).json({ message: 'Promotion created.', promotion });
}

async function createSeller(req, res) {
  const promotion = await promotionService.create(req.user.id, req.body);
  res.status(201).json({ message: 'Discount code created.', promotion });
}

async function setAdminActive(req, res) {
  const promotion = await promotionService.setActive(
    null, true, req.params.promotionId, req.body.isActive
  );
  res.json({ message: 'Promotion updated.', promotion });
}

async function setSellerActive(req, res) {
  const promotion = await promotionService.setActive(
    req.user.id, false, req.params.promotionId, req.body.isActive
  );
  res.json({ message: 'Discount code updated.', promotion });
}

module.exports = {
  quote,
  listAdmin,
  listSeller,
  createAdmin,
  createSeller,
  setAdminActive,
  setSellerActive
};
