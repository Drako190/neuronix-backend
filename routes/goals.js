// routes/goals.js
const router = require('express').Router();
const { supabase } = require('../config/db');
const { proteger } = require('../middleware/auth');

// GET mis metas
router.get('/', proteger, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('usuario_id', req.usuario.id)
      .order('prioridad', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ metas: data || [] });
  } catch {
    res.status(500).json({ error: 'Error al obtener metas' });
  }
});

// POST crear meta
router.post('/', proteger, async (req, res) => {
  try {
    const { titulo, descripcion, categoria, fecha_limite, prioridad, habitos_rel } = req.body;
    const { data, error } = await supabase
      .from('goals')
      .insert({ usuario_id: req.usuario.id, titulo, descripcion, categoria, fecha_limite, prioridad, habitos_rel })
      .select().single();
    if (error) throw error;
    res.status(201).json({ meta: data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT actualizar meta
router.put('/:id', proteger, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('goals')
      .update({ ...req.body, updated_at: new Date() })
      .eq('id', req.params.id)
      .eq('usuario_id', req.usuario.id)
      .select().single();
    if (error) throw error;
    res.json({ meta: data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE eliminar meta
router.delete('/:id', proteger, async (req, res) => {
  try {
    await supabase.from('goals')
      .delete()
      .eq('id', req.params.id)
      .eq('usuario_id', req.usuario.id);
    res.json({ message: '✅ Meta eliminada' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar meta' });
  }
});

module.exports = router;
