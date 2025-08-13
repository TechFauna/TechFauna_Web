import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aiqtjppndsjclenzmvem.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpcXRqcHBuZHNqY2xlbnptdmVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNDYzNDEsImV4cCI6MjA3MDYyMjM0MX0.EP87gZzZdsciI_3RrRqP22nsoYTrpX1o-X2bZJqVsG8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
