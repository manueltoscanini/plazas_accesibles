const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Antes de entrar a una ruta privada, reviso el token y miro si la cuenta sigue habilitada.
module.exports = async function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Falta el token' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Token inválido' });
  }

  try {
    // Reviso la cuenta porque el token puede durar 7 dias aunque la haya deshabilitado.
    const user = await User.findById(req.user.id).select('enabled role sessionVersion');
    if (!user || !user.enabled) {
      return res.status(401).json({ message: 'Cuenta no disponible' });
    }
    // Si la versión del token quedó vieja después de cambiar la contraseña, te pido iniciar sesión de nuevo.
    if ((req.user.sessionVersion ?? 0) !== (user.sessionVersion ?? 0)) {
      return res.status(401).json({ message: 'La sesión venció. Volvé a iniciar sesión.' });
    }
    req.user.role = user.role;
  } catch {
    // Si falla la base, devuelvo un error del servidor; no significa que el token sea invalido.
    return res.status(500).json({ message: 'Error al verificar la cuenta' });
  }

  next();
};
