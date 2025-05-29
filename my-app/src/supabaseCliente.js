import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zognwavmiwcywwzxkrmg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvZ253YXZtaXdjeXd3enhrcm1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4Nzg0MzcsImV4cCI6MjA2MzQ1NDQzN30.oKbW7X-kjsjvrxASv0ARDiPO_IVFno3F8MRzhJlueSE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
