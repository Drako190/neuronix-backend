// routes/chat.js — Neuronix Chatbot (Groq - llama-3.3-70b)
const express = require('express');
const router  = express.Router();
const { proteger } = require('../middleware/auth');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `Eres NeuroBot, el asistente de estudio inteligente de Neuronix.
Tu misión es ayudar a estudiantes a mejorar sus hábitos de estudio, productividad y bienestar académico.

Puedes ayudar con:
- Técnicas de estudio (Pomodoro, Feynman, mapas mentales, etc.)
- Consejos para construir y mantener hábitos de estudio
- Motivación y manejo del estrés académico
- Gestión del tiempo y organización
- Estrategias para recordar y retener información
- Consejos de bienestar (sueño, ejercicio, alimentación para estudiar mejor)

Reglas:
- Responde siempre en español
- Sé amigable, motivador y concreto
- Da consejos prácticos y accionables, no solo teoría
- Respuestas cortas y claras (máximo 3-4 párrafos)
- Si el usuario comparte su contexto (hábitos, metas, rachas), úsalo para personalizar tu respuesta
- No respondas temas fuera del ámbito educativo/hábitos/productividad`;

// POST /api/chat
router.post('/', proteger, async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
    }

    if (message.length > 500) {
      return res.status(400).json({ error: 'Mensaje demasiado largo (máx. 500 caracteres)' });
    }

    // Construir historial en formato OpenAI (compatible con Groq)
    const recentHistory = history.slice(-10);
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...recentHistory.map(m => ({
        role: m.role === 'bot' ? 'assistant' : 'user',
        content: m.text,
      })),
      { role: 'user', content: message.trim() },
    ];

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.7,
        max_tokens: 512,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Groq API error:', err);
      return res.status(502).json({ error: 'Error al contactar el servicio de IA' });
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(502).json({ error: 'No se recibió respuesta del asistente' });
    }

    res.json({ reply });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;