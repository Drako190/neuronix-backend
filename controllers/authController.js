// controllers/authController.js
const { supabase } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const generarToken = (id, rol) =>
  jwt.sign({ id, rol }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// REGISTRAR
exports.register = async (req, res) => {
  try {
    const { nombre, apellido, email, password } = req.body;

    const { data: existe } = await supabase
      .from('users').select('id').eq('email', email).single();
    if (existe) return res.status(400).json({ error: 'Este email ya está registrado' });

    const hash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);

    const { data: usuario, error } = await supabase
      .from('users')
      .insert({ nombre, apellido, email, password: hash })
      .select('id, nombre, apellido, email, rol, puntos_totales, racha_actual, nivel')
      .single();

    if (error) throw error;

    const token = generarToken(usuario.id, usuario.rol);
    res.status(201).json({ message: '✅ Cuenta creada', token, usuario });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear la cuenta' });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: usuario } = await supabase
      .from('users').select('*').eq('email', email).eq('activo', true).single();

    if (!usuario) return res.status(401).json({ error: 'Email o contraseña incorrectos' });

    if (usuario.bloqueado_hasta && new Date(usuario.bloqueado_hasta) > new Date()) {
      const min = Math.ceil((new Date(usuario.bloqueado_hasta) - new Date()) / 60000);
      return res.status(423).json({ error: `Cuenta bloqueada. Intenta en ${min} minutos` });
    }

    const correcto = await bcrypt.compare(password, usuario.password);
    if (!correcto) {
      const intentos = usuario.intentos_fallidos + 1;
      const update = intentos >= 5
        ? { intentos_fallidos: 0, bloqueado_hasta: new Date(Date.now() + 15 * 60000) }
        : { intentos_fallidos: intentos };
      await supabase.from('users').update(update).eq('id', usuario.id);
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

    await supabase.from('users').update({
      intentos_fallidos: 0, bloqueado_hasta: null, ultimo_login: new Date()
    }).eq('id', usuario.id);

    const token = generarToken(usuario.id, usuario.rol);
    res.json({
      message: `✅ Bienvenido, ${usuario.nombre}!`, token,
      usuario: {
        id: usuario.id, nombre: usuario.nombre, apellido: usuario.apellido,
        email: usuario.email, rol: usuario.rol, puntos_totales: usuario.puntos_totales,
        racha_actual: usuario.racha_actual, nivel: usuario.nivel, avatar: usuario.avatar
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

// GET ME
exports.getMe = async (req, res) => {
  try {
    const { data: usuario } = await supabase
      .from('users')
      .select('id, nombre, apellido, email, rol, puntos_totales, racha_actual, racha_maxima, nivel, avatar, created_at')
      .eq('id', req.usuario.id).single();
    res.json({ usuario });
  } catch {
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
};

// FORGOT PASSWORD
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const { data: usuario } = await supabase
      .from('users').select('id, nombre').eq('email', email).single();

    if (!usuario) return res.json({ message: 'Si el email existe, recibirás un correo' });

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await supabase.from('users').update({
      reset_token: token, reset_expires: expires
    }).eq('id', usuario.id);

    const transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST, port: parseInt(process.env.EMAIL_PORT),
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    const resetUrl = `${process.env.FRONTEND_URL}/pages/reset-password.html?token=${token}`;
    await transporter.sendMail({
      from: process.env.EMAIL_FROM, to: email,
      subject: '🧠 Neuronix — Recupera tu contraseña',
      html: `<h2>Hola ${usuario.nombre}</h2><p>Haz clic para restablecer tu contraseña (válido 1 hora):</p><a href="${resetUrl}">${resetUrl}</a>`
    });

    res.json({ message: 'Si el email existe, recibirás un correo' });
  } catch (err) {
    res.status(500).json({ error: 'Error al enviar correo' });
  }
};

// RESET PASSWORD
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const { data: usuario } = await supabase
      .from('users').select('id')
      .eq('reset_token', token)
      .gt('reset_expires', new Date().toISOString())
      .single();

    if (!usuario) return res.status(400).json({ error: 'Token inválido o expirado' });

    const hash = await bcrypt.hash(password, 12);
    await supabase.from('users').update({
      password: hash, reset_token: null, reset_expires: null
    }).eq('id', usuario.id);

    res.json({ message: '✅ Contraseña actualizada' });
  } catch {
    res.status(500).json({ error: 'Error al restablecer contraseña' });
  }
};

// UPDATE PASSWORD
exports.updatePassword = async (req, res) => {
  try {
    const { passwordActual, passwordNuevo } = req.body;
    const { data: usuario } = await supabase
      .from('users').select('password').eq('id', req.usuario.id).single();

    const correcto = await bcrypt.compare(passwordActual, usuario.password);
    if (!correcto) return res.status(400).json({ error: 'Contraseña actual incorrecta' });

    const hash = await bcrypt.hash(passwordNuevo, 12);
    await supabase.from('users').update({ password: hash }).eq('id', req.usuario.id);

    res.json({ message: '✅ Contraseña actualizada' });
  } catch {
    res.status(500).json({ error: 'Error al actualizar contraseña' });
  }
};
