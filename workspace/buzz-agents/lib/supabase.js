// lib/supabase.js
// Supabase integration for DigitallyDefined agents
// Reads/writes to the shared Supabase backend

const SUPABASE_URL = process.env.BUZZ_SUPABASE_URL || 'https://dijjlppdljpcgyoakdnq.supabase.co';
const SUPABASE_ANON_KEY = process.env.BUZZ_SUPABASE_ANON_KEY || 'eyJhbG...';

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function saveQuizResult(data) {
  const { data: inserted, error } = await supabase
    .from('quiz_results')
    .insert({
      ...data,
      created_at: new Date().toISOString(),
    });
  
  if (error) {
    console.warn('Supabase save failed (non-critical):', error.message);
  }
  
  return inserted;
}

export async function loadUserProfile(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .limit(1);
  
  if (error) return null;
  return data ? data[0] : null;
}

export default supabase;
