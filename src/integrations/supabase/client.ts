import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Lee del entorno Vite (.env.local tiene prioridad sobre .env)
// Fallback a los valores del proyecto principal si las vars no están definidas
const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
  "https://byaxcqhxxxdjogvdhyqn.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ??
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5YXhjcWh4eHhkam9ndmRoeXFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNzY2NzMsImV4cCI6MjA2NzY1MjY3M30.5fU9mm-e138uu1FQZgKh-6I-cpXdjV3xEanJJRo2pgE";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});