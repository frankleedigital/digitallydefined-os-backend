// /api/active-model/index.js
// Directory-based serverless function — GET /api/active-model
// Returns the stored AI model for the current user. The dashboard restores the
// model from localStorage first, then falls back to this endpoint.
//
// Reuses the canonical handler from src/routes/setModel.js.

import { handleGetActiveModel } from "../../src/routes/setModel.js";

// Allowed origins for the dashboard & local development.
const ALLOWED_ORIGINS = [
  "https://dashboard.digitallydefined.agency",
  "https://digitallydefined.online",
  "https://www.digitallydefined.online",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
];

function resolveCorsOrigin(req) {
  const origin = req.headers && req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) return origin;
  return "https://dashboard.digitallydefined.agency";
}

export default async function handler(req, res) {
  const corsOrigin = resolveCorsOrigin(req);
  res.setHeader("Access-Control-Allow-Origin", corsOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-api-key, apikey, x-user-id"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Vary", "Origin");

  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end();
    return;
  }

  // Vercel parses application/json into req.body for us.
  await handleGetActiveModel(req, res);
}
