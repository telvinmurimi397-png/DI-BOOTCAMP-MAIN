const multer = require('multer');
const { badRequest } = require('../utils/errors');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(req, file, callback) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return callback(badRequest('Upload a JPEG, PNG or WebP image.'));
    }
    callback(null, true);
  }
});

module.exports = upload;
