// src/lib/config.js — central runtime configuration

const env = import.meta.env;

export const config = {
  supabaseUrl: env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY || '',
  backendUrl: (env.VITE_BACKEND_URL || 'http://localhost:3000').replace(/\/+$/, ''),
  dashboardApiKey: env.VITE_DASHBOARD_API_KEY || '',
  functionsUrl:
    (env.VITE_SUPABASE_FUNCTIONS_URL ||
      `${env.VITE_SUPABASE_URL || ''}/functions/v1`).replace(/\/+$/, ''),
};

export function assertConfig() {
  const missing = [];
  if (!config.supabaseUrl) missing.push('VITE_SUPABASE_URL');
  if (!config.supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY');
  if (missing.length) console.warn('[config] missing env vars:', missing.join(', '));
  return missing.length === 0;
}
