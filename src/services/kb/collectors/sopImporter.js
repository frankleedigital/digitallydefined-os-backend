// src/services/kb/collectors/sopImporter.js
// ============================================================================
// COLLECTOR 4 — SOP / DOCS IMPORTER.
//
// Turns machine-readable operating procedures into `sop_docs` so agents can be
// told which SOP applies to a task (blueprint roadmap #5).
//
// Two sources, in priority order:
//   1. SOP_DOCS_DIR — a directory of .md/.json/.txt files on the deploy (env
//      override, for the production path).
//   2. Default — the repo's own operational docs (charter/governance/etc.),
//      discovered relative to the backend root, so the KB starts populated.
//
// Each doc becomes a versioned row. Re-running bumps version when the content
// hash changes (content-addressed), so SOPs can evolve without losing history.
// ============================================================================

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { kbRead, kbUpsert } from '../kbSupabase.js';
import { evidence } from '../evidence.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = join(__dirname, '..', '..', '..');

// Known operational docs to seed the KB (relative to backend root's parent).
const DEFAULT_SOP_PATHS = [
  'HERMES_OPERATIONAL_CHARTER.md',
  'archive/docs/AGENT_GOVERNANCE.md',
  'archive/docs/AGENT_MIGRATION_AUDIT.md',
];

const ext = (n) => n.slice(n.lastIndexOf('.')).toLowerCase();
const isDoc = (n) => ['.md', '.json', '.txt'].includes(ext(n));

function listFiles(dir) {
  const out = [];
  let entries = [];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...listFiles(full));
    else if (isDoc(e.name)) out.push(full);
  }
  return out;
}

export async function collectSopDocs({ sopDir = '' } = {}) {
  const sources = [];
  if (sopDir && existsSync(sopDir)) {
    for (const f of listFiles(sopDir)) sources.push({ file: f, ref: sopDir + '/' + f.split(sopDir).pop().replace(/^[/\\]/, '') });
  }
  // Default: seed from the repo's operational docs if present.
  for (const rel of DEFAULT_SOP_PATHS) {
    const full = join(BACKEND_ROOT, '..', rel);
    if (existsSync(full)) sources.push({ file: full, ref: rel });
  }

  let imported = 0;
  let skipped = 0;
  for (const { file, ref } of sources) {
    let body = '';
    try {
      body = readFileSync(file, 'utf8');
    } catch {
      skipped += 1;
      continue;
    }
    const title = ref.split('/').pop().replace(/\.md$|\.json$|\.txt$/i, '');
    const contentHash = createHash('sha1').update(body).digest('hex').slice(0, 16);

    // De-dupe existing active doc with the same title; bump version only when
    // the content actually changed, so SOPs can evolve with a clean history.
    const existing = await kbRead('sop_docs', `title=eq.${encodeURIComponent(title)}&active=eq.true&limit=1`);
    const currentHash = existing.length ? (existing[0].detail && existing[0].detail.content_hash) : null;
    const version = existing.length ? (currentHash === contentHash ? existing[0].version : (existing[0].version || 1) + 1) : 1;
    const patch = {
      title,
      owner: 'ops',
      body_ref: ref,
      body,
      version,
      active: true,
      detail: { content_hash: contentHash },
      evidence: [evidence('sop_docs', existing.length ? existing[0].id : title, `content hash ${contentHash} from ${ref}`)],
    };
    const stored = existing.length
      ? await kbUpsert('sop_docs', { ...patch, id: existing[0].id }, 'id')
      : await kbUpsert('sop_docs', patch);
    if (stored) imported += 1; else skipped += 1;
  }
  return { imported, skipped, sources: sources.length };
}

export default { collectSopDocs };
