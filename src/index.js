// src/index.js - DigitallyDefined OS Backend Express Entry Point
// Local development server — mirrors the Vercel api/index.js handler shape
// for local testing. In production, Vercel uses api/index.js directly.
import express from 'express';
import { createServer } from 'http';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS
app.use((req, res, next) => {
  const origin = req.headers.origin || '';
  const allowed = [
    'https://dashboard.digitallydefined.online',
    'https://digitallydefined.online',
    'https://www.digitallydefined.online',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
  ];
  if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://dashboard.digitallydefined.online');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, apikey, x-user-id');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

// Import the Vercel handler and use it as middleware
import handler from '../api/index.js';
app.use((req, res) => handler(req, res));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'digitallydefined-os-backend', environment: process.env.NODE_ENV || 'development' });
});

const server = createServer(app);
server.listen(PORT, () => {
  console.log(`OS Backend local server running on http://localhost:${PORT}`);
  console.log(`Vercel handler mounted at /api/*`);
});

export default app;
