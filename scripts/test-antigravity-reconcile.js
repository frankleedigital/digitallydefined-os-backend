import { test } from 'node:test';
import assert from 'node:assert/strict';

// Mock the antigravity module dependencies
const mockNotionDbId = new Map();
const mockWritableProps = new Map();

function mockGetNotionDbId(key) {
  return mockResults.get(key)?.dbId || null;
}

async function mockNotionRest(path, method, body) {
  const dbId = path.replace('/databases/', '');
  const liveProps = mockDbProps.get(dbId) || {};
  return { properties: liveProps };
}

const mockProps = new Map();
const mockWritablePropsMap = new Map();

// Mock the antigravity module functions
let mockGetNotionDbIdImpl = (key) => mockResults.get(key)?.dbId || null;
let mockGetWritableNotionProps = (key) => mockWritableProps.get(key) || [];
let mockNotionPropName = (prop) => prop;
let mockPropertyCreatePayload = (prop) => prop;

async function mockAntigravityUpdateDatabase({ databaseId, payload }) {
  mockProps.set(databaseId, { ...mockProps.get(databaseId) || {}, ...payload.properties });
  return { ok: true, databaseId, updated: Object.keys(payload.properties || {}) };
}

test('antigravityReconcileDatabase uses databaseId when provided directly', async () => {
  // Reset mocks
  mockResults.clear();
  mockWritablePropsMap.clear();
  mockProps.clear();

  mockResults.set('test-db-id', { dbId: 'test-db-id' });
  mockWritablePropsMap.set('test-db-id', [
    { name: 'Title', type: 'title' },
    { name: 'Status', type: 'select' },
  ]);

  const { antigravityReconcileDatabase } = await import('../lib/antigravity.js');

  const result = await antigravityReconcileDatabase({ databaseId: 'test-db-id', dbKey: 'ideas' });

  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.databaseId, 'test-db-id');
});

test('agents.orchestrate returns success:false when dbKey is invalid', async () => {
  mockResults.clear();
  mockWritablePropsMap.clear();

  const { antigravityReconcileDatabase } = await import('../lib/antigravity.js');

  const result = await antigravityReconcileDatabase({ dbKey: 'nonexistent-db' });

  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.error, 'databaseId is required (please provide a valid Notion database ID or dbKey)');
});

test('agents.orchestrate returns success:false when dbKey is missing and no databaseId', async () => {
  mockResults.clear();
  mockWritablePropsMap.clear();

  const { antigravityReconcileDatabase } = await import('../lib/antigravity.js');

  const result = await antigravityReconcileDatabase({});

  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.error, 'databaseId is required (please provide a valid Notion database ID or dbKey)');
});