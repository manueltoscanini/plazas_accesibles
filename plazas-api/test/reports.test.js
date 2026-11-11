const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Report = require('../src/models/Report');
const Square = require('../src/models/PublicSquare');
const { WC, Ramp, Hazard } = require('../src/models/elements');
const controller = require('../src/controllers/reports.controller');

// Pruebo cuándo una foto queda pendiente y si al aprobar se guardan todos los cambios juntos.
for (const role of ['user', 'admin']) {
  test(`foto de una galería enviada por ${role}`, async (t) => {
    const previous = process.env.CLOUDINARY_CLOUD_NAME;
    process.env.CLOUDINARY_CLOUD_NAME = 'pruebas';
    t.after(() => {
      if (previous === undefined) delete process.env.CLOUDINARY_CLOUD_NAME;
      else process.env.CLOUDINARY_CLOUD_NAME = previous;
    });
    const url = 'https://res.cloudinary.com/pruebas/image/upload/rampa.jpg';
    const publicSquareId = new mongoose.Types.ObjectId().toString();
    const userId = new mongoose.Types.ObjectId().toString();
    const session = {};
    const writes = [];
    t.mock.method(Square, 'exists', async () => true);
    t.mock.method(mongoose.connection, 'transaction', async callback => callback(session));
    t.mock.method(Report, 'create', async (data, options) => {
      if (!options) return { ...data, status: 'pending' };
      assert.equal(options.session, session);
      return data;
    });
    t.mock.method(Square, 'findByIdAndUpdate', async (id, update, options) => {
      assert.equal(id, publicSquareId);
      assert.equal(options.session, session);
      writes.push(update);
      return { _id: id };
    });
    const res = {
      status(code) { this.code = code; return this; },
      json(body) { this.body = body; },
    };
    await controller.create({
      body: { publicSquareId, changes: { addPicture: { url, category: 'ramps' } } },
      user: { id: userId, role },
    }, res);
    assert.equal(res.code, 201);
    assert.equal(res.body.status, role === 'admin' ? 'approved' : 'pending');
    assert.deepEqual(writes, role === 'admin' ? [{ $addToSet: { 'galleryPictures.ramps': url } }] : []);
    if (role === 'admin') assert.equal(res.body.approvedBy, userId);
  });
}

