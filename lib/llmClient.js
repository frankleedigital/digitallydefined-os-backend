/**
 * OmniRoute Client for backend agents
 * Unified AI gateway client — primary path for DigitallyDefined.
 *
 * Required env: OMNIROUTE_API_KEY
 * Optional env: OMNIROUTE_BASE_URL, OMNIROUTE_MODEL
 */

const DEFAULT_SYSTEM_PROMPT =
  'You are Hermes, the AI business partner for DigitallyDefined. Give short, high-level, no-bullshit business advice. Focus on priorities, risks, and the next move.';

// Accept base URL with or without a trailing "/v1"; always resolve to "<origin>/v1/chat/completions".
export function normalizeOmnirouteBase(raw) {
  return String(raw || process.env.OMNIROUTE_BASE_URL || 'http://45.79.180.236:20128/v1')
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/v1$/, '') + '/v1';
}

const OMNIROUTE_BASE_URL = normalizeOmnirouteBase(process.env.OMNIROUTE_BASE_URL);
const OMNIROUTE_API_KEY = (process.env.OMNIROUTE_API_KEY || '').trim();
// Direct Gemini fallback (used only when OmniRoute is unreachable/failing).
const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
const GEMINI_BASE_URL = (process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai').trim().replace(/\/+$/, '');
const DEFAULT_MODEL = (process.env.OMNIROUTE_MODEL || process.env.GEMINI_MODEL || 'dd-combo').trim();

function buildMessages(prompt, systemPrompt) {
  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: prompt.trim() },
  ];
}

function errorResult(error) {
  return { reply: '', provider: null, model: null, error };
}

function validateInputs(prompt) {
  if (!OMNIROUTE_API_KEY && !GEMINI_API_KEY) {
    return 'No AI API key configured (OMNIROUTE_API_KEY or GEMINI_API_KEY required)';
  }
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return 'Invalid prompt: must be a non-empty string';
  }
  return null;
}

