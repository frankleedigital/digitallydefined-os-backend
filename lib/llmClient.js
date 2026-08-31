/**
 * OmniRoute Client for backend agents
 * Unified AI gateway client — primary path for DigitallyDefined.
 *
 * Required env: OMNIROUTE_API_KEY
 * Optional env: OMNIROUTE_BASE_URL, OMNIROUTE_MODEL
 */

const DEFAULT_SYSTEM_PROMPT =
  'You are Hermes, the AI business partner for DigitallyDefined. Be concise and actionable.';

// Accept base URL with or without a trailing "/v1"; always resolve to "<origin>/v1/chat/completions".
export function normalizeOmnirouteBase(raw) {
  return String(raw || process.env.OMNIROUTE_BASE_URL || 'http://45.79.180.236:20128/v1')
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/v1$/, '') + '/v1';
}

const OMNIROUTE_BASE_URL = normalizeOmnirouteBase(process.env.OMNIROUTE_BASE_URL);
const OMNIROUTE_API_KEY = (process.env.OMNIROUTE_API_KEY || '').trim();
const DEFAULT_MODEL = (process.env.OMNIROUTE_MODEL || 'auto').trim();

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
  if (!OMNIROUTE_API_KEY) {
    return 'OMNIROUTE_API_KEY not configured in environment variables';
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
    // Single OmniRoute attempt — no fallback models, no provider switching.
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