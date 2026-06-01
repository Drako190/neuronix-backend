// config/db.js — Conexión a Supabase
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const connectDB = async () => {
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error) throw error;
    console.log('✅ Supabase conectado correctamente');
  } catch (err) {
    console.error('❌ Error conectando a Supabase:', err.message);
    process.exit(1);
  }
};

module.exports = { connectDB, supabase };
