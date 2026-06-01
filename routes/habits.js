// routes/habits.js
const router = require('express').Router();
const { supabase } = require('../config/db');
const { proteger, soloAdmin } = require('../middleware/auth');

// GET catálogo de hábitos públicos
router.get('/', async (req, res) => {
  try {
    const { categoria, dificultad, q } = req.query;
    let query = supabase.from('habits').select('*').eq('activo', true).eq('publico', true);
    if (categoria) query = query.eq('categoria', categoria);
    if (dificultad) query = query.eq('dificultad', dificultad);
    if (q) query = query.ilike('nombre', `%${q}%`);
    query = query.order('categoria');
    const { data, error } = await query;
    if (error) throw error;
    res.json({ habitos: data });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener hábitos' });
  }
});

// GET hábitos del usuario (adoptados)
router.get('/mis-habitos', proteger, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_habits')
      .select('*, habits(*)')
      .eq('usuario_id', req.usuario.id)
      .eq('activo', true)
      .order('created_at');
    if (error) throw error;
    res.json({ habitos: data });
  } catch {
    res.status(500).json({ error: 'Error al obtener tus hábitos' });
  }
});

// POST adoptar un hábito
router.post('/adoptar/:habitoId', proteger, async (req, res) => {
  try {
    const { nota_personal, objetivo_dias } = req.body;
    const { data, error } = await supabase
      .from('user_habits')
      .insert({
        usuario_id: req.usuario.id,
        habito_id: req.params.habitoId,
        nota_personal, objetivo_dias: objetivo_dias || 21
      }).select('*, habits(*)').single();
    if (error) {
      if (error.code === '23505') return res.status(400).json({ error: 'Ya tienes este hábito' });
      throw error;
    }
    res.status(201).json({ userHabit: data, message: '✅ Hábito agregado a tu lista' });
  } catch (err) {
    res.status(500).json({ error: 'Error al adoptar hábito' });
  }
});

// DELETE abandonar hábito
router.delete('/mis-habitos/:habitoId', proteger, async (req, res) => {
  try {
    await supabase.from('user_habits')
      .update({ activo: false })
      .eq('usuario_id', req.usuario.id)
      .eq('habito_id', req.params.habitoId);
    res.json({ message: '✅ Hábito eliminado de tu lista' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar hábito' });
  }
});

// POST registrar completado del día
router.post('/log', proteger, async (req, res) => {
  try {
    const { habito_id, completado = true, duracion_min, nota, estado_animo } = req.body;
    const today = new Date().toISOString().split('T')[0];

    // Obtener puntos del hábito
    const { data: habit } = await supabase
      .from('habits').select('puntos').eq('id', habito_id).single();
    const puntos = completado ? (habit?.puntos || 10) : 0;

    const { data: log, error } = await supabase
      .from('habit_logs')
      .upsert({
        usuario_id: req.usuario.id, habito_id,
        fecha: today, completado, duracion_min, nota, estado_animo,
        puntos_ganados: puntos
      }, { onConflict: 'usuario_id,habito_id,fecha' })
      .select().single();

    if (error) throw error;

    // Actualizar puntos del usuario
    if (completado && puntos > 0) {
      const { data: user } = await supabase
        .from('users').select('puntos_totales').eq('id', req.usuario.id).single();
      await supabase.from('users')
        .update({ puntos_totales: (user.puntos_totales || 0) + puntos })
        .eq('id', req.usuario.id);
    }

    res.status(201).json({ log, message: completado ? `✅ +${puntos} puntos ganados!` : '📝 Registro actualizado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar hábito' });
  }
});

// GET logs del día actual
router.get('/logs/hoy', proteger, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('habit_logs')
      .select('*, habits(nombre, icono, categoria, color, puntos)')
      .eq('usuario_id', req.usuario.id)
      .eq('fecha', today);
    if (error) throw error;
    res.json({ logs: data || [] });
  } catch {
    res.status(500).json({ error: 'Error al obtener logs' });
  }
});

// GET logs de la semana
router.get('/logs/semana', proteger, async (req, res) => {
  try {
    const hace7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('habit_logs')
      .select('*, habits(nombre, icono, categoria, color)')
      .eq('usuario_id', req.usuario.id)
      .gte('fecha', hace7)
      .order('fecha', { ascending: false });
    if (error) throw error;
    res.json({ logs: data || [] });
  } catch {
    res.status(500).json({ error: 'Error al obtener logs' });
  }
});

// ADMIN: crear hábito
router.post('/', proteger, soloAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase.from('habits').insert({
      ...req.body, creado_por: req.usuario.id
    }).select().single();
    if (error) throw error;
    res.status(201).json({ habito: data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
