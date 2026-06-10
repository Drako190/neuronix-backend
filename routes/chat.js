// routes/chat.js — Neuronix Chatbot (Groq)
const express = require('express');
const router  = express.Router();
const { proteger } = require('../middleware/auth');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `Eres NeuroBot, el asistente de estudio inteligente de Neuronix. Tu mision es ayudar a estudiantes a mejorar sus habitos de estudio, productividad y bienestar academico. Puedes ayudar con tecnicas de estudio (Pomodoro, Feynman, mapas mentales), habitos, motivacion, gestion del tiempo y bienestar. Responde siempre en espanol, se amigable y da consejos practicos. Maximo 3-4 parrafos. No respondas temas fuera del ambito educativo.`;

router.post('/', proteger, async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message || message.trim().length === 0)
      return res.status(400).json({ error: 'El mensaje no puede estar vacio' });
    if (message.length > 500)
      return res.status(400).json({ error: 'Mensaje demasiado largo (max. 500 caracteres)' });

    const recentHistory = history.slice(-10);
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...recentHistory.map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text })),
      { role: 'user', content: message.trim() },
    ];

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages, temperature: 0.7, max_tokens: 512 }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Groq API error:', err);
      return res.status(502).json({ error: 'Error al contactar el servicio de IA' });
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) return res.status(502).json({ error: 'No se recibio respuesta del asistente' });

    res.json({ reply });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
