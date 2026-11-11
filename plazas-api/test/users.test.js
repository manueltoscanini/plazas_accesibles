const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../src/models/User');
const controller = require('../src/controllers/users.controller');

const id = '507f1f77bcf86cd799439011';
const currentPassword = 'anterior-123';

// Uso una cuenta de prueba para revisar el perfil y el cambio de contraseña.
async function fixture(t) {
  const user = {
    _id: id, firstName: 'Ana', lastName: 'Pérez', email: 'ana@example.com',
    enabled: true, role: 'user', password: await bcrypt.hash(currentPassword, 4),
  };
  t.mock.method(User, 'findById', () => ({ select: async () => user }));
  const res = {
    code: 200,
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; },
  };
  return { user, res };
}

test('el perfil propio devuelve datos de contacto sin el hash de contraseña', async (t) => {
  const { res } = await fixture(t);
  await controller.me({ user: { id } }, res);
  assert.deepEqual(res.body, { firstName: 'Ana', lastName: 'Pérez', email: 'ana@example.com', phone: '', role: 'user' });
});

test('actualiza el teléfono sin aceptar cambios de rol o de cuenta', async (t) => {
  const { user, res } = await fixture(t);
  t.mock.method(User, 'findOneAndUpdate', async (filter, update) => {
    assert.equal(filter._id, id);
    assert.deepEqual(update.$set, { phone: '+598 99 123 456' });
    return { ...user, ...update.$set };
  });
  await controller.updateMe({ user: { id }, body: { phone: '+598 99 123 456', role: 'admin', _id: 'otra-cuenta' } }, res);
  assert.equal(res.body.phone, '+598 99 123 456');
  assert.equal(res.body.role, 'user');
});

test('cambiar el correo exige contraseña y reporta un correo duplicado', async (t) => {
  const { user, res } = await fixture(t);
  let writes = 0;
  t.mock.method(User, 'findOneAndUpdate', async (filter, update) => {
    writes++;
    assert.equal(filter.password, user.password);
    assert.equal(update.$set.email, 'nuevo@example.com');
    throw Object.assign(new Error('duplicado'), { code: 11000 });
  });
  const req = { user: { id }, body: { email: 'Nuevo@Example.com' } };
  await controller.updateMe(req, res);
  assert.equal(res.code, 403);
  assert.equal(writes, 0);
  await controller.updateMe({ ...req, body: { ...req.body, currentPassword } }, res);
  assert.equal(res.code, 409);
  assert.equal(writes, 1);
});

test('cambia la contraseña e invalida los tokens anteriores', async (t) => {
  const { user, res } = await fixture(t);
  const previous = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'secreto-de-prueba';
  t.after(() => {
    if (previous === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previous;
  });
  const newPassword = 'nueva-clave-123';
  t.mock.method(User, 'findOneAndUpdate', async (filter, update) => {
    assert.equal(filter._id, id);
    assert.equal(filter.password, user.password);
    assert.equal(await bcrypt.compare(newPassword, update.$set.password), true);
    assert.deepEqual(update.$inc, { sessionVersion: 1 });
    return { ...user, sessionVersion: 1 };
  });
  await controller.changePassword({ user: { id }, body: { currentPassword, newPassword } }, res);
  assert.equal(jwt.verify(res.body.token, process.env.JWT_SECRET).sessionVersion, 1);
  assert.equal(res.body.password, undefined);
});
