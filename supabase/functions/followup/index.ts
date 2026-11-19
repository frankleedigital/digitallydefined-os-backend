// supabase/functions/followup/index.ts
// Follow-up email pipeline — Supabase scheduled function (daily at midnight).
//
// Retired provider: SendGrid (SENDGRID_* env vars are no longer used).
// Roadmaps: Supabase `quiz_roadmaps` table via REST + service role.
//   The old node:fs-based roadmaps-store has no persistent data on the edge
//   runtime (every deploy starts with an empty data dir), so the FS store was
//   a silent no-op here — this is the actual roadmap source.
// Delivery: Brevo transactional API (_shared/brevo-email.ts), BREVO_API_KEY.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { FOLLOWUP_DAYS, DAY_META, buildMessage } from "../_shared/followup-messages.ts";
import { sendBrevoEmail } from "../_shared/brevo-email.ts";
import { corsHeaders } from "../_shared/cors-utils.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_KEY") || "";
const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY") || "";
const APP_URL = Deno.env.get("APP_URL") || "https://dashboard.digitallydefined.agency";

const DAY_NUMBERS = FOLLOWUP_DAYS.map(d => Number(d.replace(/\D/g, "")));

type RoadmapRow = {
  id: number | string;
  email: string;
  persona_key?: string;
  result?: Record<string, unknown> | null;
  created_at: string;
};

function esc(s: unknown): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function listRecentRoadmaps(limit = 500): Promise<RoadmapRow[]> {
  if (!SUPABASE_URL || !SERVICE_KEY) return [];
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/quiz_roadmaps?select=*&order=created_at.desc&limit=${limit}`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } },
    );
    if (!res.ok) {
      console.error("[followup-cron] quiz_roadmaps query failed:", res.status);
      return [];
    }
    return (await res.json()) as RoadmapRow[];
  } catch (e) {
    console.error("[followup-cron] quiz_roadmaps query error:", e);
    return [];
  }
}

function sentDays(row: RoadmapRow): string[] {
  const arr = (row.result as { followupDaysSent?: unknown } | null | undefined)?.followupDaysSent;
  return Array.isArray(arr) ? arr.map(String) : [];
}

async function markFollowupSent(row: RoadmapRow, day: string): Promise<void> {
  if (!SUPABASE_URL || !SERVICE_KEY) return;
  const result = { ...((row.result as object) || {}), followupDaysSent: [...sentDays(row), day] };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/quiz_roadmaps?id=eq.${row.id}`, {
    method: "PATCH",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ result }),
  });
  if (!res.ok) console.error("[followup-cron] markFollowupSent failed:", res.status, row.email, day);
}

function buildFollowupHtml(name: string, day: string, persona: string, message: string): string {
  const meta = DAY_META[day] || {};
  return `<!doctype html>
<html><body style="margin:0;padding:32px 16px;background:#0a0a12;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <div style="max-width:560px;background:#1a1a2e;border:1px solid #2a2a4a;border-radius:8px;padding:32px;">
      <p style="margin:0;color:#c9a84c;font-size:13px;text-transform:uppercase;letter-spacing:1px;">DigitallyDefined — ${esc(meta.label || day)}</p>
      <h2 style="margin:14px 0 18px;color:#ffffff;font-size:22px;">${esc(meta.subject || "Keep building")}</h2>
      <p style="margin:0 0 14px;color:#a0a0b0;font-size:15px;line-height:1.6;">
        Hi ${esc(name)}, you're ${day.replace(/\D/g, "")} days into your ${esc(persona || "digital")} roadmap. One small move today keeps the momentum — here's your nudge:
      </p>
      <p style="margin:0 0 24px;color:#ffffff;font-size:15px;line-height:1.6;">${esc(message)}</p>
      <a href="${APP_URL}" style="display:inline-block;background:#c9a84c;color:#0a0a12;padding:12px 24px;text-decoration:none;font-weight:bold;font-size:14px;border-radius:4px;">Open your dashboard →</a>
      <p style="margin:24px 0 0;color:#666677;font-size:12px;">You're receiving this because you completed the Digital Superpower Quiz at digitallydefined.store.</p>
    </div>
  </td></tr></table>
</body></html>`;
}

serve(async (req: Request) => {
  const url = new URL(req.url);
  const origin = req.headers.get("origin");
  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": origin || "https://digitallydefined.store",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders(origin || "") });
  }

  // === GET: return followup schedule (unchanged from the SendGrid era) ===
  if (req.method === "GET") {
    const day = url.pathname.split("/").filter(Boolean).pop();
    if (day && FOLLOWUP_DAYS.includes(day)) {
      const meta = DAY_META[day] || {};
      return new Response(JSON.stringify({
        ok: true, day, ...meta, indicator: { day, delivered: false, subject: meta.subject || "" },
      }), { status: 200, headers });
    }
    return new Response(JSON.stringify({
      ok: true,
      days: FOLLOWUP_DAYS.map(d => ({ day: d, ...DAY_META[d], indicator: { day: d, delivered: false, subject: DAY_META[d]?.subject || "" } })),
      provider: "brevo",
    }), { status: 200, headers });
  }

  // === POST: trigger follow-up dispatch (Supabase cron + manual) ===
  if (req.method === "POST") {
    const isCron = req.headers.get("x-supabase-intention") === "supabase.cron.followup";
    if (!BREVO_API_KEY) {
      console.log("[followup-cron] BREVO_API_KEY not configured — dry run mode");
    }

    try {
      const roadmaps = await listRecentRoadmaps();
      let dispatched = 0;
      let skipped = 0;
      let failed = 0;

      for (const row of roadmaps) {
        const email = String(row.email || "").trim().toLowerCase();
        if (!email) continue;

        // Only fire on the row's scheduled follow-up day (1, 3, 5, 7, 10, 14 after creation).
        const daysSince = Math.floor((Date.now() - new Date(row.created_at).getTime()) / 86400000);
        if (!DAY_NUMBERS.includes(daysSince)) continue;
        const day = `day${daysSince}`;

        // Dedup: never send the same follow-up day twice.
        if (sentDays(row).includes(day)) { skipped++; continue; }

        // Dry-run guard: no creds means log-only, matching the old behavior.
        if (!BREVO_API_KEY || !SERVICE_KEY) {
          console.log(`[followup-cron] dry run — would send ${day} to ${email}`);
          skipped++;
          continue;
        }

        const name = String((row.result as Record<string, unknown> | null)?.name || "Builder");
        const persona = String(row.persona_key || "");
        const message = buildMessage({ resultKey: day, profile: { name }, roadmap: row.result || undefined });

        try {
          await sendBrevoEmail({
            to: email,
            name,
            subject: DAY_META[day].subject || "Keep building — your next move",
            html: buildFollowupHtml(name, day, persona, message),
          });
          await markFollowupSent(row, day);
          dispatched++;
        } catch (e) {
          failed++;
          console.error("[followup-cron] Brevo send failed:", e instanceof Error ? e.message : e, { email, day });
        }
      }

      const status = BREVO_API_KEY && SERVICE_KEY ? "completed" : "dry_run";
      return new Response(JSON.stringify({
        ok: true,
        action: "followup",
        provider: "brevo",
        source: "quiz_roadmaps",
        status,
        isCron: !!isCron,
        dispatched,
        skipped,
        failed,
        totalProcessed: roadmaps.length,
        timestamp: new Date().toISOString(),
      }), { status: 200, headers });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[followup-cron] error:", msg);
      return new Response(JSON.stringify({ ok: false, error: msg }), { status: 500, headers });
    }
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
});
