// supabase/functions/_shared/gemini-client.ts
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || '';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const MODELS = { flash: 'gemini-2.5-flash-preview-04-17', pro: 'gemini-2.5-pro-preview-06-05' };

export async function geminiChat(messages: {role: string; content: string}[], { usesPro = false, systemPrompt = '' } = {}) {
  if (!GEMINI_API_KEY) return { ok: false, error: 'GEMINI_API_KEY not set' };
  const model = usesPro ? MODELS.pro : MODELS.flash;
  const url = GEMINI_BASE + '/openai/chat/completions';
  const body = {
    model,
    messages: systemPrompt ? [{ role: 'system', content: systemPrompt }, ...messages] : messages,
  };
  let res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
    body: JSON.stringify(body),
  });
  if (res.status === 429) {
    await new Promise(r => setTimeout(r, 2000));
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
      body: JSON.stringify(body),
    });
    if (!res.ok) return { ok: false, error: 'Rate limited after retry' };
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { ok: false, error: err.error?.message || ('Gemini ' + res.status) };
  }
  const d = await res.json();
  return { ok: true, content: d.choices?.[0]?.message?.content || '', model };
}

export function shouldUsePro(task: string) {
  return ['audit','report','code_review','analysis','business_report'].includes(task);
}

export default { geminiChat, shouldUsePro, MODELS };
