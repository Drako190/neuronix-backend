// routes/notes.js
const router = require('express').Router();
const { supabase } = require('../config/db');
const { proteger } = require('../middleware/auth');

// GET mis notas
router.get('/', proteger, async (req, res) => {
  try {
    const { q, materia } = req.query;
    let query = supabase.from('notes').select('*').eq('usuario_id', req.usuario.id);
    if (materia) query = query.eq('materia', materia);
    if (q) query = query.or(`titulo.ilike.%${q}%,contenido.ilike.%${q}%`);
    query = query.order('fijada', { ascending: false }).order('updated_at', { ascending: false });
    const { data, error } = await query;
    if (error) throw error;
    res.json({ notas: data || [] });
  } catch {
    res.status(500).json({ error: 'Error al obtener notas' });
  }
});

// POST crear nota
router.post('/', proteger, async (req, res) => {
  try {
    const { titulo, contenido, materia, etiquetas, color, fijada } = req.body;
    const { data, error } = await supabase
      .from('notes')
      .insert({ usuario_id: req.usuario.id, titulo, contenido, materia, etiquetas, color, fijada })
      .select().single();
    if (error) throw error;
    res.status(201).json({ nota: data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT actualizar nota
router.put('/:id', proteger, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notes')
      .update({ ...req.body, updated_at: new Date() })
      .eq('id', req.params.id)
      .eq('usuario_id', req.usuario.id)
      .select().single();
    if (error) throw error;
    res.json({ nota: data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE eliminar nota
router.delete('/:id', proteger, async (req, res) => {
  try {
    await supabase.from('notes')
      .delete().eq('id', req.params.id).eq('usuario_id', req.usuario.id);
    res.json({ message: '✅ Nota eliminada' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar nota' });
  }
});

module.exports = router;
