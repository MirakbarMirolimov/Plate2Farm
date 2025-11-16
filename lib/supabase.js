import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://uzhrtsrhedmzaptqzfna.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6aHJ0c3JoZWRtemFwdHF6Zm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMTQyMzEsImV4cCI6MjA3ODc5MDIzMX0.Fh1FUkMzokBTcSeOokVIWka3EmJa_Wf69HQNTFL-u7U";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
