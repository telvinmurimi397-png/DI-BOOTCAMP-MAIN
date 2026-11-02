const rewardService = require('../services/rewardService');

async function summary(req, res) {
  res.json(await rewardService.getSummary(req.user.id));
}

module.exports = { summary };
