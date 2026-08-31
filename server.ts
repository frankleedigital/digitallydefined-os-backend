// Local Deno server wrapper for your Supabase Hermes MCP function

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

// Import your Supabase MCP handler
import handler from "./supabase/functions/hermes-mcp/index.ts";

// Start a local HTTP server
serve(async (req) => {
  try {
    if (req.method === "POST") {
      const body = await req.json();
      const response = await handler(body);

      return new Response(JSON.stringify(response), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Hermes MCP running locally", { status: 200 });
  } catch (err) {
    console.error("Hermes MCP error:", err);
    return new Response("Internal error", { status: 500 });
  }
}, { port: 3000 });

console.log("Hermes MCP running at http://localhost:3000");
