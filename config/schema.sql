-- ╔══════════════════════════════════════════════════════╗
-- ║         NEURONIX — Schema de Supabase               ║
-- ║   Ejecuta este SQL en el SQL Editor de Supabase     ║
-- ╚══════════════════════════════════════════════════════╝

-- ── EXTENSIONES ──────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── USUARIOS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre            TEXT NOT NULL,
  apellido          TEXT NOT NULL,
  email             TEXT UNIQUE NOT NULL,
  password          TEXT NOT NULL,
  avatar            TEXT,
  rol               TEXT DEFAULT 'estudiante' CHECK (rol IN ('estudiante','admin')),
  nivel             TEXT DEFAULT 'principiante' CHECK (nivel IN ('principiante','intermedio','avanzado','maestro')),
  puntos_totales    INT DEFAULT 0,
  racha_actual      INT DEFAULT 0,
  racha_maxima      INT DEFAULT 0,
  activo            BOOLEAN DEFAULT true,
  reset_token       TEXT,
  reset_expires     TIMESTAMPTZ,
  intentos_fallidos INT DEFAULT 0,
  bloqueado_hasta   TIMESTAMPTZ,
  ultimo_login      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── HÁBITOS (plantillas/catálogo) ────────────────────
CREATE TABLE IF NOT EXISTS habits (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre        TEXT NOT NULL,
  descripcion   TEXT,
  categoria     TEXT NOT NULL CHECK (categoria IN ('estudio','salud','mindfulness','productividad','lectura','ejercicio','alimentacion','sueno','social','otro')),
  icono         TEXT DEFAULT '📚',
  color         TEXT DEFAULT '#6C63FF',
  frecuencia    TEXT DEFAULT 'diario' CHECK (frecuencia IN ('diario','semanal','personalizado')),
  dias_semana   JSONB,          -- [1,2,3,4,5] = Lun-Vie
  duracion_min  INT DEFAULT 30,
  puntos        INT DEFAULT 10,
  dificultad    TEXT DEFAULT 'media' CHECK (dificultad IN ('facil','media','dificil')),
  publico       BOOLEAN DEFAULT true,
  creado_por    UUID REFERENCES users(id),
  activo        BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── HÁBITOS DEL USUARIO (adopción) ───────────────────
CREATE TABLE IF NOT EXISTS user_habits (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  habito_id       UUID REFERENCES habits(id) ON DELETE CASCADE,
  activo          BOOLEAN DEFAULT true,
  fecha_inicio    DATE DEFAULT CURRENT_DATE,
  objetivo_dias   INT DEFAULT 21,
  nota_personal   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id, habito_id)
);

-- ── REGISTROS DIARIOS ────────────────────────────────
CREATE TABLE IF NOT EXISTS habit_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  habito_id     UUID REFERENCES habits(id) ON DELETE CASCADE,
  fecha         DATE NOT NULL DEFAULT CURRENT_DATE,
  completado    BOOLEAN DEFAULT false,
  duracion_min  INT,
  nota          TEXT,
  estado_animo  TEXT CHECK (estado_animo IN ('malo','regular','bien','excelente')),
  puntos_ganados INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id, habito_id, fecha)
);

-- ── METAS / OBJETIVOS ────────────────────────────────
CREATE TABLE IF NOT EXISTS goals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  titulo          TEXT NOT NULL,
  descripcion     TEXT,
  categoria       TEXT,
  fecha_limite    DATE,
  progreso        INT DEFAULT 0 CHECK (progreso >= 0 AND progreso <= 100),
  completado      BOOLEAN DEFAULT false,
  prioridad       TEXT DEFAULT 'media' CHECK (prioridad IN ('baja','media','alta')),
  habitos_rel     JSONB,    -- array de habito IDs relacionados
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── NOTAS DE ESTUDIO ─────────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  titulo      TEXT NOT NULL,
  contenido   TEXT,
  materia     TEXT,
  etiquetas   JSONB,       -- ["examen","urgente","repaso"]
  color       TEXT DEFAULT '#1a1a2e',
  fijada      BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── SESIONES POMODORO ────────────────────────────────
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  duracion_min    INT DEFAULT 25,
  descanso_min    INT DEFAULT 5,
  ciclos          INT DEFAULT 1,
  completado      BOOLEAN DEFAULT false,
  materia         TEXT,
  fecha           TIMESTAMPTZ DEFAULT NOW()
);

-- ── LOGROS / BADGES ──────────────────────────────────
CREATE TABLE IF NOT EXISTS achievements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre      TEXT NOT NULL,
  descripcion TEXT,
  icono       TEXT DEFAULT '🏆',
  puntos      INT DEFAULT 50,
  tipo        TEXT CHECK (tipo IN ('racha','habitos','puntos','pomodoro','meta','especial')),
  condicion   JSONB  -- {"tipo":"racha","valor":7}
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id  UUID REFERENCES achievements(id),
  fecha           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id, achievement_id)
);

-- ── ESTADÍSTICAS SEMANALES (vista materializada) ─────
CREATE TABLE IF NOT EXISTS weekly_stats (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  semana_inicio   DATE NOT NULL,
  habitos_total   INT DEFAULT 0,
  habitos_compl   INT DEFAULT 0,
  pomodoros       INT DEFAULT 0,
  minutos_estudio INT DEFAULT 0,
  puntos_ganados  INT DEFAULT 0,
  racha_maxima    INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id, semana_inicio)
);

-- ── ROW LEVEL SECURITY ───────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_stats ENABLE ROW LEVEL SECURITY;

-- Hábitos públicos visibles para todos
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "habits_select" ON habits FOR SELECT USING (publico = true OR creado_por = auth.uid());
