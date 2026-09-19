// src/routes/index.js
// Router - maps actions to route handlers
// NOTE: This file defines the route catalog. The actual dispatch is handled by
// the Vercel api/index.js handler which processes all actions directly.
export const ROUTES = {
  status: 'handleStatus',
  'auth.verify': 'handleAuthVerify',
  'test-env': 'handleTestEnv',
  dashboard: 'handleDashboard',
  chat: 'handleChat',
  'public.chat': 'handlePublicChat',
  'mentor.dev': 'handleMentorDev',
  'hermes.agent': 'handleHermesAgent',
  intelligence: 'handleIntelligence',
  'automation.sync': 'handleAutomationSync',
  'automation.list': 'handleAutomationList',
  'automation.logs': 'handleAutomationLogs',
  'automation.events': 'handleAutomationEvents',
  'automation.run': 'handleAutomationRun',
  'integration.googleAnalytics': 'handleIntegrationData',
  'integration.social': 'handleIntegrationData',
  'integration.email': 'handleIntegrationData',
  'integration.community': 'handleIntegrationData',
  'integration.google.start': 'handleIntegrationStart',
  'integration.social.start': 'handleIntegrationStart',
  'integration.email.start': 'handleIntegrationStart',
  'integration.community.start': 'handleIntegrationStart',
  license: 'handleLicenseVerify',
  'antigravity': 'handleAntigravity',
  'antigravity.createNotionPage': 'handleAntigravity',
  'antigravity.updateDatabase': 'handleAntigravity',
  'antigravity.buildTemplate': 'handleAntigravity',
  'antigravity.runAutomation': 'handleAntigravity',
  'antigravity.status': 'handleAntigravity',
  'website.content': 'handleWebsiteContent',
  'website.edit': 'handleWebsiteEdit',
};

export default ROUTES;
