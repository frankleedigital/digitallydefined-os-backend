// lib/omniroute.js
// OmniRoute integration for DigitallyDefined agents
// Routes requests to appropriate AI model via stepfun/poolside/groq

export async function generateResponse(systemPrompt, userMessage) {
  // This is a placeholder implementation
  // In production, this would call the OmniRoute API
  const response = await fetch('https://digitallydefined-os-backend.vercel.app/api/hermes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemPrompt,
      userMessage,
      model: 'stepfun', // default, configurable
      temperature: 0.3,
    })
  });
  
  if (!response.ok) {
    throw new Error('OmniRoute request failed: ' + response.status);
  }
  
  const data = await response.json();
  return data.reply || data.message;
}

export default { generateResponse };
