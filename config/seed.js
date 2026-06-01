// config/seed.js — Neuronix
require('dotenv').config({ path: './.env' });
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const habitos = [
  {
    nombre: 'Repaso de 25 min (Pomodoro)',
    descripcion: 'Sesión de estudio enfocada usando la técnica Pomodoro.',
    categoria: 'estudio', icono: '🍅', color: '#FF6B6B',
    frecuencia: 'diario', duracion_min: 25, puntos: 15, dificultad: 'facil', publico: true
  },
  {
    nombre: 'Leer 20 páginas',
    descripcion: 'Lee al menos 20 páginas de cualquier libro académico o de desarrollo personal.',
    categoria: 'lectura', icono: '📖', color: '#4ECDC4',
    frecuencia: 'diario', duracion_min: 30, puntos: 20, dificultad: 'media', publico: true
  },
  {
    nombre: 'Repasar apuntes del día',
    descripcion: 'Revisa y organiza los apuntes tomados durante el día.',
    categoria: 'estudio', icono: '📝', color: '#6C63FF',
    frecuencia: 'diario', duracion_min: 15, puntos: 10, dificultad: 'facil', publico: true
  },
  {
    nombre: 'Meditación de 10 min',
    descripcion: 'Práctica de mindfulness para reducir estrés antes de estudiar.',
    categoria: 'mindfulness', icono: '🧘', color: '#A29BFE',
    frecuencia: 'diario', duracion_min: 10, puntos: 10, dificultad: 'facil', publico: true
  },
  {
    nombre: 'Ejercicio físico',
    descripcion: 'Al menos 30 minutos de actividad física para mejorar la concentración.',
    categoria: 'ejercicio', icono: '🏃', color: '#00B894',
    frecuencia: 'diario', duracion_min: 30, puntos: 20, dificultad: 'media', publico: true
  },
  {
    nombre: 'Plan del día',
    descripcion: 'Escribe tus 3 tareas más importantes del día antes de empezar.',
    categoria: 'productividad', icono: '🎯', color: '#FDCB6E',
    frecuencia: 'diario', duracion_min: 10, puntos: 10, dificultad: 'facil', publico: true
  },
  {
    nombre: 'Sin redes sociales (1 hora)',
    descripcion: 'Bloquea distracciones durante al menos 1 hora de estudio.',
    categoria: 'productividad', icono: '📵', color: '#E17055',
    frecuencia: 'diario', duracion_min: 60, puntos: 25, dificultad: 'dificil', publico: true
  },
  {
    nombre: 'Dormir 7-8 horas',
    descripcion: 'Mantén un horario de sueño consistente para mejorar la memoria.',
    categoria: 'sueno', icono: '😴', color: '#74B9FF',
    frecuencia: 'diario', duracion_min: 480, puntos: 15, dificultad: 'media', publico: true
  },
  {
    nombre: 'Hidratación 2L',
    descripcion: 'Toma al menos 2 litros de agua durante el día.',
    categoria: 'salud', icono: '💧', color: '#0984E3',
    frecuencia: 'diario', duracion_min: 5, puntos: 10, dificultad: 'facil', publico: true
  },
  {
    nombre: 'Práctica de idioma',
    descripcion: 'Dedica 15 minutos a practicar un idioma extranjero.',
    categoria: 'estudio', icono: '🌍', color: '#6C63FF',
    frecuencia: 'diario', duracion_min: 15, puntos: 15, dificultad: 'media', publico: true
  },
  {
    nombre: 'Resolver ejercicios',
    descripcion: 'Practica con ejercicios de la materia más difícil del día.',
    categoria: 'estudio', icono: '🧮', color: '#FD79A8',
    frecuencia: 'diario', duracion_min: 30, puntos: 20, dificultad: 'media', publico: true
  },
  {
    nombre: 'Gratitud y reflexión',
    descripcion: 'Escribe 3 cosas por las que estás agradecido hoy.',
    categoria: 'mindfulness', icono: '🌟', color: '#FFEAA7',
    frecuencia: 'diario', duracion_min: 5, puntos: 5, dificultad: 'facil', publico: true
  },
  {
    nombre: 'Clase/Tutoría online',
    descripcion: 'Completa una lección o video en plataformas como Coursera, YouTube académico.',
    categoria: 'estudio', icono: '🎓', color: '#6C63FF',
    frecuencia: 'semanal', dias_semana: [1,2,3,4,5], duracion_min: 60, puntos: 30, dificultad: 'media', publico: true
  },
  {
    nombre: 'Revisión semanal',
    descripcion: 'Evalúa tu semana: qué funcionó, qué mejorar.',
    categoria: 'productividad', icono: '📊', color: '#A29BFE',
    frecuencia: 'semanal', dias_semana: [0], duracion_min: 20, puntos: 25, dificultad: 'media', publico: true
  },
];

