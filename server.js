// server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Simple auth using a shared service key (optional but recommended)
app.use((req, res, next) => {
  const apiKey = req.headers['x-service-key'];
  const expected = process.env.THREADWISE_SERVICE_KEY;

  if (!expected) {
    // If no key is set in env, skip auth (dev mode)
    return next();
  }

  if (apiKey && apiKey === expected) {
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized' });
});

// ✅ Healthcheck / root route
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'threadwise-backend',
    time: new Date().toISOString()
  });
});

// ✅ Main chat endpoint (placeholder for now)
app.post('/v1/chat', async (req, res) => {
  try {
    // For now, just echo back that it works.
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
