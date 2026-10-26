const multer = require('multer');
const { ApiError } = require('../utils/errors');
const env = require('../config/env');

function notFoundApi(req, res) {
  res.status(404).json({ message: 'API endpoint not found.' });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error instanceof ApiError) {
    return res.status(error.status).json({
      message: error.message,
      ...(error.code ? { code: error.code } : {}),
      ...(error.details ? { details: error.details } : {})
    });
  }

  if (error instanceof multer.MulterError) {
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? 'Images must be 5MB or smaller.'
      : 'The image upload could not be processed.';
    return res.status(400).json({ message });
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'The request body contains invalid JSON.' });
  }

  if (error.code === '23505') {
    return res.status(409).json({ message: 'That record already exists. Please check your input.' });
  }
  if (error.code === '23503') {
    return res.status(400).json({ message: 'A linked record could not be found.' });
  }
  if (error.code === '23514' || error.code === '22P02') {
    return res.status(400).json({ message: 'One or more values are invalid.' });
  }

  console.error('[error]', error);
  res.status(500).json({
    message: env.isProduction
      ? 'Something went wrong on our side. Please try again.'
      : error.message || 'Internal server error.'
  });
}

module.exports = { notFoundApi, errorHandler };
