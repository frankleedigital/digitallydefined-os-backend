// Loads the os-backend .env into process.env (no values printed).
import { readFileSync } from 'node:fs';
for (const line of readFileSync(new URL('../digitallydefined-os-backend/.env', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].trim();
}