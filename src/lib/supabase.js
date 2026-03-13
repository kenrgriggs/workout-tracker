import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
// "PUBLISHABLE" is this project's naming convention for the Supabase anon/public key.
// This key is intentionally safe to expose in the browser bundle — access control
// is enforced by Supabase RLS policies, not by keeping this key secret.
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// Module-level singleton. Every import across the app shares this one instance,
// which means a single connection and consistent auth state everywhere.
export const supabase = createClient(supabaseUrl, supabaseKey)
