import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://majqmlacdefktatvskld.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hanFtbGFjZGVma3RhdHZza2xkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NzA2MDgsImV4cCI6MjA3MzM0NjYwOH0.qEpwZkqgDQ9pM3sodOsZm8euWWx565PJBbOQuyqZv5k";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
