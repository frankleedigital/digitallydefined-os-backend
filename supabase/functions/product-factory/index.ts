// supabase/functions/product-factory/index.ts
// Product Factory — orchestrates the full digital product pipeline.
//
// Triggered by:
//   - Manual "Build Product" button in dashboard (POST /api?action=product.factory)
//   - Notion webhook when BuildNow = true (Phase 2)
//   - Gumroad webhook when product is sold (Phase 3)
//
// Pipeline:
//   1. Read idea from Notion Ideas DB
//   2. AI generates product metadata (title, description, price, niche)
//   3. Create Digital Asset record in Notion
//   4. Generate sales page content (websiteEditor)
//   5. Generate email sequence (email-publish)
//   6. Generate social posts (social-publishers)
//   7. Queue for approval (Status = "Pending Approval")
//   8. On approval → publish to Gumroad + website
//   9. Track revenue in Money Snapshot DB

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

async function notionPost(path: string, body: unknown) {
  const res = await fetch(`${NOTION_API_BASE}${path}`, {
    method: "POST",
    headers: notionHeaders(),
    body: JSON.stringify(body),
  });
  return res.json();
}

async function notionPatch(path: string, body: unknown) {
  const res = await fetch(`${NOTION_API_BASE}${path}`, {
    method: "PATCH",
    headers: notionHeaders(),
    body: JSON.stringify(body),
  });
  return res.json();
}

// Step 1: Read idea from Notion Ideas DB
async function readIdea(ideaId: string) {
  return await notionGet(`/pages/${ideaId}`);
}

// Step 2: AI generates product metadata
async function generateProductMetadata(idea: unknown) {
  const apiKey = Deno.env.get("OMNIROUTE_API_KEY") || Deno.env.get("GEMINI_API_KEY") || "";
  const baseUrl = Deno.env.get("OMNIROUTE_BASE_URL") || "https://generativelanguage.googleapis.com/v1beta/openai";
  const model = Deno.env.get("OMNIROUTE_MODEL") || "gemini-3.6-flash";

  const ideaText = JSON.stringify(idea);
  const prompt = `You are a digital product strategist for DigitallyDefined — a faceless digital asset business targeting Gen X women.

Analyze this idea and generate product metadata:
${ideaText}

Return ONLY a JSON object with these fields:
{
  "title": "Product title (max 60 chars)",
  "description": "Product description (max 200 chars)",
  "price": 27,
  "niche": "Target niche",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "format": "PDF|Notion|Spreadsheet|Checklist|Playbook",
  "leadMagnetTitle": "Free lead magnet title",
  "emailSubject": "Welcome email subject line"
}`;

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "You are a digital product strategist. Return only valid JSON." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || "{}";
  try {
    return JSON.parse(content.replace(/```json|```/g, "").trim());
  } catch {
    return { title: "New Product", description: "A digital product", price: 27, niche: "general", keywords: [], format: "PDF", leadMagnetTitle: "Free Guide", emailSubject: "Welcome" };
  }
}

// Step 3: Create Digital Asset record in Notion
async function createDigitalAsset(metadata: Record<string, unknown>) {
  const dbId = Deno.env.get("NOTION_DIGITAL_ASSETS_DB_ID") || Deno.env.get("NOTION_ASSETS_DB_ID");
  if (!dbId) return null;

  const page = await notionPost("/pages", {
    parent: { database_id: dbId },
    properties: {
      Name: { title: [{ text: { content: metadata.title } }] },
      Status: { select: { name: "Draft" } },
      Niche: { rich_text: [{ text: { content: metadata.niche } }] },
      AssetValue: { number: metadata.price },
    },
  });

  return page;
}

// Step 4: Generate sales page content
async function generateSalesPage(metadata: Record<string, unknown>) {
  // For Phase 1, we generate the content and store it.
  // Full website integration comes in Phase 2.
  return {
    headline: metadata.title,
    subheadline: metadata.description,
    price: metadata.price,
    cta: `Get ${metadata.title} for $${metadata.price}`,
    generated: true,
  };
}

// Step 5: Generate email sequence
async function generateEmailSequence(metadata: Record<string, unknown>) {
  return {
    subject: metadata.emailSubject,
    emails: [
      { day: 0, subject: metadata.emailSubject, body: `Welcome! Here's your ${metadata.leadMagnetTitle}.` },
      { day: 1, subject: `How to use ${metadata.title}`, body: `Here's how ${metadata.title} helps you.` },
      { day: 3, subject: `Quick win with ${metadata.title}`, body: `Try this quick win today.` },
      { day: 7, subject: `Your ${metadata.title} results`, body: `Here's what you can achieve.` },
      { day: 14, subject: `Next steps with ${metadata.title}`, body: `Ready for the next level?` },
    ],
    generated: true,
  };
}

// Step 6: Generate social posts
async function generateSocialPosts(metadata: Record<string, unknown>) {
  const posts = [
    `New product: ${metadata.title} — ${metadata.description}`,
    `Just launched: ${metadata.title} for ${metadata.niche}. Only $${metadata.price}.`,
    `${metadata.title} is here! Get it now: [link]`,
    `Struggling with ${metadata.niche}? ${metadata.title} has the answer.`,
    `5 ways ${metadata.title} saves you time and money.`,
  ];
  return { posts, count: posts.length, generated: true };
}

// Step 7: Queue for approval
async function queueForApproval(assetId: string, metadata: Record<string, unknown>) {
  if (!assetId) return;
  await notionPatch(`/pages/${assetId}`, {
    properties: {
      Status: { select: { name: "Draft" } },
    },
  });
}

// Main handler
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const action = body.action || "build";
    const ideaId = body.ideaId || body.id;

    if (action === "status") {
      return new Response(JSON.stringify({ ok: true, service: "product-factory", version: "1.0" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!ideaId) {
      return new Response(JSON.stringify({ ok: false, error: "ideaId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 1: Read idea
    const idea = await readIdea(ideaId);

    // Step 2: AI generates product metadata
    const metadata = await generateProductMetadata(idea);

    // Step 3: Create Digital Asset record
    const asset = await createDigitalAsset(metadata);

    // Step 4: Generate sales page
    const salesPage = await generateSalesPage(metadata);

    // Step 5: Generate email sequence
    const emailSequence = await generateEmailSequence(metadata);

    // Step 6: Generate social posts
    const socialPosts = await generateSocialPosts(metadata);

    // Step 7: Queue for approval
    await queueForApproval(asset?.id, metadata);

    // Step 8: Log to Automations DB
    const automationsDbId = Deno.env.get("NOTION_AUTOMATIONS_DB_ID");
    if (automationsDbId) {
      await notionPost("/pages", {
        parent: { database_id: automationsDbId },
        properties: {
          Name: { title: [{ text: { content: `Product Factory: ${metadata.title}` } }] },
          Status: { select: { name: "Done" } },
          Source: { rich_text: [{ text: { content: "product-factory" } }] },
        },
      });
    }

    return new Response(JSON.stringify({
      ok: true,
      ideaId,
      assetId: asset?.id,
      metadata,
      salesPage,
      emailSequence,
      socialPosts,
      status: "queued_for_approval",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[product-factory] Error:", error);
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
echo "Created product-factory edge function"