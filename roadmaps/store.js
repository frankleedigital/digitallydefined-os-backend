import { uploadBuffer, downloadBuffer, deleteObject, listObjects } from '../lib/r2Storage.js';

const PREFIX = 'roadmaps/';

export async function storeRoadmap(entry) {
  const id = entry.id || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const payload = { ...entry, id, storedAt: new Date().toISOString() };
  await uploadBuffer(PREFIX + id + '.json', Buffer.from(JSON.stringify(payload, null, 2)), 'application/json');
  return payload;
}

export async function listRoadmaps() {
  const keys = await listObjects(PREFIX);
  const items = [];
  for (const key of keys) {
    if (!key.endsWith('.json')) continue;
    try {
      const buf = await downloadBuffer(key);
      items.push(JSON.parse(buf.toString('utf8')));
    } catch { /* skip corrupt */ }
  }
  return items.sort((a, b) => new Date(b.storedAt) - new Date(a.storedAt));
}

export async function getRoadmapById(id) {
  const buf = await downloadBuffer(PREFIX + id + '.json');
  return JSON.parse(buf.toString('utf8'));
}

export async function deleteRoadmap(id) {
  await deleteObject(PREFIX + id + '.json');
}
