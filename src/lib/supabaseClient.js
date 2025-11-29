import { createClient } from "@supabase/supabase-js";

// Fallback: kalau env nggak kebaca, pakai nilai langsung
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://nfqhictyurpjnnmaxvoj.supabase.co";

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "EYJHBGCI...ISI_FULL_ANON_KEY_KAMU_DI_SINI..."; // tempel anon public key

// Jangan lempar error lagi, biarkan jalan pakai fallback
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
