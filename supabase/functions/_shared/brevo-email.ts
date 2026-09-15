// supabase/functions/_shared/brevo-email.ts — transactional email via Brevo

const BREVO_API = "https://api.brevo.com/v3/smtp/email";

export async function sendBrevoEmail({ to, name, subject, html }: { to: string; name?: string; subject: string; html: string }) {
  const apiKey = Deno.env.get("BREVO_API_KEY") || "";
  if (!apiKey) throw new Error("BREVO_API_KEY not configured");
  const senderEmail = Deno.env.get("BREVO_SENDER_EMAIL") || "hello@digitallydefined.online";
  const senderName = Deno.env.get("BREVO_SENDER_NAME") || "DigitallyDefined";

  const res = await fetch(BREVO_API, {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: [{ email: to, name: name || undefined }],
      subject,
      htmlContent: html,
    }),
  });
  if (!res.ok) throw new Error(`Brevo error ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.json();
}

function esc(s: unknown): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function buildRoadmapEmail(profile, roadmap, name) {
  const greeting = name ? `Hi ${esc(name)},` : "Hi there,";
  const steps = Array.isArray(roadmap?.steps) ? roadmap.steps : [];
  const next3 = Array.isArray(roadmap?.next3Steps) ? roadmap.next3Steps : [];
  const tool = roadmap?.recommendedTool;
  const cta = roadmap?.cta;
  const appUrl = Deno.env.get("APP_URL") || "https://digitallydefined.online/dashboard";

  const stepHtml = steps.map((s, i) =>
    `<li style="margin-bottom:10px;"><strong>${i + 1}. ${esc(s.title)}</strong>${s.description ? `<br/><span style="color:#555;">${esc(s.description)}</span>` : ""}${s.timeframe ? `<br/><em style="color:#888;font-size:12px;">${esc(s.timeframe)}</em>` : ""}</li>`
  ).join("");

  const nextHtml = next3.map((n) => `<li style="margin-bottom:6px;">${esc(n)}</li>`).join("");

  return `<!doctype html>
<html><body style="font-family:Arial,Helvetica,sans-serif;color:#222;max-width:640px;margin:auto;padding:24px;">
  <h1 style="font-size:22px;">${greeting} your superpower is <span style="color:#4f46e5;">${esc(profile.superpowerName)}</span></h1>
  <p style="font-size:14px;color:#555;">${esc(profile.superpowerDescription)}</p>
  ${roadmap?.title ? `<h2 style="font-size:18px;">${esc(roadmap.title)}</h2>` : ""}
  ${roadmap?.summary ? `<p style="font-size:14px;">${esc(roadmap.summary)}</p>` : ""}
  ${steps.length ? `<h3 style="font-size:15px;">Your roadmap</h3><ol style="font-size:14px;padding-left:18px;">${stepHtml}</ol>` : ""}
  ${next3.length ? `<h3 style="font-size:15px;">Your next 3 steps</h3><ol style="font-size:14px;padding-left:18px;">${nextHtml}</ol>` : ""}
  ${tool ? `<p style="font-size:14px;"><strong>Recommended tool:</strong> ${esc(tool)}</p>` : ""}
  <p style="margin-top:28px;"><a href="${appUrl}" style="background:#4f46e5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;">${esc(cta || "Continue your journey →")}</a></p>
  <p style="margin-top:32px;font-size:12px;color:#999;">You received this because you completed the Digital Superpower Quiz at DigitallyDefined.</p>
</body></html>`;
}
