const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Square = require('../src/models/PublicSquare');
const { WC, Playground, Ramp, Hazard } = require('../src/models/elements');
const controller = require('../src/controllers/square.controller');

test('guarda fotos de caminos en el modelo de plaza', async () => {
  const square = new Square({
    name: 'Prueba', location: { lat: -32, lon: -58 },
    paths: { pictures: ['https://example.com/camino.jpg'] },
  });
  assert.deepEqual(square.toObject().paths.pictures, ['https://example.com/camino.jpg']);
  await square.validate();
  square.paths.pictures = ['javascript:alert(1)'];
  await assert.rejects(square.validate(), error => Boolean(error.errors['paths.pictures.0']));
});

test('PATCH cambia fotos de caminos sin reemplazar sus otros datos', async (t) => {
  const pictures = ['https://example.com/camino.jpg'];
  const id = new mongoose.Types.ObjectId().toString();
  t.mock.method(Square, 'findByIdAndUpdate', async (squareId, update) => {
    assert.equal(squareId, id);
    assert.deepEqual(update, { $set: { 'paths.pictures': pictures } });
    return { _id: id, paths: { pictures } };
  });
  const res = {
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; },
  };
  await controller.update({ params: { id }, body: { paths: { pictures } } }, res);
  assert.equal(res.code, undefined);
  assert.deepEqual(res.body.paths.pictures, pictures);
});

test('la plaza conserva exists pero no guarda una segunda lista de obstaculos', () => {
  const square = new Square({
    name: 'Prueba', location: { lat: -32, lon: -58 },
    hazards: { exists: true, hazards: [{ description: 'Pozo', lat: -32, lon: -58 }] },
  }).toObject();
  assert.deepEqual(square.hazards, { exists: true });
});

for (const handler of ['create', 'update']) {
  test(`${handler} no permite editar hazards directamente`, async (t) => {
    let saved;
    if (handler === 'create') {
      t.mock.method(Square, 'create', async (data) => { saved = data; return data; });
    } else {
      t.mock.method(Square, 'findByIdAndUpdate', async (id, update) => { saved = update.$set; return saved; });
    }
    const res = {
      code: 200,
      status(code) { this.code = code; return this; },
      json(body) { this.body = body; },
    };
    await controller[handler]({
      params: { id: new mongoose.Types.ObjectId().toString() },
      body: { name: 'Prueba', hazards: { exists: true, hazards: [] } },
    }, res);
    assert.equal(res.code, handler === 'create' ? 201 : 200);
    assert.deepEqual(saved, { name: 'Prueba' });
  });
}

test('la ficha devuelve los detalles de los obstaculos en elements.hazards', async (t) => {
  const id = new mongoose.Types.ObjectId();
  const hazard = { description: 'Pozo', picture: 'https://example.com/pozo.jpg', lat: -32, lon: -58 };
  t.mock.method(Square, 'findById', () => ({ lean: async () => ({ _id: id, hazards: { exists: true } }) }));
  for (const model of [WC, Playground, Ramp, Hazard]) {
    t.mock.method(model, 'find', (filter) => {
      assert.deepEqual(filter, { publicSquareId: id });
      return { lean: async () => model === Hazard ? [hazard] : [] };
    });
  }
  const res = { json(body) { this.body = body; } };
  await controller.getById({ params: { id: id.toString() } }, res);
  assert.deepEqual(res.body.hazards, { exists: true });
  assert.deepEqual(res.body.elements.hazards, [hazard]);
});
