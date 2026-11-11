const cloudinary = require('cloudinary').v2;

// Acá configuro Cloudinary, que es donde se suben las fotos. Las claves salen del entorno del servidor.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

module.exports = cloudinary;
