// src/utils/cache.js
const caches = new Map();

export function getCache(key) {
  const entry = caches.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    caches.delete(key);
    return null;
  }
  return entry.data;
}

export function setCache(key, data, ttlMs = 5 * 60 * 1000) {
  caches.set(key, { data, expiry: Date.now() + ttlMs });
}

export function clearCache(pattern) {
  if (!pattern) {
    caches.clear();
    return;
  }
  for (const key of caches.keys()) {
    if (key.includes(pattern)) caches.delete(key);
  }
}

export default { getCache, setCache, clearCache };
