// supabase/functions/gumroad-webhook/index.ts
// Gumroad Webhook Handler — receives Gumroad sale events and tracks revenue.
//
// Phase 3: When a product is sold on Gumroad, this function:
//   1. Receives the sale event
//   2. Creates a Money Snapshot record in Notion
//   3. Triggers AI product intelligence analysis
//   4. Updates the dashboard
//
// Gumroad webhook payload (sale notification):
// { "seller_id": "...", "product_id": "...", "product_name": "...", "price": 27.00, "currency": "USD", "quantity": 1, "email": "buyer@example.com", "sale_id": "...", "created_at": "..." }

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

async function notionPost(path: string, body: unknown) {
  const res = await fetch(`${NOTION_API_BASE}${path}`, {
    method: "POST",
    headers: notionHeaders(),
    body: JSON.stringify(body),
  });
  return res.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Gumroad sends form-encoded data, but we accept JSON too
    const productName = body.product_name || body.product?.name || "Unknown Product";
    const price = parseFloat(body.price || body.amount || "0");
    const quantity = parseInt(body.quantity || "1", 10);
    const revenue = price * quantity;
    const buyerEmail = body.email || body.purchaser_email || "";
    const saleId = body.sale_id || body.id || "";
    const productId = body.product_id || body.product?.id || "";
    const createdAt = body.created_at || new Date().toISOString();

    // Step 1: Create Money Snapshot record in Notion
    const moneyDbId = Deno.env.get("NOTION_MONEY_DB_ID");
    if (moneyDbId) {
      await notionPost("/pages", {
        parent: { database_id: moneyDbId },
        properties: {
          Name: { title: [{ text: { content: `${productName} — ${new Date(createdAt).toLocaleDateString()}` } }] },
          Month: { date: { start: createdAt.split("T")[0] } },
          Revenue: { number: revenue },
          Expenses: { number: 0 },
          Net: { number: revenue },
        },
      });
    }

    // Step 2: Log to Automations DB
    const automationsDbId = Deno.env.get("NOTION_AUTOMATIONS_DB_ID");
    if (automationsDbId) {
      await notionPost("/pages", {
        parent: { database_id: automationsDbId },
        properties: {
          Name: { title: [{ text: { content: `Sale: ${productName}` } }] },
          Status: { select: { name: "Done" } },
          Source: { rich_text: [{ text: { content: "gumroad-webhook" } }] },
          Email: { email: buyerEmail },
        },
      });
    }

    // Step 3: Trigger AI product intelligence (fire and forget)
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://dijjlppdljpcgyoakdnq.supabase.co";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_KEY") || "";
    try {
      await fetch(`${supabaseUrl}/functions/v1/product-intelligence`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          action: "analyze",
          productName,
          revenue,
          buyerEmail,
          saleId,
        }),
      });
    } catch {
      // Fire and forget — don't fail the webhook
    }

    return new Response(JSON.stringify({
      ok: true,
      saleId,
      productName,
      revenue,
      tracked: true,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[gumroad-webhook] Error:", error);
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
echo "Created gumroad-webhook edge function"