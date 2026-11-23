// lib/slack.js — Slack notification helper
const TOKEN = process.env.SLACK_BOT_TOKEN;
const CHANNEL = process.env.SLACK_CHANNEL_ID;

export async function postSlack(text, channel = CHANNEL) {
  if (!TOKEN || !channel) { console.warn("[slack] not configured"); return null; }
  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ channel, text }),
  });
  return res.json();
}

export async function notifyOpportunity(opp) {
  return postSlack(`*New Opportunity Detected*\n${opp.name} — Demand: ${opp.demandScore}, Revenue: ${opp.revenuePotential}`);
}
export async function notifyBuildRequest(br) {
  return postSlack(`*Build Request Created*\n${br.product} for ${br.audience}`);
}
export async function notifyBriefing(briefing) {
  return postSlack(`*Hermes ${briefing.period} Briefing*\n${briefing.summary}`);
}
