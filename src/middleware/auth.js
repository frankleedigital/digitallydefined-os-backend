// src/middleware/auth.js
export function checkDashboardApiKey(req) {
  const provided = String(req.headers["x-api-key"] || req.headers["authorization"] || "").trim();
  const expected = (process.env.DASHBOARD_API_KEY || "").trim();
  if (!expected) return false;
  if (!provided) return false;
  return provided === expected;
}

export function requireAuth(req, res) {
  if (!checkDashboardApiKey(req)) {
    res.setHeader("Content-Type", "application/json");
    return res.status(401).json({ error: "Unauthorized" });
  }
  return null;
}

export default { checkDashboardApiKey, requireAuth };
