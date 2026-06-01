// middleware/auth.js
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/db');

exports.proteger = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer '))
      return res.status(401).json({ error: 'No autorizado' });

    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { data: usuario } = await supabase
      .from('users').select('id, nombre, apellido, email, rol, activo')
      .eq('id', decoded.id).single();

    if (!usuario || !usuario.activo)
      return res.status(401).json({ error: 'Usuario no válido' });

    req.usuario = usuario;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

exports.soloAdmin = (req, res, next) => {
  if (req.usuario?.rol !== 'admin')
    return res.status(403).json({ error: 'Solo administradores' });
  next();
};
