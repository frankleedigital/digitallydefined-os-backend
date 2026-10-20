// /api/business-partner/index.js
// Directory-based serverless function — POST /api/business-partner
// Runs Hermès (the AI business partner) against live dashboard/website data.
// The dashboard assistant page sends { message, action:"business.partner",
// job, history } and expects a JSON reply (possibly "needsApproval" when a
// website change needs review).
//
// Reuses the canonical Express handler from src/routes/businessPartner.js.

import { handleBusinessPartner } from "../../src/routes/businessPartner.js";

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

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Normalize the JSON body: Vercel usually parses application/json into
  // req.body for us, but when it arrives as a raw string the downstream
  // route handler would crash reading req.body.message.
  if (typeof req.body === "string") {
    try {
      req.body = req.body.trim() ? JSON.parse(req.body) : {};
    } catch {
      return res.status(400).json({ error: "Invalid JSON body" });
    }
  }

  await handleBusinessPartner(req, res);
}
