// Limpia datos de broma o inválidos (como «robot malvado» o plazas falsas) y carga datos de prueba realistas desde plazas.json.
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const Square = require('../src/models/PublicSquare');
const Report = require('../src/models/Report');
const { WC, Playground, Ramp, Hazard } = require('../src/models/elements');
const seedSquares = require('../plazas.json');

const INVALID_TEXT = /robot|malvado|plaza falsa|elemento de prueba|^prueba$/i;
const ELEMENT_MODELS = {
  ramps: Ramp,
  wcs: WC,
  playgrounds: Playground,
  hazards: Hazard,
};

async function syncSeedData() {
  // 1. Elimino plazas de demostración o con nombres inválidos y todo lo que cuelga de ellas.
  const badSquares = await Square.find({
    $or: [
      { demo: true },
      { name: INVALID_TEXT },
      { description: INVALID_TEXT },
      { accessibilityDescription: INVALID_TEXT },
    ],
  }).select('_id name');

  if (badSquares.length) {
    const badIds = badSquares.map(s => s._id);
    for (const Model of Object.values(ELEMENT_MODELS)) {
      await Model.deleteMany({ publicSquareId: { $in: badIds } });
    }
    await Report.deleteMany({ publicSquareId: { $in: badIds } });
    await Square.deleteMany({ _id: { $in: badIds } });
    console.log('Plazas eliminadas:', badSquares.map(s => s.name).join(', '));
  }

  // 2. Elimino elementos (obstáculos, rampas, baños, juegos) con descripciones que no corresponden.
  for (const [key, Model] of Object.entries(ELEMENT_MODELS)) {
    const found = await Model.find({ description: INVALID_TEXT }).lean();
    if (found.length) {
      console.log(`Elementos inválidos encontrados en ${key}:`, found.map(e => e.description));
      await Model.deleteMany({ _id: { $in: found.map(e => e._id) } });
    }
  }

  // 3. Elimino reportes que contengan textos inválidos como «robot malvado».
  const reports = await Report.find().lean();
  const badReportIds = reports
    .filter(r => INVALID_TEXT.test(JSON.stringify(r.changes || {})))
    .map(r => r._id);
  if (badReportIds.length) {
    await Report.deleteMany({ _id: { $in: badReportIds } });
    console.log(`Reportes eliminados: ${badReportIds.length}`);
  }

  // 4. Actualizo o creo cada plaza real de Paysandú con sus condiciones y elementos de prueba.
  for (const item of seedSquares) {
    const $set = {
      name: item.name,
      description: item.description,
      accessibilityDescription: item.accessibilityDescription,
      location: item.location,
    };
    const $unset = { demo: '' };

    for (const field of ['ramps', 'wc', 'playground', 'hazards']) {
      if (item[field]) $set[field] = item[field];
      else $unset[field] = '';
    }

    if (item.paths) {
      $set['paths.exists'] = item.paths.exists;
      $set['paths.accessible'] = Boolean(item.paths.accessible);
      $set['paths.description'] = item.paths.description || '';
    } else {
      $unset['paths.exists'] = '';
      $set['paths.accessible'] = false;
      $set['paths.description'] = '';
    }

    const square = await Square.findOneAndUpdate(
      { name: item.name },
      { $set, $unset },
      { new: true, upsert: true, runValidators: true }
    );

    // Sincronizo los elementos de la plaza con los datos de prueba limpios de plazas.json.
    for (const [key, Model] of Object.entries(ELEMENT_MODELS)) {
      const docs = (item.elements?.[key] || []).map(el => ({
        ...el,
        publicSquareId: square._id,
      }));
      if (!docs.length) {
        await Model.deleteMany({ publicSquareId: square._id });
        continue;
      }
      await Model.deleteMany({
        publicSquareId: square._id,
        $or: [{ picture: '' }, { picture: { $exists: false } }, { description: INVALID_TEXT }],
      });
      await Model.insertMany(docs);
    }

    console.log(`Plaza actualizada: ${square.name}`);
  }
}

async function run() {
  if (!process.env.MONGO_URI) {
    console.error('Falta MONGO_URI en plazas-api/.env o en las variables de entorno.');
    process.exit(1);
  }
  await connectDB();
  await syncSeedData();
  await mongoose.disconnect();
  console.log('Limpieza y carga de datos de prueba completada.');
}

if (require.main === module) {
  run().catch(async err => {
    console.error('Error al cargar datos de prueba:', err.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
}

module.exports = { syncSeedData };
