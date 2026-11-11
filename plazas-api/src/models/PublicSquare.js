const mongoose = require('mongoose');

const squareSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    demo: { type: Boolean },
    description: { type: String, default: '' },
    accessibilityDescription: { type: String, default: '' },
    location: {
      lat: { type: Number, required: true, min: -90, max: 90 },
      lon: { type: Number, required: true, min: -180, max: 180 },
    },
    wc: { exists: { type: Boolean, default: false } },
    playground: { exists: { type: Boolean, default: false } },
    ramps: { exists: { type: Boolean, default: false } },
    paths: {
      exists: { type: Boolean, default: false },
      accessible: { type: Boolean, default: false },
      description: { type: String, default: '' },
      pictures: [{ type: String, match: /^https?:\/\/\S+$/i }],
    },
    // Los obstaculos los guardo en PublicSquareHazard; aca solo indico si hay alguno.
    hazards: {
      exists: { type: Boolean, default: false },
    },
    pictures: { type: [String], default: [] },
    galleryPictures: { type: Map, of: [String] },
  },
  { timestamps: true } // crea createdAt y updatedAt automaticamente
);

module.exports = mongoose.model('PublicSquare', squareSchema);
