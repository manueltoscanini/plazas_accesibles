const router = require('express').Router();
const c = require('../controllers/users.controller');
const auth = require('../middleware/auth');

router.post('/email', c.checkEmail);
router.post('/register', c.register);
router.post('/login', c.login);
router.get('/me', auth, c.me);
router.patch('/me', auth, c.updateMe);
router.post('/me/password', auth, c.changePassword);

module.exports = router;