const logros = [
  { nombre: 'Primer Paso', descripcion: 'Completa tu primer hábito', icono: '👣', puntos: 10, tipo: 'habitos', condicion: { tipo: 'total_completados', valor: 1 } },
  { nombre: 'Racha de 3 días', descripcion: 'Mantén una racha de 3 días', icono: '🔥', puntos: 25, tipo: 'racha', condicion: { tipo: 'racha', valor: 3 } },
  { nombre: 'Semana Perfecta', descripcion: 'Completa todos tus hábitos 7 días seguidos', icono: '⭐', puntos: 100, tipo: 'racha', condicion: { tipo: 'racha', valor: 7 } },
  { nombre: 'Madrugador', descripcion: 'Registra un hábito antes de las 8am', icono: '🌅', puntos: 20, tipo: 'especial', condicion: { tipo: 'hora', valor: 8 } },
  { nombre: 'Maestro Pomodoro', descripcion: 'Completa 50 sesiones Pomodoro', icono: '🍅', puntos: 150, tipo: 'pomodoro', condicion: { tipo: 'pomodoros', valor: 50 } },
  { nombre: '100 puntos', descripcion: 'Acumula 100 puntos', icono: '💯', puntos: 50, tipo: 'puntos', condicion: { tipo: 'puntos', valor: 100 } },
  { nombre: '500 puntos', descripcion: 'Acumula 500 puntos', icono: '🏅', puntos: 100, tipo: 'puntos', condicion: { tipo: 'puntos', valor: 500 } },
  { nombre: 'Meta Cumplida', descripcion: 'Completa tu primera meta', icono: '🎯', puntos: 75, tipo: 'meta', condicion: { tipo: 'metas', valor: 1 } },
  { nombre: 'Lector Ávido', descripcion: 'Completa el hábito de lectura 30 veces', icono: '📚', puntos: 80, tipo: 'habitos', condicion: { tipo: 'categoria', valor: 'lectura', cantidad: 30 } },
  { nombre: 'Mes de Fuego', descripcion: 'Mantén una racha de 30 días', icono: '🔥', puntos: 500, tipo: 'racha', condicion: { tipo: 'racha', valor: 30 } },
];

async function seed() {
  console.log('\n🌱 Iniciando seed de Neuronix...\n');

  // Insertar hábitos
  const { data: habitosCreados, error: errHabitos } = await supabase
    .from('habits').insert(habitos).select();
  if (errHabitos) {
    console.error('❌ Error en hábitos:', errHabitos.message);
  } else {
    console.log(`✅ ${habitosCreados.length} hábitos creados`);
  }

  // Insertar logros
  const { data: logrosCreados, error: errLogros } = await supabase
    .from('achievements').insert(logros).select();
  if (errLogros) {
    console.error('❌ Error en logros:', errLogros.message);
  } else {
    console.log(`✅ ${logrosCreados.length} logros creados`);
  }

  // Crear usuario admin demo
  const hash = await bcrypt.hash('Admin1234!', 12);
  const { error: errAdmin } = await supabase.from('users').insert({
    nombre: 'Admin', apellido: 'Neuronix',
    email: 'admin@neuronix.app', password: hash, rol: 'admin'
  });
  if (errAdmin) {
    console.log('ℹ️  Admin ya existe o error:', errAdmin.message);
  } else {
    console.log('✅ Usuario admin creado (admin@neuronix.app / Admin1234!)');
  }

  console.log('\n🎉 Seed completado!\n');
  process.exit(0);
}

seed().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
