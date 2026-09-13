// src/middleware/cors.js
const ALLOWED_ORIGINS = [
  "https://dashboard.digitallydefined.online",
  "https://digitallydefined.online",
  "https://www.digitallydefined.online",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
];

export function setCORSHeaders(res, origin) {
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key, apikey, x-user-id");
  res.setHeader("Access-Control-Max-Age", "86400");
}

export function handleOPTIONS(req, res) {
  if (req.method === "OPTIONS") {
    setCORSHeaders(res, req.headers?.origin);
    return res.status(200).end();
  }
  return null;
}

export default { setCORSHeaders, handleOPTIONS };
