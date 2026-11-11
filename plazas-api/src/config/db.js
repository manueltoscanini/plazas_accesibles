const mongoose = require('mongoose');

// Acá conecto Mongoose con MongoDB usando la dirección que está en la configuración.
module.exports = async function connectDB() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB conectado');
};