for (const handler of ['approve', 'upvote']) {
  for (const fail of [false, true]) {
    test(`${handler}: ${fail ? 'propaga el fallo y no confirma la transaccion' : 'aprueba y aplica todos los cambios en la misma transaccion'}`, async (t) => {
      const session = {};
      const id = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();
      const report = {
        _id: id,
        publicSquareId: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        status: 'pending',
        autoApprovedBy: [userId, new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
        autoRejectedBy: [],
        changes: {
          addRamp: { lat: -32, lon: -58 },
          modifyWC: { id: new mongoose.Types.ObjectId(), accessible: true },
          deleteHazard: { id: new mongoose.Types.ObjectId() },
          addPicture: { url: 'https://example.com/new.jpg' },
          deletePicture: { url: 'https://example.com/old.jpg' },
        },
      };
      const operations = [];
      let committed = false;
      let aborted = false;
      t.mock.method(mongoose.connection, 'transaction', async (callback) => {
        try {
          const result = await callback(session);
          committed = true;
          return result;
        } catch (err) {
          aborted = true;
          throw err;
        }
      });
      t.mock.method(Report, 'findById', async () => report);
      t.mock.method(Report, 'findOneAndUpdate', async (filter, update, options) => {
        if (!update.$set) return report; // El voto se guarda antes de intentar aprobar.
        assert.equal(options.session, session);
        operations.push('approve');
        return { ...report, status: 'approved' };
      });
      t.mock.method(Ramp, 'create', async (docs, options) => {
        assert.equal(options.session, session);
        assert.equal(docs[0].publicSquareId, report.publicSquareId);
        operations.push('addRamp');
      });
      t.mock.method(WC, 'findOneAndUpdate', async (filter, update, options) => {
        assert.equal(options.session, session);
        operations.push('modifyWC');
        if (fail) throw new Error('fallo de escritura');
        return { _id: report.changes.modifyWC.id };
      });
      t.mock.method(Hazard, 'deleteOne', async (filter, options) => {
        assert.equal(options.session, session);
        operations.push('deleteHazard');
        return { deletedCount: 1 };
      });
      t.mock.method(Square, 'findByIdAndUpdate', async (id, update, options) => {
        assert.equal(options.session, session);
        operations.push(update.$addToSet ? 'addPicture' : update.$pull ? 'deletePicture' : 'flags');
      });
      for (const model of [Ramp, WC, Hazard]) {
        t.mock.method(model, 'countDocuments', async (filter, options) => {
          assert.equal(options.session, session);
          return 1;
        });
      }
      const res = {
        code: 200,
        status(code) { this.code = code; return this; },
        json(body) { this.body = body; },
      };
      await controller[handler]({ body: { reportId: id.toString() }, user: { id: userId } }, res);
      assert.equal(res.code, fail ? 500 : 200);
      assert.equal(committed, !fail);
      assert.equal(aborted, fail);
      if (fail) {
        assert.equal(res.body.message, 'fallo de escritura');
        assert.deepEqual(operations, ['approve', 'addRamp', 'modifyWC']);
      } else {
        assert.equal(res.body.status, 'approved');
        assert.deepEqual(operations, ['approve', 'addRamp', 'modifyWC', 'deleteHazard', 'addPicture', 'deletePicture', 'flags']);
      }
    });
  }
}

for (const [campo, valor] of [
  ['lat', 91], ['lat', -91], ['lon', 181], ['lon', -181],
  ['lat', null], ['lon', '10'], ['lat', NaN], ['lon', Infinity],
]) {
  test(`create rechaza ${campo}=${valor} antes de guardar`, async (t) => {
    t.mock.method(Square, 'exists', async () => true);
    let saved = false;
    t.mock.method(Report, 'create', async (data) => { saved = true; return data; });
    const res = {
      code: 200,
      status(code) { this.code = code; return this; },
      json(body) { this.body = body; },
    };
    await controller.create({
      body: {
        publicSquareId: new mongoose.Types.ObjectId().toString(),
        changes: { modifyWC: { id: new mongoose.Types.ObjectId().toString(), [campo]: valor } },
      },
      user: { id: new mongoose.Types.ObjectId() },
    }, res);
    assert.equal(res.code, 400);
    assert.equal(saved, false);
    assert.match(res.body.message, new RegExp(campo));
  });
}

for (const changes of [
  { addRamp: { lat: 0, lon: 0 } },
  { addRamp: { lat: -90, lon: 180 } },
  { addRamp: { lat: 90, lon: -180 } },
  { modifyWC: { id: new mongoose.Types.ObjectId().toString(), accessible: true } },
]) {
  test(`create acepta cambios validos: ${JSON.stringify(changes)}`, async (t) => {
    t.mock.method(Square, 'exists', async () => true);
    t.mock.method(Report, 'create', async (data) => data);
    const res = {
      code: 200,
      status(code) { this.code = code; return this; },
      json(body) { this.body = body; },
    };
    await controller.create({
      body: { publicSquareId: new mongoose.Types.ObjectId().toString(), changes },
      user: { id: new mongoose.Types.ObjectId() },
    }, res);
    assert.equal(res.code, 201);
    assert.deepEqual(res.body.changes, changes);
  });
}

for (const action of ['modify', 'delete']) {
  test(`approve falla si ${action} no encuentra el elemento en la plaza`, async (t) => {
    const squareId = new mongoose.Types.ObjectId();
    const elementId = new mongoose.Types.ObjectId().toString();
    const report = {
      publicSquareId: squareId,
      changes: { [`${action}WC`]: { id: elementId, accessible: true } },
    };
    t.mock.method(mongoose.connection, 'transaction', async (callback) => callback({}));
    t.mock.method(Report, 'findOneAndUpdate', async () => report);
    t.mock.method(WC, action === 'modify' ? 'findOneAndUpdate' : 'deleteOne', async (filter) => {
      assert.deepEqual(filter, { _id: elementId, publicSquareId: squareId });
      return action === 'modify' ? null : { deletedCount: 0 };
    });
    t.mock.method(WC, 'countDocuments', async () => 0);
    t.mock.method(Square, 'findByIdAndUpdate', async () => ({}));
    const res = {
      code: 200,
      status(code) { this.code = code; return this; },
      json(body) { this.body = body; },
    };
    await controller.approve({
      body: { reportId: new mongoose.Types.ObjectId().toString() },
      user: { id: new mongoose.Types.ObjectId() },
    }, res);
    assert.equal(res.code, 500);
    assert.equal(res.body.message, 'El elemento no existe en esta plaza');
  });
}
