const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const cloudinary = require('cloudinary').v2;
const env = require('../config/env');

if (env.cloudinary.enabled) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true
  });
}

const EXTENSIONS = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
};

async function uploadProductImage(file) {
  if (!file || !file.buffer) throw new Error('No image data received.');

  if (env.cloudinary.enabled) {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: env.cloudinary.folder,
          resource_type: 'image',
          transformation: [{ width: 1400, height: 1400, crop: 'limit', quality: 'auto', fetch_format: 'auto' }]
        },
        (error, uploadResult) => (error ? reject(error) : resolve(uploadResult))
      );
      stream.end(file.buffer);
    });
    return { url: result.secure_url, storage: 'cloudinary' };
  }

  const extension = EXTENSIONS[file.mimetype] || '.jpg';
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${extension}`;
  const directory = path.join(env.uploadDir, 'products');
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, filename), file.buffer);
  return { url: `/uploads/products/${filename}`, storage: 'local' };
}

module.exports = { uploadProductImage };
