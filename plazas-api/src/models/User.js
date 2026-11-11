const mongoose = require('mongoose');

// Así guardo una cuenta en MongoDB. La contraseña queda como hash.
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  email:     { type: String, required: true, unique: true, index: true, lowercase: true },
  phone:     { type: String, default: '', maxlength: 32 },
  password:  { type: String, required: true },
  // Cuando cambiás la contraseña, subo este número. Los tokens de antes dejan de servir.
  sessionVersion: { type: Number, default: 0 },
  role:      { type: String, enum: ['user', 'trusted', 'admin'], default: 'user' },
  enabled:   { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
