import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials are missing. Define REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in your environment.',
  );
}

const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

export default supabase;
