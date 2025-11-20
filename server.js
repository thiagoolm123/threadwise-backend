// server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// Middleware
app.use(cors());
app.use(express.json());

// ✅ Public healthcheck
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'threadwise-backend',
    time: new Date().toISOString()
  });
});

// 🔐 Auth middleware for protected routes
function checkServiceKey(req, res, next) {
  const expected = process.env.THREADWISE_SERVICE_KEY;

  // If no key set, skip auth (dev mode)
  if (!expected) return next();

  const apiKey = req.headers['x-service-key'];

  if (apiKey && apiKey === expected) {
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized' });
}

// ✅ Main chat endpoint
app.post('/v1/chat', checkServiceKey, async (req, res) => {
  try {
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OPENAI_API_KEY not configured on server' });
    }

    const { messages, maxTokens, temperature } = req.body || {};

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages[] is required' });
    }

    const max_tokens = maxTokens || 300;
    const temp = typeof temperature === 'number' ? temperature : 0.7;

    const openaiResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages,
        temperature: temp,
        max_tokens
      })
    });

    const data = await openaiResp.json();

    if (!openaiResp.ok) {
      console.error('OpenAI error:', data);
      return res.status(500).json({ error: data.error?.message || 'OpenAI error' });
    }

    const reply = data.choices?.[0]?.message?.content || '';

    return res.json({
      ok: true,
      reply
    });
  } catch (err) {
    console.error('Error in /v1/chat:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Threadwise Backend API server running on port ${PORT}`);
});
