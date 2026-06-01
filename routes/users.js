// routes/users.js
const router = require('express').Router();
const { supabase } = require('../config/db');
const { proteger, soloAdmin } = require('../middleware/auth');

// GET mi perfil completo
router.get('/perfil', proteger, async (req, res) => {
  try {
    const userId = req.usuario.id;
    const [userRes, logrosRes] = await Promise.all([
      supabase.from('users')
        .select('id, nombre, apellido, email, rol, puntos_totales, racha_actual, racha_maxima, nivel, avatar, created_at')
        .eq('id', userId).single(),
      supabase.from('user_achievements')
        .select('*, achievements(*)')
        .eq('usuario_id', userId)
        .order('fecha', { ascending: false })
    ]);
    res.json({ usuario: userRes.data, logros: logrosRes.data || [] });
  } catch {
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

// PUT actualizar perfil
router.put('/perfil', proteger, async (req, res) => {
  try {
    const { nombre, apellido, avatar } = req.body;
    const { data, error } = await supabase
      .from('users')
      .update({ nombre, apellido, avatar, updated_at: new Date() })
      .eq('id', req.usuario.id)
      .select('id, nombre, apellido, email, rol, puntos_totales, racha_actual, nivel, avatar')
      .single();
    if (error) throw error;
    res.json({ usuario: data, message: '✅ Perfil actualizado' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET leaderboard (top 10)
router.get('/leaderboard', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, nombre, apellido, puntos_totales, racha_actual, nivel, avatar')
      .eq('activo', true)
      .order('puntos_totales', { ascending: false })
      .limit(10);
    if (error) throw error;
    res.json({ ranking: data || [] });
  } catch {
    res.status(500).json({ error: 'Error al obtener ranking' });
  }
});

// GET logros disponibles
router.get('/logros', async (req, res) => {
  try {
    const { data, error } = await supabase.from('achievements').select('*');
    if (error) throw error;
    res.json({ logros: data || [] });
  } catch {
    res.status(500).json({ error: 'Error al obtener logros' });
  }
});

// ADMIN: todos los usuarios
router.get('/', proteger, soloAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, nombre, apellido, email, rol, puntos_totales, racha_actual, activo, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ usuarios: data || [] });
  } catch {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

module.exports = router;
