const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const User = require('../src/models/User');
const auth = require('../src/middleware/auth');

// Pruebo qué pasa si la cuenta está habilitada, si ya no existe o si el token quedó viejo.
for (const [caso, user, expected] of [
  ['cuenta habilitada', { enabled: true, role: 'user' }, 200],
  ['cuenta deshabilitada', { enabled: false }, 401],
  ['cuenta eliminada', null, 401],
  ['sesión anterior a un cambio de contraseña', { enabled: true, sessionVersion: 1 }, 401],
  ['fallo de MongoDB', new Error('sin conexion'), 500],
]) {
  test(`auth: ${caso}`, async (t) => {
    const previous = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'secreto-solo-para-pruebas';
    t.after(() => {
      if (previous === undefined) delete process.env.JWT_SECRET;
      else process.env.JWT_SECRET = previous;
    });
    const id = '507f1f77bcf86cd799439011';
    const token = jwt.sign({ id, role: 'admin' }, process.env.JWT_SECRET);
    t.mock.method(User, 'findById', (requestedId) => {
      assert.equal(requestedId, id);
      return { select: async () => {
        if (user instanceof Error) throw user;
        return user;
      } };
    });
    let continued = false;
    const res = {
      code: 200,
      status(code) { this.code = code; return this; },
      json(body) { this.body = body; },
    };
    const req = { headers: { authorization: `Bearer ${token}` } };
    await auth(req, res, () => { continued = true; });
    assert.equal(res.code, expected);
    assert.equal(continued, expected === 200);
    if (continued) assert.equal(req.user.role, user.role);
  });
}

for (const authorization of ['', 'Bearer token-invalido']) {
  test(`auth rechaza ${authorization ? 'token invalido' : 'peticion sin token'} antes de consultar MongoDB`, async (t) => {
    let queried = false;
    t.mock.method(User, 'findById', () => { queried = true; });
    const res = {
      code: 200,
      status(code) { this.code = code; return this; },
      json(body) { this.body = body; },
    };
    await auth({ headers: { authorization } }, res, () => assert.fail('No debe continuar'));
    assert.equal(res.code, 401);
    assert.equal(queried, false);
  });
}
