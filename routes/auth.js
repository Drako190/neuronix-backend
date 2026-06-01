// routes/auth.js
const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const authCtrl = require('../controllers/authController');
const { proteger } = require('../middleware/auth');

const validarRegistro = [
  body('nombre').trim().notEmpty().withMessage('Nombre requerido'),
  body('apellido').trim().notEmpty().withMessage('Apellido requerido'),
  body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Mínimo 8 caracteres'),
];
const validarLogin = [
  body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
  body('password').notEmpty().withMessage('Contraseña requerida'),
];
const handleVal = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
  next();
};

router.post('/register', validarRegistro, handleVal, authCtrl.register);
router.post('/login', validarLogin, handleVal, authCtrl.login);
router.post('/forgot-password', authCtrl.forgotPassword);
router.post('/reset-password/:token', authCtrl.resetPassword);
router.get('/me', proteger, authCtrl.getMe);
router.put('/update-password', proteger, authCtrl.updatePassword);

module.exports = router;
