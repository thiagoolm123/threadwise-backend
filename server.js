// server.js — Threadwise Backend for Gmail Add-on
// Matches Apps Script callOpenAI() interface exactly.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Validate env vars
if (!process.env.OPENAI_API_KEY) {
  console.warn("WARNING: OPENAI_API_KEY is missing.");
}

const SERVICE_KEY = process.env.THREADWISE_SERVICE_KEY;

// Auth middleware (Apps Script sends x-service-key)
function authMiddleware(req, res, next) {
  if (!SERVICE_KEY) {
    return res.status(401).json({ error: "Unauthorized: THREADWISE_SERVICE_KEY not configured" });
  }

  const incoming = req.headers["x-service-key"];
  if (!incoming || incoming !== SERVICE_KEY) {
    return res.status(401).json({ error: "Unauthorized: invalid or missing service key" });
  }

  next();
}

// OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Root / Health check
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "threadwise-backend",
    message: "Threadwise backend is running"
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "threadwise-backend",
    time: new Date().toISOString()
  });
});

// MAIN ENDPOINT: /v1/chat (this is what Apps Script calls)
app.post("/v1/chat", authMiddleware, async (req, res) => {
  try {
    const { messages, maxTokens } = req.body || {};

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages[] is required" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // best lightweight model for Gmail replies
      messages,
      max_tokens: maxTokens || 300,
      temperature: 0.7
    });

    const reply = completion.choices?.[0]?.message?.content?.trim() || "";

    return res.json({ reply });
  } catch (err) {
    console.error("Error in /v1/chat:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Threadwise backend running on port ${port}`);
});
