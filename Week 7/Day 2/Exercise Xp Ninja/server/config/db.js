const knexConfig = require('../../knexfile.cjs');

module.exports = require('knex')(knexConfig.development);