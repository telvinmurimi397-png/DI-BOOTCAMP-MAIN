const userService = require('../services/userService');
const verificationService = require('../services/verificationService');
const addressService = require('../services/addressService');
const { toPublicUser } = require('../utils/toPublicUser');
const { notFound } = require('../utils/errors');
const env = require('../config/env');

async function sendVerification(req, res) {
  const result = await verificationService.send(req.user, req.body.channel);
  res.json({
    message: 'A verification code has been sent.',
    ...(!env.isProduction ? { devCode: result.devCode } : {})
  });
}

async function verify(req, res) {
  const row = await verificationService.verify(req.user.id, req.body.channel, req.body.code);
  res.json({ message: 'Contact verified.', user: toPublicUser(row) });
}

async function listAddresses(req, res) {
  res.json({ addresses: await addressService.list(req.user.id) });
}

async function createAddress(req, res) {
  const id = await addressService.save(req.user.id, req.body);
  const addresses = await addressService.list(req.user.id);
  res.status(201).json({
    message: 'Delivery address saved.',
    address: addresses.find((address) => Number(address.id) === Number(id))
  });
}

async function updateAddress(req, res) {
  const id = await addressService.save(req.user.id, req.body, req.params.addressId);
  const addresses = await addressService.list(req.user.id);
  const address = addresses.find((item) => Number(item.id) === Number(id));
  if (!address) throw notFound('Delivery address not found.');
  res.json({ message: 'Delivery address updated.', address });
}

async function deleteAddress(req, res) {
  await addressService.remove(req.user.id, req.params.addressId);
  res.json({ message: 'Delivery address deleted.' });
}

module.exports = {
  sendVerification,
  verify,
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress
};
