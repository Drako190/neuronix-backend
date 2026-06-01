// routes/pomodoro.js
const router = require('express').Router();
const { supabase } = require('../config/db');
const { proteger } = require('../middleware/auth');

// POST guardar sesión pomodoro
router.post('/', proteger, async (req, res) => {
  try {
    const { duracion_min = 25, descanso_min = 5, ciclos = 1, completado = true, materia } = req.body;
    const { data, error } = await supabase
      .from('pomodoro_sessions')
      .insert({ usuario_id: req.usuario.id, duracion_min, descanso_min, ciclos, completado, materia })
      .select().single();
    if (error) throw error;

    // Sumar puntos si completado
    if (completado) {
      const puntos = ciclos * 5;
      const { data: user } = await supabase
        .from('users').select('puntos_totales').eq('id', req.usuario.id).single();
      await supabase.from('users')
        .update({ puntos_totales: (user.puntos_totales || 0) + puntos })
        .eq('id', req.usuario.id);
    }

    res.status(201).json({ sesion: data, message: '🍅 Pomodoro guardado!' });
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar sesión' });
  }
});

// GET estadísticas generales del usuario
router.get('/stats', proteger, async (req, res) => {
  try {
    const userId = req.usuario.id;
    const today = new Date().toISOString().split('T')[0];
    const hace7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const hace30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [userRes, logsHoyRes, logs7Res, logs30Res, pomosRes, metasRes] = await Promise.all([
      supabase.from('users').select('puntos_totales, racha_actual, racha_maxima, nivel, nombre').eq('id', userId).single(),
      supabase.from('habit_logs').select('*').eq('usuario_id', userId).eq('fecha', today).eq('completado', true),
      supabase.from('habit_logs').select('fecha, completado, puntos_ganados').eq('usuario_id', userId).gte('fecha', hace7),
      supabase.from('habit_logs').select('fecha, completado').eq('usuario_id', userId).gte('fecha', hace30).eq('completado', true),
      supabase.from('pomodoro_sessions').select('duracion_min, ciclos').eq('usuario_id', userId).gte('fecha', hace7).eq('completado', true),
      supabase.from('goals').select('completado').eq('usuario_id', userId),
    ]);

    const user = userRes.data;
    const logsHoy = logsHoyRes.data || [];
    const logs7 = logs7Res.data || [];
    const logs30 = logs30Res.data || [];
    const pomos = pomosRes.data || [];
    const metas = metasRes.data || [];

    // Calcular minutos de estudio pomodoro esta semana
    const minutosPomodoro = pomos.reduce((s, p) => s + p.duracion_min * p.ciclos, 0);

    // Hábitos completados por día esta semana
    const porDia = {};
    logs7.forEach(l => {
      if (!porDia[l.fecha]) porDia[l.fecha] = 0;
      if (l.completado) porDia[l.fecha]++;
    });

    res.json({
      usuario: user,
      hoy: { completados: logsHoy.length, puntosHoy: logsHoy.reduce((s, l) => s + l.puntos_ganados, 0) },
      semana: {
        completados: logs7.filter(l => l.completado).length,
        porDia,
        minutosPomodoro,
        sesionesPomodoro: pomos.length
      },
      mes: { completados: logs30.length },
      metas: { total: metas.length, completadas: metas.filter(m => m.completado).length }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

module.exports = router;
