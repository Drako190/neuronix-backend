// routes/chat.js — Neuronix Chatbot (Gemini 2.0 Flash)
const express = require('express');
const router  = express.Router();
const { proteger } = require('../middleware/auth');

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

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

    // Construir historial en formato Gemini
    // Limitar a los últimos 10 mensajes para no gastar tokens
    const recentHistory = history.slice(-10);
    const contents = [
      // Inyectar el system prompt como primer turno de usuario/modelo
      { role: 'user',  parts: [{ text: SYSTEM_PROMPT }] },
      { role: 'model', parts: [{ text: '¡Entendido! Soy NeuroBot y estoy listo para ayudarte con tus hábitos de estudio. ¿En qué puedo ayudarte hoy?' }] },
      // Historial previo
      ...recentHistory.map(m => ({
        role: m.role === 'bot' ? 'model' : 'user',
        parts: [{ text: m.text }],
      })),
      // Mensaje actual
      { role: 'user', parts: [{ text: message.trim() }] },
    ];

    const response = await fetch(`${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 512,
          topP: 0.9,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Gemini API error:', err);
      return res.status(502).json({ error: 'Error al contactar el servicio de IA' });
    }

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

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
