/**
 * test-architect-mapping.mjs
 *
 * Verifies the "DB wins" name mapping in lib/notion-architect.js: the Architect
 * must emit payload keys that match the LIVE Notion property names, and must
 * never emit read-only fields.
 *
 * Run: node scripts/test-architect-mapping.mjs
 */

const {
  NOTION_OS_DBS,
  getNotionDbId,
  getNotionPropName,
  getNotionTitleProp,
  getNotionDedupTuple,
  buildValidatedPageProperties,
  getNotionPropType,
} = await import('../lib/notion-architect.js');

const results = [];
function assert(name, condition, detail = '') {
  const pass = !!condition;
  results.push({ name, pass });
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${name}${pass || !detail ? '' : `\n         ${detail}`}`);
}

const keysOf = (obj) => Object.keys(obj || {}).sort().join(',');

console.log('\n=== Per-DB title property (DB wins) ===');
const titles = {
  money: 'Name',
  monthly: 'Name',
  reputation: 'Name',
  templates: 'Name',
  assets: 'Name',
  ideas: 'Name',
  content: 'Name',
  automations: 'Name',
};
for (const [db, expected] of Object.entries(titles)) {
  const t = getNotionTitleProp(db);
  assert(`${db}: title resolves to "${expected}"`, t && t.notionName === expected, `got ${JSON.stringify(t)}`);
}

console.log('\n=== Name aliasing (legacyPropNames) ===');
assert('money Name -> Name (canonical)', getNotionPropName('money', 'Name') === 'Name');
assert('monthly Name -> Name (canonical)', getNotionPropName('monthly', 'Name') === 'Name');
assert('reputation Signal -> Signal (canonical)', getNotionPropName('reputation', 'Signal') === 'Signal');
assert('templates Name -> Name (canonical)', getNotionPropName('templates', 'Name') === 'Name');

console.log('\n=== legacyPropNames accept old names ===');
assert('money has legacy "Month" on Name prop', NOTION_OS_DBS.money.properties.find((p) => p.name === 'Name').legacyNames.includes('Month'));
assert('monthly has legacy "Month" on Name prop', NOTION_OS_DBS.monthly.properties.find((p) => p.name === 'Name').legacyNames.includes('Month'));
assert('templates has legacy "Template Name" on Name prop', NOTION_OS_DBS.templates.properties.find((p) => p.name === 'Name').legacyNames.includes('Template Name'));
assert('templates has legacy "Type" on Format prop', NOTION_OS_DBS.templates.properties.find((p) => p.name === 'Format').legacyNames.includes('Type'));
assert('reputation has legacy "Sentiment" on Signal prop', NOTION_OS_DBS.reputation.properties.find((p) => p.name === 'Signal').legacyNames.includes('Sentiment'));

console.log('\n=== env var aliasing (assets) ===');
delete process.env.NOTION_ASSETS_DB_ID;
process.env.NOTION_DIGITAL_ASSETS_DB_ID = 'fce854435efe4e38ba0204b2f375e1c3';
assert('assets resolves via NOTION_DIGITAL_ASSETS_DB_ID alias',
  getNotionDbId('assets') === 'fce854435efe4e38ba0204b2f375e1c3', String(getNotionDbId('assets')));
process.env.NOTION_ASSETS_DB_ID = 'canonical-wins';
assert('canonical env var takes precedence over alias',
  getNotionDbId('assets') === 'canonical-wins', String(getNotionDbId('assets')));

console.log('\n=== getNotionPropType accepts both name styles ===');
assert('architect name resolves', getNotionPropType('templates', 'Format') === 'select');
assert('legacy name resolves', getNotionPropType('templates', 'Type') === 'select');

console.log('\n=== Dedup tuples keyed by canonical names ===');
const tuple = getNotionDedupTuple('money', { Name: '2026-09' });
assert('money dedup tuple uses "Name"', tuple && tuple.Name === '2026-09', JSON.stringify(tuple));
const tplTuple = getNotionDedupTuple('templates', { Name: 'Kit' });
assert('templates dedup tuple uses "Name"', tplTuple && tplTuple.Name === 'Kit', JSON.stringify(tplTuple));

console.log('\n=== Built payloads use canonical names ===');
const money = buildValidatedPageProperties('money', {
  Name: '2026-09',
  Revenue: 1200,
  Expenses: 200,
  Net: 1000,
});
assert('money builds ok', money.ok === true, money.error || '');
assert('money keys are canonical names',
  keysOf(money.properties) === 'Expenses,Name,Net,Revenue', keysOf(money.properties));
assert('money title lands on "Name"', !!money.properties?.Name?.title);
assert('money never emits CreatedTime', money.properties?.CreatedTime === undefined);
assert('money Revenue is a number', money.properties?.Revenue?.number === 1200);
// Legacy input still accepted
const moneyLegacy = buildValidatedPageProperties('money', {
  Month: '2026-09',
  Revenue: 1200,
});
assert('legacy input "Month" still builds ok', moneyLegacy.ok === true, moneyLegacy.error || '');
assert('legacy input resolves to canonical key "Name"', !!moneyLegacy.properties?.Name?.title);

const templates = buildValidatedPageProperties('templates', {
  Name: 'Lead Magnet Kit',
  Format: 'PDF',
  Status: 'live',
  Niche: 'faceless digital products',
});
assert('templates builds ok', templates.ok === true, templates.error || '');
assert('templates keys are canonical names',
  keysOf(templates.properties) === 'Format,Name,Niche,Status', keysOf(templates.properties));
assert('templates title lands on "Name"', !!templates.properties?.Name?.title);
assert('templates Status canonicalized live->Published',
  templates.properties?.Status?.select?.name === 'Published',
  templates.properties?.Status?.select?.name);
// Legacy input still accepted
const templatesLegacy = buildValidatedPageProperties('templates', {
  'Template Name': 'Lead Magnet Kit',
  Type: 'PDF',
});
assert('legacy input "Template Name" still builds ok', templatesLegacy.ok === true, templatesLegacy.error || '');
assert('legacy input "Type" resolves to canonical key "Format"', !!templatesLegacy.properties?.Format?.select);

const reputation = buildValidatedPageProperties('reputation', {
  Name: 'Trustpilot review',
  URL: 'https://example.com/r/1',
  Signal: 'Positive',
  Score: 5,
});
assert('reputation builds ok', reputation.ok === true, reputation.error || '');
assert('reputation Signal is written', reputation.properties?.Signal?.select?.name === 'Positive');
assert('reputation Score is written', reputation.properties?.Score?.number === 5);
// Legacy input still accepted
const repLegacy = buildValidatedPageProperties('reputation', {
  Name: 'Trustpilot review',
  'Sentiment': 'Positive',
  'Sentiment Score': 5,
});
assert('legacy input "Sentiment" still builds ok', repLegacy.ok === true, repLegacy.error || '');
assert('legacy "Sentiment" resolves to canonical key "Signal"', repLegacy.properties?.Signal?.select?.name === 'Positive');

const monthly = buildValidatedPageProperties('monthly', {
  Name: '2026-09',
  Wins: 'Shipped the OS',
  Risks: 'Low traffic',
  NextActions: 'Publish 4 posts',
});
assert('monthly builds ok', monthly.ok === true, monthly.error || '');
assert('monthly Wins lands on canonical key', !!monthly.properties?.Wins?.rich_text);
assert('monthly Risks is written', !!monthly.properties?.Risks?.rich_text);
// Legacy input still accepted
const monthlyLegacy = buildValidatedPageProperties('monthly', {
  Name: '2026-09',
  'Key Wins': 'Shipped the OS',
  Risks: 'Low traffic',
});
assert('legacy input "Key Wins" still builds ok', monthlyLegacy.ok === true, monthlyLegacy.error || '');
assert('legacy "Key Wins" resolves to canonical key "Wins"', !!monthlyLegacy.properties?.Wins?.rich_text);

console.log('\n=== Results ===');
const passed = results.filter((r) => r.pass).length;
console.log(`Passed: ${passed}/${results.length}`);
if (passed !== results.length) {
  console.log('Failed:', results.filter((r) => !r.pass).map((r) => r.name).join(' | '));
  process.exitCode = 1;
}
console.log('');
