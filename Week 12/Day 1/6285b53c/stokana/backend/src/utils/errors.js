class ApiError extends Error {
  constructor(status, message, options = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = options.code || null;
    this.details = options.details || null;
  }
}

const badRequest = (message, options) => new ApiError(400, message, options);
const unauthorized = (message = 'Please sign in to continue.') => new ApiError(401, message);
const forbidden = (message = 'You do not have access to this action.', options) =>
  new ApiError(403, message, options);
const notFound = (message = 'The requested resource was not found.') => new ApiError(404, message);
const conflict = (message, options) => new ApiError(409, message, options);

module.exports = { ApiError, badRequest, unauthorized, forbidden, notFound, conflict };
