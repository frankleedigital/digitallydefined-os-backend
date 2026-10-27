// supabase/functions/notion-webhook/index.ts
// Notion Webhook Handler — receives Notion webhook events and routes to handlers.
//
// Phase 2: When a new idea is added to the Ideas DB, or when BuildNow = true,
// this function triggers the product-factory edge function.
//
// Notion webhook payload format:
// { "id": "...", "type": "page.created" | "page.updated", "entity": { "id": "page-id", "type": "page" }, "data": { "parent": { "id": "db-id", "type": "database" } } }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors-utils.ts";

const NOTION_API_BASE = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

function notionHeaders() {
  const token = Deno.env.get("NOTION_API_KEY") || Deno.env.get("NOTION_SECRET") || "";
  return {
    "Authorization": `Bearer ${token}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };
}

async function notionGet(path: string) {
  const res = await fetch(`${NOTION_API_BASE}${path}`, { headers: notionHeaders() });
  return res.json();
}

async function callProductFactory(ideaId: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://dijjlppdljpcgyoakdnq.supabase.co";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_KEY") || "";
  const res = await fetch(`${supabaseUrl}/functions/v1/product-factory`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ action: "build", ideaId }),
  });
  return res.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Verify webhook secret (if configured)
    const webhookSecret = Deno.env.get("NOTION_WEBHOOK_SECRET");
    if (webhookSecret) {
      const signature = req.headers.get("x-notion-signature");
      if (signature !== webhookSecret) {
        return new Response(JSON.stringify({ ok: false, error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const eventType = body.type || body.event_type;
    const entityId = body.entity?.id || body.data?.id;
    const parentId = body.data?.parent?.id || body.parent?.id;

    const ideasDbId = (Deno.env.get("NOTION_IDEAS_DB_ID") || "").replace(/-/g, "");

    // Check if this event is for the Ideas DB
    const isIdeasDb = parentId && parentId.replace(/-/g, "") === ideasDbId;

    if (!isIdeasDb) {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: "Not Ideas DB" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle new page creation
    if (eventType === "page.created" || eventType === "page_added") {
      // Check if BuildNow is true
      const page = await notionGet(`/pages/${entityId}`);
      const buildNow = page?.properties?.BuildNow?.select?.name === "true" ||
                       page?.properties?.BuildNow?.checkbox === true;

      if (buildNow) {
        const result = await callProductFactory(entityId);
        return new Response(JSON.stringify({ ok: true, action: "product_factory_triggered", result }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ ok: true, action: "page_created", buildNow: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle page updates (BuildNow changed to true)
    if (eventType === "page.updated" || eventType === "page_properties_updated") {
      const page = await notionGet(`/pages/${entityId}`);
      const buildNow = page?.properties?.BuildNow?.select?.name === "true" ||
                       page?.properties?.BuildNow?.checkbox === true;

      if (buildNow) {
        const result = await callProductFactory(entityId);
        return new Response(JSON.stringify({ ok: true, action: "product_factory_triggered", result }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ ok: true, action: "page_updated", buildNow: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, eventType, skipped: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[notion-webhook] Error:", error);
    return new Response(JSON.stringify({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
EOF
echo "Created notion-webhook edge function"