const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Acá armo el token con el ID de la cuenta y la versión de la sesión.
const signToken = (user) =>
  jwt.sign({ id: user._id, sessionVersion: user.sessionVersion ?? 0 }, process.env.JWT_SECRET, { expiresIn: '7d' });

const profileFields = ['firstName', 'lastName', 'email', 'phone'];

// Devuelvo solo los datos del perfil. El hash de la contraseña se queda en el servidor.
function profile(user) {
  const { firstName, lastName, email, phone = '', role } = user;
  return { firstName, lastName, email, phone, role };
}

async function matchesPassword(value, user) {
  return typeof value === 'string' && value.length > 0 && bcrypt.compare(value, user.password);
}

exports.checkEmail = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  res.json({ result: !!user });
};

// Cuando creás una cuenta, bcrypt convierte la contraseña en un hash antes de guardarla.
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    if (await User.findOne({ email })) {
      return res.status(409).json({ message: 'El correo ya está registrado' });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ firstName, lastName, email, password: hash });
    res.status(201).json({ token: signToken(user), role: user.role });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Busco la cuenta y comparo la contraseña. Si está bien, te devuelvo el token y el rol.
exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !user.enabled || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }
  res.json({ token: signToken(user), role: user.role });
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('firstName lastName email phone role enabled');
    if (!user?.enabled) return res.status(401).json({ message: 'Cuenta no disponible.' });
    res.json(profile(user));
  } catch {
    res.status(500).json({ message: 'No se pudo cargar el perfil.' });
  }
};

// Solo guardo los datos editables. Si cambiaste el correo, reviso la contraseña actual antes de guardar.
exports.updateMe = async (req, res) => {
  const body = req.body ?? {};
  const changes = {};
  for (const field of profileFields) {
    if (!Object.hasOwn(body, field)) continue;
    if (typeof body[field] !== 'string') return res.status(400).json({ message: 'Revisá los datos del perfil.' });
    changes[field] = body[field].trim();
  }

  for (const field of ['firstName', 'lastName']) {
    if (changes[field] !== undefined && (!changes[field] || changes[field].length > 100)) {
      return res.status(400).json({ message: 'Escribí un nombre y un apellido de hasta 100 caracteres.' });
    }
  }
  if (changes.phone && (changes.phone.length > 32 || !/^\+?[0-9 ().-]+$/.test(changes.phone) || changes.phone.replace(/\D/g, '').length < 5)) {
    return res.status(400).json({ message: 'Escribí un número de contacto válido.' });
  }
  if (changes.email !== undefined) {
    changes.email = changes.email.toLowerCase();
    if (changes.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(changes.email)) {
      return res.status(400).json({ message: 'Escribí un correo electrónico válido.' });
    }
  }

  try {
    const filter = { _id: req.user.id, enabled: true };
    if (changes.email !== undefined) {
      const user = await User.findById(req.user.id).select('firstName lastName email phone role enabled password');
      if (!user?.enabled) return res.status(401).json({ message: 'Cuenta no disponible.' });
      if (changes.email === user.email) {
        delete changes.email;
        if (!Object.keys(changes).length) return res.json(profile(user));
      } else {
        if (!(await matchesPassword(body.currentPassword, user))) {
          return res.status(403).json({ message: 'Ingresá tu contraseña actual para cambiar el correo.' });
        }
        filter.email = user.email;
        filter.password = user.password;
      }
    }
    if (!Object.keys(changes).length) return res.status(400).json({ message: 'No hay datos para actualizar.' });
    const user = await User.findOneAndUpdate(filter, { $set: changes }, { new: true, runValidators: true });
    if (!user) return res.status(409).json({ message: 'La cuenta cambió. Volvé a abrir el perfil e intentá de nuevo.' });
    res.json(profile(user));
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'El correo ya está registrado.' });
    res.status(500).json({ message: 'No se pudieron guardar los datos del perfil.' });
  }
};

// Guardo el hash nuevo y actualizo la versión de sesión. Te mando otro token para que puedas seguir en esta pestaña.
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body ?? {};
  if (typeof newPassword !== 'string' || newPassword.length < 8 || Buffer.byteLength(newPassword) > 72) {
    return res.status(400).json({ message: 'Usá una contraseña de al menos 8 caracteres y como máximo 72 bytes.' });
  }
  if (currentPassword === newPassword) return res.status(400).json({ message: 'Elegí una contraseña diferente de la actual.' });
  try {
    const user = await User.findById(req.user.id).select('enabled password');
    if (!user?.enabled) return res.status(401).json({ message: 'Cuenta no disponible.' });
    if (!(await matchesPassword(currentPassword, user))) {
      return res.status(403).json({ message: 'La contraseña actual es incorrecta.' });
    }
    const password = await bcrypt.hash(newPassword, 10);
    const updated = await User.findOneAndUpdate(
      { _id: req.user.id, enabled: true, password: user.password },
      { $set: { password }, $inc: { sessionVersion: 1 } },
      { new: true },
    );
    if (!updated) return res.status(409).json({ message: 'La cuenta cambió. Volvé a iniciar sesión e intentá de nuevo.' });
    res.json({ token: signToken(updated), role: updated.role });
  } catch {
    res.status(500).json({ message: 'No se pudo cambiar la contraseña.' });
  }
};
