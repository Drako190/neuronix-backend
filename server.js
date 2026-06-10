require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');
const rateLimit = require('express-rate-limit');

const { connectDB } = require('./config/db');

// ── Rutas ──────────────────────────────────────
const authRoutes    = require('./routes/auth');
const habitRoutes   = require('./routes/habits');
const goalRoutes    = require('./routes/goals');
const noteRoutes    = require('./routes/notes');
const pomodoroRoutes = require('./routes/pomodoro');
const userRoutes    = require('./routes/users');
const chatRoutes   = require('./routes/chat');

// ── Conectar Supabase ──────────────────────────
connectDB();

const app = express();
app.set('trust proxy', 1);

// ── Seguridad ──────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// ── CORS ───────────────────────────────────────
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

// ── Body Parser ────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Logger ─────────────────────────────────────
app.use(morgan('dev'));

// ── Rate Limiting ──────────────────────────────
const generalLimit = rateLimit({
  windowMs: 15 * 60 * 1000, max: 200,
  message: { error: 'Demasiadas peticiones' },
  validate: { xForwardedForHeader: false },
});
const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  message: { error: 'Demasiados intentos' },
  validate: { xForwardedForHeader: false },
});
const chatLimit = rateLimit({
  windowMs: 60 * 1000, max: 20,
  message: { error: 'Demasiados mensajes, espera un momento' },
  validate: { xForwardedForHeader: false },
});

app.use('/api/', generalLimit);
app.use('/api/auth/login', authLimit);
app.use('/api/auth/register', authLimit);
app.use('/api/auth/forgot-password', authLimit);
app.use('/api/chat', chatLimit);

// ── Rutas API ──────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/habits',    habitRoutes);
app.use('/api/goals',     goalRoutes);
app.use('/api/notes',     noteRoutes);
app.use('/api/pomodoro',  pomodoroRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/chat',      chatRoutes);

// ── Health check ───────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: '🧠 Neuronix API funcionando',
    timestamp: new Date().toISOString(),
  });
});

// ── 404 ────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ error: `Ruta ${req.originalUrl} no encontrada` });
});

// ── Errores globales ───────────────────────────
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.statusCode || 500).json({ error: err.message || 'Error interno' });
});

// ── Iniciar ────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════╗');
  console.log(`║  🧠 Neuronix API corriendo            ║`);
  console.log(`║  📡 Puerto: ${PORT}                       ║`);
  console.log(`║  🌍 Entorno: ${process.env.NODE_ENV || 'development'}           ║`);
  console.log('╚══════════════════════════════════════╝\n');
});

module.exports = app;