// Photo storage helpers. Files are written under data/uploads and served
// read-only from /uploads. Accepts either a multipart file (via multer) or a
// base64 data URL (so the existing frontend keeps working).

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { DATA_DIR } = require('./db');

const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// multer instance: single optional field named "photo"
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      const ext = ALLOWED[file.mimetype] || 'bin';
      cb(null, crypto.randomBytes(8).toString('hex') + '.' + ext);
    }
  }),
  limits: { fileSize: MAX_BYTES },
  fileFilter: (req, file, cb) => cb(null, !!ALLOWED[file.mimetype])
});

// Persist a base64 data URL to disk, return the public path or null.
function saveDataUrl(dataUrl) {
  if (typeof dataUrl !== 'string') return null;
  const m = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!m) return null;
  const ext = ALLOWED[m[1]];
  if (!ext) return null;
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > MAX_BYTES) return null;
  const name = crypto.randomBytes(8).toString('hex') + '.' + ext;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
  return '/uploads/' + name;
}

module.exports = { upload, saveDataUrl, UPLOAD_DIR };