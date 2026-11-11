const mongoose = require('mongoose');
const Report = require('../models/Report');
const Square = require('../models/PublicSquare');
const { WC, Playground, Ramp, Hazard } = require('../models/elements');

const THRESHOLD = parseInt(process.env.REPORT_AUTO_THRESHOLD, 10) || 3;

const MODELS = { WC, Playground, Ramp, Hazard };
const EXISTS_FLAG = {
  WC: 'wc.exists',
  Playground: 'playground.exists',
  Ramp: 'ramps.exists',
  Hazard: 'hazards.exists',
};
const KEY_RE = /^(add|modify|delete)(WC|Playground|Ramp|Hazard)$/;
const PIC_RE = /^(add|delete)Picture$/;
const FIELDS = ['description', 'picture', 'lat', 'lon', 'accessible'];
const PHOTO_CATEGORIES = new Set(['ramps', 'wcs', 'accessibleWcs', 'playgrounds', 'hazards']);

function photoField(category = 'all') {
  if (category === 'all') return 'pictures';
  if (category === 'paths') return 'paths.pictures';
  if (PHOTO_CATEGORIES.has(category)) return `galleryPictures.${category}`;
}

// Solo se aceptan imagenes subidas a nuestra cuenta de Cloudinary
function isOurImage(url) {
  return (
    typeof url === 'string' &&
    url.startsWith(`https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/`)
  );
}

function pick(data) {
  const out = {};
  for (const f of FIELDS) if (data[f] !== undefined) out[f] = data[f];
  return out;
}

function validateChanges(changes) {
  if (!changes || typeof changes !== 'object' || Array.isArray(changes) || !Object.keys(changes).length) {
    return 'changes debe ser un objeto con al menos un cambio';
  }
  for (const [key, data] of Object.entries(changes)) {
    if (!data || typeof data !== 'object') return `${key} debe ser un objeto`;

    if (PIC_RE.test(key)) {
      if (!isOurImage(data.url)) return `${key} requiere la url de una imagen subida a la app`;
      if (!photoField(data.category)) return 'Categoría de foto no válida';
      continue;
    }

    const m = key.match(KEY_RE);
    if (!m) return `Cambio desconocido: ${key}`;
    // Rechaza null, textos y coordenadas fuera del rango real, tambien al modificar.
    for (const [campo, limite] of [['lat', 90], ['lon', 180]]) {
      const valor = data[campo];
      if (valor !== undefined &&
          (typeof valor !== 'number' || !Number.isFinite(valor) || Math.abs(valor) > limite)) {
        return `${campo} debe ser un número entre ${-limite} y ${limite}`;
      }
    }
    if (data.picture && !isOurImage(data.picture)) {
      return `${key}: la foto debe subirse primero a la app`;
    }
    if (m[1] === 'add') {
      if (typeof data.lat !== 'number' || typeof data.lon !== 'number') {
        return `${key} requiere lat y lon numéricos`;
      }
    } else if (!mongoose.isValidObjectId(data.id)) {
      return `${key} requiere un id válido`;
    }
  }
  return null;
}

// Aplica los cambios de un reporte aprobado y recalcula los "exists" de la plaza
// Todas las consultas usan la misma session para incluirlas en la transaccion de aprobacion.
async function applyChanges(report, session) {
  const squareId = report.publicSquareId;
  const touched = new Set();

  for (const [key, data] of Object.entries(report.changes)) {
    if (PIC_RE.test(key)) {
      const field = photoField(data.category);
      if (!field) throw new Error('Categoría de foto no válida');
      const operator = key === 'addPicture' ? '$addToSet' : '$pull';
      const square = await Square.findByIdAndUpdate(squareId, { [operator]: { [field]: data.url } }, { session });
      if (square === null) throw new Error('Plaza no encontrada');
      continue;
    }

    const [, action, type] = key.match(KEY_RE);
    const Model = MODELS[type];
    touched.add(type);

    if (action === 'add') {
      // Mongoose requiere un array de documentos para pasar { session } como opciones de create.
      await Model.create([{ ...pick(data), publicSquareId: squareId }], { session });
    } else if (action === 'modify') {
      const element = await Model.findOneAndUpdate(
        { _id: data.id, publicSquareId: squareId },
        { $set: pick(data) },
        { runValidators: true, session }
      );
      // Si no pertenece a esta plaza o ya no existe, el error cancela la transaccion.
      if (!element) throw new Error('El elemento no existe en esta plaza');
    } else {
      const result = await Model.deleteOne({ _id: data.id, publicSquareId: squareId }, { session });
      if (result.deletedCount === 0) throw new Error('El elemento no existe en esta plaza');
    }
  }

  const update = {};
  for (const type of touched) {
    // La misma session permite contar tambien los elementos creados o borrados en esta transaccion.
    const count = await MODELS[type].countDocuments({ publicSquareId: squareId }, { session });
    update[EXISTS_FLAG[type]] = count > 0;
  }
  if (Object.keys(update).length) {
    await Square.findByIdAndUpdate(squareId, { $set: update }, { session });
  }
}

