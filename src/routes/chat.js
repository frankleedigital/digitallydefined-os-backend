// src/routes/chat.js
import { checkDashboardApiKey } from '../middleware/auth.js';
import { runGeminiAgent, stripMarkdown } from '../services/ai.js';

export async function handleChat(req, res) {
  if (!checkDashboardApiKey(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const message = String(req.body?.message || '').trim();
  if (!message) {
    return res.status(400).json({ error: 'A message is required' });
  }
  
  const userSystemPrompt = String(req.body?.systemPrompt || 'You are the DigitallyDefined Operations AI. Be concise, strategic, and actionable.').trim();
  const conversation = Array.isArray(req.body?.conversation) ? req.body.conversation : [];
  
  try {
    const result = await runGeminiAgent(
      'Current conversation context:\n' + JSON.stringify(conversation.slice(-8)) + '\n\nUser request:\n' + message,
      userSystemPrompt + '\n\nOUTPUT FORMAT (strict): Respond in plain text only. No markdown, no code fences, no backticks, no emojis. Use plain paragraphs or simple dashes.',
    );
    
    return res.status(200).json({
      ok: true,
      reply: stripMarkdown(result.reply),
      provider: result.provider,
      model: result.model,
    });
  } catch (error) {
    return res.status(502).json({
      error: error instanceof Error ? error.message : 'AI agent request failed',
    });
  }
}

export default { handleChat };
