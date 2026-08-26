// lib/anti-gravity.js
// AntiGravity integration for triggering workflows
// Connects Buzz Agents to Antigravity automation

export async function triggerWorkflow(workflowId, inputs) {
  const response = await fetch('https://api.antigravity.app/v1/workflows/trigger', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + process.env.ANTIGRAVITY_API_KEY
    },
    body: JSON.stringify({ workflowId, inputs })
  });
  
  if (!response.ok) {
    throw new Error('AntiGravity workflow trigger failed: ' + response.status);
  }
  
  return await response.json();
}

export async function createAutomation(data) {
  const response = await fetch('https://api.antigravity.app/v/automations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + process.env.ANTIGRAVITY_API_KEY
    },
    body: JSON.stringify({
      name: 'DigitallyDefined - ' + data.superpowerName + ' Pathway',
      steps: data.recommendedPathways.map((p, i) => ({
        step: i + 1,
        action: 'generate_content',
        parameters: { topic: p }
      })),
      status: 'draft'
    })
  });
  
  return await response.json();
}

export default { triggerWorkflow, createAutomation };