// Pasa un reporte de pending a approved/rejected de forma atomica
// (si dos personas lo resuelven a la vez, solo una gana)
// extra guarda quien lo resolvio; session se recibe al aprobar y se omite al rechazar.
async function resolve(reportId, status, extra = {}, session) {
  return Report.findOneAndUpdate(
    { _id: reportId, status: 'pending' },
    { $set: { status, ...extra } },
    { new: true, session }
  );
}

// La aprobacion y los cambios se guardan juntos; si algo falla, se deshacen.
// Requiere MongoDB Atlas o un replica set; no funciona en un servidor independiente.
async function approveReport(reportId, extra = {}) {
  // Mongoose confirma la transaccion si termina bien; si lanza un error, la cancela.
  return mongoose.connection.transaction(async (session) => {
    const report = await resolve(reportId, 'approved', extra, session);
    // Si no existe o ya fue resuelto, resolve devuelve null y no aplicamos cambios.
    if (report) await applyChanges(report, session);
    return report;
  });
}

// POST /api/reports/create
exports.create = async (req, res) => {
  try {
    const { publicSquareId, changes } = req.body;
    if (!mongoose.isValidObjectId(publicSquareId)) {
      return res.status(400).json({ message: 'publicSquareId inv�lido' });
    }
    const error = validateChanges(changes);
    if (error) return res.status(400).json({ message: error });

    if (!(await Square.exists({ _id: publicSquareId }))) {
      return res.status(404).json({ message: 'Plaza no encontrada' });
    }

    const data = { publicSquareId, userId: req.user.id, changes };
    let report;
    if (req.user.role === 'admin' && Object.keys(changes).length === 1 && Object.hasOwn(changes, 'addPicture')) {
      report = await mongoose.connection.transaction(async session => {
        const [approved] = await Report.create([{ ...data, status: 'approved', approvedBy: req.user.id }], { session });
        await applyChanges(approved, session);
        return approved;
      });
    } else {
      report = await Report.create(data);
    }
    res.status(201).json(report);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET /api/reports/pending?squareId=...
exports.listPending = async (req, res) => {
  try {
    const filter = { status: 'pending' };
    if (req.query.squareId) {
      if (!mongoose.isValidObjectId(req.query.squareId)) {
        return res.status(400).json({ message: 'squareId inv�lido' });
      }
      filter.publicSquareId = req.query.squareId;
    }
    const reports = await Report.find(filter).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Votacion de usuarios comunes (upvote / downvote)
function voteHandler(isUpvote) {
  return async (req, res) => {
    try {
      const { reportId } = req.body;
      if (!mongoose.isValidObjectId(reportId)) {
        return res.status(400).json({ message: 'reportId inv�lido' });
      }
      const report = await Report.findById(reportId);
      if (!report) return res.status(404).json({ message: 'Reporte no encontrado' });
      if (report.status !== 'pending') return res.status(409).json({ message: 'El reporte ya fue resuelto' });
      if (report.userId.equals(req.user.id)) {
        return res.status(403).json({ message: 'No pod�s votar tu propio reporte' });
      }

      const add = isUpvote ? 'autoApprovedBy' : 'autoRejectedBy';
      const remove = isUpvote ? 'autoRejectedBy' : 'autoApprovedBy';

      let updated = await Report.findOneAndUpdate(
        { _id: reportId, status: 'pending' },
        { $addToSet: { [add]: req.user.id }, $pull: { [remove]: req.user.id } },
        { new: true }
      );
      if (!updated) return res.status(409).json({ message: 'El reporte ya fue resuelto' });

      const net = updated.autoApprovedBy.length - updated.autoRejectedBy.length;
      if (net >= THRESHOLD) {
        // El voto ya se guardo; la aprobacion y sus cambios se intentan juntos en otra operacion.
        const approved = await approveReport(reportId);
        if (approved) {
          updated = approved;
        }
      } else if (-net >= THRESHOLD) {
        updated = (await resolve(reportId, 'rejected')) || updated;
      }

      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
}
exports.upvote = voteHandler(true);
exports.downvote = voteHandler(false);

// POST /api/reports/approve   (trusted / admin)
exports.approve = async (req, res) => {
  try {
    const { reportId } = req.body;
    if (!mongoose.isValidObjectId(reportId)) {
      return res.status(400).json({ message: 'reportId inv�lido' });
    }
    // Usa la misma transaccion que la aprobacion por votos y registra quien aprobo.
    const report = await approveReport(reportId, { approvedBy: req.user.id });
    if (!report) return res.status(409).json({ message: 'El reporte no existe o ya fue resuelto' });
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/reports/reject   (trusted / admin). No aplica los cambios.
exports.reject = async (req, res) => {
  try {
    const { reportId } = req.body;
    if (!mongoose.isValidObjectId(reportId)) {
      return res.status(400).json({ message: 'reportId inv�lido' });
    }
    const report = await resolve(reportId, 'rejected', { rejectedBy: req.user.id });
    if (!report) return res.status(409).json({ message: 'El reporte no existe o ya fue resuelto' });
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
