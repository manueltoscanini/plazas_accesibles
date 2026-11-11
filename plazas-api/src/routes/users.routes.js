const router = require('express').Router();
const c = require('../controllers/users.controller');
const auth = require('../middleware/auth');

// Por acá consultás si existe un correo, creás una cuenta o iniciás sesión.
router.post('/email', c.checkEmail);
router.post('/register', c.register);
router.post('/login', c.login);
// Para ver o editar tu perfil, primero miro quién sos a partir del token.
router.get('/me', auth, c.me);
router.patch('/me', auth, c.updateMe);
router.post('/me/password', auth, c.changePassword);

module.exports = router;
