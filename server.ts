// Local Deno server wrapper for your Supabase Hermes MCP function.
//
// NOTE: Hermes is now a self-contained Supabase Edge Function at
// `supabase/functions/hermes/index.ts` — it calls `serve()` itself and exports
// no request handler, so there is nothing to import as a `handler`. The
// canonical way to run it locally is `npm run dev:hermes` (which runs
// `supabase functions serve hermes`).
//
// This file keeps the old role of a stable local endpoint on :3000: it proxies
// POST requests (JSON body + auth headers) to the Hermes edge function and
// streams the response back. Point UPSTREAM at the local Supabase function
// (default) or any deployed Hermes URL.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const UPSTREAM =
  Deno.env.get("HERMES_ENDPOINT") ??
  Deno.env.get("SUPABASE_FUNCTIONS_URL") ??
  "http://127.0.0.1:54321/functions/v1/hermes";

// Echo an allowed origin back; fall back to the dashboard origin (no wildcard).
const ALLOWED_ORIGINS = new Set([
  "https://dashboard.digitallydefined.online",
  "https://digitallydefined.online",
  "https://www.digitallydefined.online",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
]);
const corsHeaders = (origin = "") => ({
  "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin) ? origin : "https://dashboard.digitallydefined.online",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key, x-user-id, apikey",
  "Vary": "Origin",
});

// Forward the auth headers the Hermes function understands.
const forwardHeaders = (req: Request) => {
  const out: Record<string, string> = {};
  for (const name of ["content-type", "authorization", "x-api-key", "apikey", "x-user-id"]) {
    const value = req.headers.get(name);
    if (value) out[name] = value;
  }
  return out;
};

serve(async (req) => {
  const origin = req.headers.get("origin") || "";
  try {
    // CORS preflight — mirror the edge function.
    if (req.method === "OPTIONS") {
      return new Response("ok", { status: 200, headers: corsHeaders(origin) });
    }

    if (req.method !== "POST") {
      return new Response("Hermes MCP running locally", { status: 200 });
    }

    const body = await req.text();
    const upstream = await fetch(UPSTREAM, {
      method: "POST",
      headers: forwardHeaders(req),
      body: body || "{}",
    });

    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "application/json",
        ...corsHeaders(origin),
      },
    });
  } catch (err) {
    console.error("Hermes MCP error:", err);
    return new Response("Internal error", { status: 500, headers: corsHeaders(origin) });
  }
}, { port: 3000 });

console.log(`Hermes MCP running at http://localhost:3000 -> ${UPSTREAM}`);
