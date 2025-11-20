// server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ✅ Public healthcheck route
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'threadwise-backend',
    time: new Date().toISOString()
  });
});

// 🔐 Auth middleware – used ONLY on protected routes
function checkServiceKey(req, res, next) {
  const expected = process.env.THREADWISE_SERVICE_KEY;

  // If no key is set in env, skip auth (dev mode)
  if (!expected) return next();

  const apiKey = req.headers['x-service-key'];

  if (apiKey && apiKey === expected) {
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized' });
}

// ✅ Protected chat endpoint
app.post('/v1/chat', checkServiceKey, async (req, res) => {
  try {
    // For now we just confirm it works and echo the body.
    // Later we’ll proxy this to OpenAI.
    res.json({
      ok: true,
      message: 'Chat endpoint is working',
      receivedBody: req.body || {}
    });
  } catch (err) {
    console.error('Error in /v1/chat:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Threadwise Backend API server running on port ${PORT}`);
});
