import { createClient } from '@supabase/supabase-js';
import { config } from './env.js';

// Secret key: bypass RLS, semua akses lewat backend.
export const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
  auth: { persistSession: false },
});
