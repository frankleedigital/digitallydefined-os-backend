/**
 * src/routes/antigravity.js
 * Antigravity Notion Architect — restored from corrupt 3-byte file.
 * Re-exports the live MCP client from lib/antigravity.js.
 *
 * This file was originally 3 bytes: '@'\r\n (a corrupt scaffold).
 * It has been replaced with a clean re-export so the live client is
 * used consistently across the backend, the dashboard, and the workers.
 */

export { antigravityStatus, antigravityCreateNotionPage, antigravityUpdateDatabase, antigravityBuildTemplate, antigravityReconcileDatabase, antigravityRunAutomation, antigravityHandle } from '../lib/antigravity.js';

export default { antigravityStatus, antigravityCreateNotionPage, antigravityUpdateDatabase, antigravityBuildTemplate, antigravityReconcileDatabase, antigravityRunAutomation, antigravityHandle };
