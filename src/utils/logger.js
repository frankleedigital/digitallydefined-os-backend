// src/utils/logger.js
export const logger = {
  info: (msg, data = {}) => console.log(JSON.stringify({ level: "info", msg, ...data, ts: new Date().toISOString() })),
  error: (msg, error = null) => console.error(JSON.stringify({ level: "error", msg, stack: error?.stack, ts: new Date().toISOString() })),
  warn: (msg, data = {}) => console.warn(JSON.stringify({ level: "warn", msg, ...data, ts: new Date().toISOString() })),
};

export default logger;
