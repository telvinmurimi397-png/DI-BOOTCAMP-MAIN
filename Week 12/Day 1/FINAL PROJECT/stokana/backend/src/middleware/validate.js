const { ApiError } = require('../utils/errors');

function validate(schema, source = 'body') {
  return function validationMiddleware(req, res, next) {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || source,
        message: issue.message
      }));
      return next(new ApiError(400, 'Please check the highlighted fields.', { code: 'VALIDATION_ERROR', details }));
    }
    req[source] = result.data;
    next();
  };
}

module.exports = validate;