async function postChat(requestBody, timeout) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(`${OMNIROUTE_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OMNIROUTE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OmniRoute error: ${response.status} ${response.statusText} - ${errorText.slice(0, 200)}`);
    }
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ---- Direct Gemini fallback (Google's OpenAI-compatible endpoint) ----
// Used only when the OmniRoute call fails (e.g. Linode down) and a
// GEMINI_API_KEY / GOOGLE_API_KEY is configured.
export function geminiConfigured() {
  return Boolean(GEMINI_API_KEY);
}

async function postGeminiChat(requestBody, timeout) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(`${GEMINI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GEMINI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini fallback error: ${response.status} ${response.statusText} - ${errorText.slice(0, 200)}`);
    }
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function geminiFallback(requestBody, timeout) {
  if (!GEMINI_API_KEY) return null;
  try {
    const geminiBody = {
      ...requestBody,
      model: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
    };
    const response = await postGeminiChat(geminiBody, timeout);
    const data = JSON.parse(await response.text());
    const reply = data?.choices?.[0]?.message?.content || '';
    if (!reply) return null;
    return { reply, provider: 'gemini-direct', model: geminiBody.model, error: null };
  } catch (error) {
    console.error('[llmClient] Gemini fallback failed:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

async function extractReply(response) {
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();

  if (!contentType.includes('text/event-stream') && !text.trimStart().startsWith('data:')) {
    const data = JSON.parse(text);
    return data?.choices?.[0]?.message?.content || '';
  }

  let reply = '';
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) continue;
    const payload = trimmed.slice(5).trim();
    if (!payload || payload === '[DONE]') continue;
    try {
      const parsed = JSON.parse(payload);
      const delta = parsed?.choices?.[0]?.delta?.content
        || parsed?.choices?.[0]?.message?.content
        || '';
      reply += delta;
    } catch {
      // Skip invalid JSON chunks
    }
  }
  return reply;
}

export async function omniRoute(prompt, options = {}) {
  const inputError = validateInputs(prompt);
  if (inputError) return errorResult(inputError);

  const primaryModel = options.model || DEFAULT_MODEL;
  const systemPrompt = options.systemPrompt || DEFAULT_SYSTEM_PROMPT;
  const jsonMode = options.jsonMode || false;
  const timeout = options.timeout || 60000;

  try {
    const requestBody = { model: primaryModel, messages: buildMessages(prompt, systemPrompt) };
    if (jsonMode) requestBody.response_format = { type: 'json_object' };

    const response = await postChat(requestBody, timeout);
    const reply = await extractReply(response);
    if (!reply) throw new Error('OmniRoute returned an empty response');

    return { reply, provider: 'omniroute', model: primaryModel, error: null };
  } catch (err) {
    // OmniRoute failed — try the direct Gemini fallback before giving up.
    const fallback = await geminiFallback({
      messages: buildMessages(prompt, systemPrompt),
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }, timeout);
    if (fallback) return fallback;
    return errorResult(err instanceof Error ? err.message : String(err));
  }
}

export async function omniRouteStream(prompt, options = {}, onChunk) {
  const inputError = validateInputs(prompt);
  if (inputError) return errorResult(inputError);

  const model = options.model || DEFAULT_MODEL;
  const systemPrompt = options.systemPrompt || DEFAULT_SYSTEM_PROMPT;
  const timeout = options.timeout || 60000;

  try {
    const requestBody = {
      model,
      messages: buildMessages(prompt, systemPrompt),
      stream: true,
    };
    if (options.jsonMode) requestBody.response_format = { type: 'json_object' };

    const response = await postChat(requestBody, timeout);
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullReply = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          const content = parsed?.choices?.[0]?.delta?.content || '';
          if (content) {
            fullReply += content;
            if (typeof onChunk === 'function') onChunk(content, fullReply);
          }
        } catch {
          // Skip invalid JSON chunks
        }
      }
    }

    return { reply: fullReply, provider: 'omniroute', model, error: null };
  } catch (error) {
    // OmniRoute failed — non-streamed Gemini fallback delivers the whole reply at once.
    const fallback = await geminiFallback({
      messages: buildMessages(prompt, systemPrompt),
      ...(options.jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }, timeout);
    if (fallback) {
      if (typeof onChunk === 'function') onChunk(fallback.reply, fallback.reply);
      return fallback;
    }
    return errorResult(error instanceof Error ? error.message : String(error));
  }
}

export async function callLLM(systemPrompt, userPrompt, opts = {}) {
  const result = await omniRoute(userPrompt, {
    model: opts.model || 'auto',
    systemPrompt: systemPrompt || 'You are Hermes, the AI business partner for DigitallyDefined. Be concise and actionable.',
    jsonMode: Boolean(opts.jsonSchema),
    timeout: 90000,
  });

  if (!result.error && result.reply) {
    return { reply: result.reply.trim(), provider: result.provider, model: result.model };
  }

  throw new Error(result.error || 'OmniRoute call failed');
}

export function parseJsonReply(reply) {
  const cleaned = reply
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  return JSON.parse(cleaned);
}

/**
 * Validate a parsed object against a simple type-map schema.
 * @param {object} schema  e.g. { name: "string", scores: "array", meta: "object" }
 * @param {unknown} value  parsed JSON
 * @returns {string[]}     array of error strings (empty if valid)
 */
export function validateAgainstSchema(schema, value) {
  const errors = [];
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    errors.push('Output must be a JSON object');
    return errors;
  }
  for (const [field, expected] of Object.entries(schema)) {
    if (value[field] === undefined || value[field] === null) {
      errors.push(`Missing required field: ${field}`);
      continue;
    }
    let actual;
    if (Array.isArray(value[field])) actual = 'array';
    else if (value[field] === null) actual = 'null';
    else actual = typeof value[field];

    const expectedType = expected;

    if (expectedType !== actual) {
      errors.push(`${field} must be ${expectedType}, received ${actual}`);
    }
  }
  return errors;
}

export default { omniRoute, omniRouteStream, normalizeOmnirouteBase };
